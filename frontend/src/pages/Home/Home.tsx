import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, Users } from 'lucide-react'
import { clsx } from 'clsx'

import api from '@/utils/api'
import { profileService } from '@/services/profileService'
import ProductGrid from '@/components/product/ProductGrid'
import Button from '@/components/ui/Button'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'

const LIMIT = 12

const getBackendType = (tab: string) => {
  switch (tab) {
    case 'Buy & Sell': return 'sell'
    case 'Lost & Found': return 'found'
    case 'Travelling Tickets': return 'ticket'
    case 'Event Passes': return 'pass'
    default: return 'sell'
  }
}

interface TabSnapshot {
  items: any[]
  page: number
  hasMore: boolean
  searchQuery: string
  selectedCategory: string
  maxPrice: number
  isNegotiable: string
  hasWarranty: string
  sort: string
  dateAfter: string
  dateBefore: string
  minSeats: string
  showFilters: boolean
  scrollY: number
  lastOpenedItemId?: string
  timestamp: number
}

function getStoredSnapshots(): Record<string, TabSnapshot> {
  try {
    const raw = sessionStorage.getItem('findit_home_snapshots_v1')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredSnapshot(tab: string, snapshot: TabSnapshot) {
  try {
    const current = getStoredSnapshots()
    current[tab] = snapshot
    sessionStorage.setItem('findit_home_snapshots_v1', JSON.stringify(current))
  } catch {}
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Resolve initial tab from URL or session storage
  const initialTab = useMemo(() => {
    const paramTab = searchParams.get('tab')
    if (paramTab && ['Buy & Sell', 'Lost & Found', 'Travelling Tickets', 'Event Passes', 'Following'].includes(paramTab)) {
      return paramTab
    }
    return sessionStorage.getItem('home_tab') || 'Buy & Sell'
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState<string>(initialTab)

  // Try reading snapshot for current tab
  const snapshot = useMemo(() => getStoredSnapshots()[selected] || null, [selected])

  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return searchParams.get('category') || snapshot?.selectedCategory || ''
  })
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const param = searchParams.get('maxPrice')
    return param ? Number(param) : snapshot?.maxPrice || 0
  })
  const [isNegotiable, setIsNegotiable] = useState<string>(() => {
    return searchParams.get('isNegotiable') || snapshot?.isNegotiable || ''
  })
  const [hasWarranty, setHasWarranty] = useState<string>(() => {
    return searchParams.get('hasWarranty') || snapshot?.hasWarranty || ''
  })
  const [sort, setSort] = useState<string>(() => {
    return searchParams.get('sort') || snapshot?.sort || ''
  })
  const [dateAfter, setDateAfter] = useState<string>(() => {
    return searchParams.get('dateAfter') || snapshot?.dateAfter || ''
  })
  const [dateBefore, setDateBefore] = useState<string>(() => {
    return searchParams.get('dateBefore') || snapshot?.dateBefore || ''
  })
  const [minSeats, setMinSeats] = useState<string>(() => {
    return searchParams.get('minSeats') || snapshot?.minSeats || ''
  })
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return searchParams.get('q') || snapshot?.searchQuery || ''
  })
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    return snapshot?.showFilters || false
  })

  // Infinite scroll state
  const [items, setItems] = useState<any[]>(() => snapshot?.items || [])
  const [page, setPage] = useState<number>(() => snapshot?.page || 1)
  const [hasMore, setHasMore] = useState<boolean>(() => snapshot?.hasMore || false)
  const [loading, setLoading] = useState<boolean>(!snapshot?.items?.length)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

  const isRestoredRef = useRef<boolean>(Boolean(snapshot?.items?.length))
  const isInitialMountRef = useRef<boolean>(true)

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', selected)
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedCategory) params.set('category', selectedCategory)
    if (sort) params.set('sort', sort)
    if (maxPrice > 0) params.set('maxPrice', String(maxPrice))
    if (isNegotiable) params.set('isNegotiable', isNegotiable)
    if (hasWarranty) params.set('hasWarranty', hasWarranty)
    if (dateAfter) params.set('dateAfter', dateAfter)
    if (dateBefore) params.set('dateBefore', dateBefore)
    if (minSeats) params.set('minSeats', minSeats)
    setSearchParams(params, { replace: true })
  }, [selected, searchQuery, selectedCategory, sort, maxPrice, isNegotiable, hasWarranty, dateAfter, dateBefore, minSeats, setSearchParams])

  // Save tab state snapshot to sessionStorage on state change
  useEffect(() => {
    saveStoredSnapshot(selected, {
      items,
      page,
      hasMore,
      searchQuery,
      selectedCategory,
      maxPrice,
      isNegotiable,
      hasWarranty,
      sort,
      dateAfter,
      dateBefore,
      minSeats,
      showFilters,
      scrollY: window.scrollY,
      lastOpenedItemId: sessionStorage.getItem('findit_last_opened_item_id') || undefined,
      timestamp: Date.now(),
    })
  }, [selected, items, page, hasMore, searchQuery, selectedCategory, maxPrice, isNegotiable, hasWarranty, sort, dateAfter, dateBefore, minSeats, showFilters])

  // Automatically track and restore exact scroll position when returning from product detail
  useScrollRestoration(`home_${selected}`, items.length > 0)

  // Filter key signature to detect filter changes
  const filterKey = useMemo(() => JSON.stringify({
    selected, selectedCategory, maxPrice, isNegotiable, hasWarranty,
    sort, searchQuery, dateAfter, dateBefore, minSeats
  }), [selected, selectedCategory, maxPrice, isNegotiable, hasWarranty, sort, searchQuery, dateAfter, dateBefore, minSeats])

  // Listen for tab changes from navbar
  useEffect(() => {
    const handler = () => {
      const tab = sessionStorage.getItem('home_tab')
      if (tab && tab !== selected) {
        setSelected(tab)
        // Restore tab snapshot if present
        const tabSnap = getStoredSnapshots()[tab]
        if (tabSnap) {
          setItems(tabSnap.items || [])
          setPage(tabSnap.page || 1)
          setHasMore(tabSnap.hasMore || false)
          setSearchQuery(tabSnap.searchQuery || '')
          setSelectedCategory(tabSnap.selectedCategory || '')
          setMaxPrice(tabSnap.maxPrice || 0)
          setIsNegotiable(tabSnap.isNegotiable || '')
          setHasWarranty(tabSnap.hasWarranty || '')
          setSort(tabSnap.sort || '')
          setDateAfter(tabSnap.dateAfter || '')
          setDateBefore(tabSnap.dateBefore || '')
          setMinSeats(tabSnap.minSeats || '')
          setShowFilters(tabSnap.showFilters || false)
          isRestoredRef.current = true
        } else {
          setItems([])
          setPage(1)
          setHasMore(false)
          setSelectedCategory('')
          setMaxPrice(0)
          setIsNegotiable('')
          setHasWarranty('')
          setSort('')
          setDateAfter('')
          setDateBefore('')
          setMinSeats('')
          setSearchQuery('')
          isRestoredRef.current = false
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [selected])

  // Listen for AI assistant filter application
  useEffect(() => {
    const applyFilterPayload = (filters: any, tabLabel?: string) => {
      const primaryType = filters.types && filters.types.length > 0 ? filters.types[0] : 'sell'
      const targetTab = tabLabel || (primaryType === 'found' ? 'Lost & Found' : primaryType === 'ticket' ? 'Travelling Tickets' : primaryType === 'pass' ? 'Event Passes' : 'Buy & Sell')
      
      setSelected(targetTab)
      sessionStorage.setItem('home_tab', targetTab)
      
      setSearchQuery(filters.search || '')
      setSelectedCategory(filters.category || '')
      setMaxPrice(filters.maxPrice ? Number(filters.maxPrice) : 0)
      setIsNegotiable(filters.isNegotiable !== undefined && filters.isNegotiable !== null ? String(filters.isNegotiable) : '')
      setHasWarranty(filters.hasWarranty !== undefined && filters.hasWarranty !== null ? String(filters.hasWarranty) : '')
      setSort(filters.sort || '')
      setDateAfter(filters.dateAfter || '')
      setDateBefore(filters.dateBefore || '')
      setMinSeats(filters.minSeats ? String(filters.minSeats) : '')
      setShowFilters(true)

      isRestoredRef.current = false
      setItems([])
      setPage(1)

      window.scrollTo({ top: 300, behavior: 'smooth' })
    }

    const customEventHandler = (e: any) => {
      if (e.detail?.filters) {
        applyFilterPayload(e.detail.filters, e.detail.tabLabel)
      }
    }

    const storedPending = sessionStorage.getItem('findit_assistant_pending_filter')
    if (storedPending) {
      try {
        const parsed = JSON.parse(storedPending)
        sessionStorage.removeItem('findit_assistant_pending_filter')
        applyFilterPayload(parsed)
      } catch {
        sessionStorage.removeItem('findit_assistant_pending_filter')
      }
    }

    window.addEventListener('findit_apply_assistant_filter', customEventHandler)
    return () => window.removeEventListener('findit_apply_assistant_filter', customEventHandler)
  }, [])

  // Real-time: hide removed items
  useEffect(() => {
    const handleStatusUpdate = (e: any) => {
      const { itemId, status } = e.detail || {}
      if (!itemId) return
      if (status !== 'active') {
        setItems((prev) => prev.filter((item) => item._id !== itemId))
      }
    }
    window.addEventListener('findit_item_status_updated', handleStatusUpdate)
    return () => window.removeEventListener('findit_item_status_updated', handleStatusUpdate)
  }, [])

  // Fetch categories on tab change
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const type = getBackendType(selected)
        const response = await api.get(`/feed/categories?type=${type}`)
        if (response.data.success) {
          setCategories(response.data.data.categories)
        }
      } catch (error) {
        console.error(`Failed to fetch categories for ${selected}:`, error)
      }
    }
    fetchCategories()
  }, [selected])

  // Build params for the feed API
  const buildParams = useCallback((p: number) => {
    const type = getBackendType(selected)
    const params = new URLSearchParams({ type, page: String(p), limit: String(LIMIT) })
    if (selectedCategory) params.set('category', selectedCategory)
    if (maxPrice > 0) params.set('maxPrice', String(maxPrice))
    if (isNegotiable) params.set('isNegotiable', isNegotiable)
    if (hasWarranty) params.set('hasWarranty', hasWarranty)
    if (sort) params.set('sort', sort)
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    if (dateAfter) params.set('dateAfter', dateAfter)
    if (dateBefore) params.set('dateBefore', dateBefore)
    if (minSeats) params.set('minSeats', minSeats)
    return params
  }, [selected, selectedCategory, maxPrice, isNegotiable, hasWarranty, sort, searchQuery, dateAfter, dateBefore, minSeats])

  // Reset and fetch first page on filter/tab changes (unless restored)
  useEffect(() => {
    if (isInitialMountRef.current && isRestoredRef.current) {
      isInitialMountRef.current = false
      setLoading(false)
      return
    }
    isInitialMountRef.current = false

    let cancelled = false
    const fetchFirstPage = async () => {
      setLoading(true)
      setItems([])
      setPage(1)
      setHasMore(false)
      try {
        if (selected === 'Following') {
          const data = await profileService.getFollowingFeed(1, LIMIT)
          if (!cancelled) {
            setItems(data.listings)
            setHasMore(data.hasNextPage)
            setPage(1)
          }
        } else {
          const params = buildParams(1)
          const response = await api.get(`/feed/list?${params.toString()}`)
          if (!cancelled && response.data.success) {
            setItems(response.data.data.items)
            setHasMore(response.data.data.hasNextPage)
            setPage(1)
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${selected} data:`, error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchFirstPage, 300)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [filterKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load more handler (called by infinite scroll hook)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      if (selected === 'Following') {
        const data = await profileService.getFollowingFeed(nextPage, LIMIT)
        setItems((prev) => [...prev, ...data.listings])
        setHasMore(data.hasNextPage)
        setPage(nextPage)
      } else {
        const params = buildParams(nextPage)
        const response = await api.get(`/feed/list?${params.toString()}`)
        if (response.data.success) {
          setItems((prev) => [...prev, ...response.data.data.items])
          setHasMore(response.data.data.hasNextPage)
          setPage(nextPage)
        }
      }
    } catch (error) {
      console.error('Failed to load more items:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, buildParams, selected])

  const sentinelRef = useInfiniteScroll({ hasMore, loading: loadingMore, onLoadMore: loadMore })

  // Local frontend filtering for search (instant feel)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter((item) => {
      const name = item.name || (item.origin?.city && item.destination?.city && `${item.origin.city} → ${item.destination.city}`) || item.ticketType || ''
      const category = item.category || ''
      const description = item.description || ''
      
      let venueStr = ''
      if (typeof item.venue === 'string') {
        venueStr = item.venue
      } else if (item.venue && typeof item.venue === 'object') {
        venueStr = `${item.venue.area || ''} ${item.venue.city || ''} ${item.venue.state || ''}`
      }
      const originStr = item.origin ? `${item.origin.area || ''} ${item.origin.city || ''} ${item.origin.state || ''}` : ''
      const destStr = item.destination ? `${item.destination.area || ''} ${item.destination.city || ''} ${item.destination.state || ''}` : ''
      const locationStr = item.locationFound || item.location || ''
      const dateStr = item.dateTime ? new Date(item.dateTime).toLocaleString() : item.departureTime ? new Date(item.departureTime).toLocaleString() : ''

      return (
        name.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        venueStr.toLowerCase().includes(q) ||
        originStr.toLowerCase().includes(q) ||
        destStr.toLowerCase().includes(q) ||
        locationStr.toLowerCase().includes(q) ||
        dateStr.toLowerCase().includes(q)
      )
    })
  }, [items, searchQuery])

  const hasActiveFilters = Boolean(
    selectedCategory || maxPrice > 0 || isNegotiable || hasWarranty || sort || dateAfter || dateBefore || minSeats
  )

  const clearAllFilters = () => {
    setSelectedCategory('')
    setMaxPrice(0)
    setIsNegotiable('')
    setHasWarranty('')
    setSort('')
    setDateAfter('')
    setDateBefore('')
    setMinSeats('')
  }

  const isFollowing = selected === 'Following'

  return (
    <div className="space-y-6">
      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={clsx(
          'relative rounded-[var(--radius-xl)] overflow-hidden p-6 sm:p-8 lg:p-10 transition-all duration-300 shadow-md',
          isFollowing
            ? 'bg-[linear-gradient(115deg,#06B6D4_0%,#0891B2_55%,#155E75_100%)] text-white'
            : 'bg-gradient-to-br from-[var(--color-primary-500)] via-[var(--color-primary-600)] to-[var(--color-primary-700)] text-white',
        )}
      >
        {/* Decorative background blurs */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-sm pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-sm pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-2.5">
            {isFollowing && <Users className="w-7 h-7 text-white/90 shrink-0" />}
            <span>{isFollowing ? 'Your Following Feed' : 'Your Campus Marketplace'}</span>
          </h1>
          <p className="text-sm sm:text-base text-white/85 mb-5 font-normal leading-relaxed">
            {isFollowing
              ? 'Stay updated with posts, listings, and updates from university peers you follow.'
              : 'Find what you need from fellow students — buy, sell, trade, and more.'}
          </p>

          {/* Search bar in hero */}
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder={isFollowing ? 'Search posts from followed peers...' : 'Search for items, tickets, passes, venue, location...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx(
                'w-full h-10 pl-10 pr-4 rounded-[var(--radius-md)]',
                'bg-white/95 text-gray-900 text-xs sm:text-sm',
                'placeholder:text-gray-400',
                isFollowing
                  ? 'focus:outline-none focus:ring-2 focus:ring-[var(--following-focus)]'
                  : 'focus:outline-none focus:ring-2 focus:ring-white/30',
                'shadow-md hover:shadow-lg transition-shadow',
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Section Title + Filters Trigger ── */}
      <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span>{selected}</span>
          {isFollowing && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--following-soft)] text-[var(--following-primary)] dark:text-[var(--following-text)]">
              Community
            </span>
          )}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<SlidersHorizontal size={14} />}
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            showFilters && (
              isFollowing
                ? '!bg-[var(--following-soft)] !text-[var(--following-primary)] dark:!text-[var(--following-text)]'
                : '!bg-[var(--color-primary-500)]/8 !text-[var(--color-primary-500)]'
            )
          )}
        >
          Filters {hasActiveFilters && '•'}
        </Button>
      </div>

      {/* ── Expandable Filters ── */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={clsx(
            'flex flex-wrap items-center gap-3 p-4 rounded-[var(--radius-lg)]',
            'bg-[var(--surface-card)] border border-[var(--border-secondary)]',
          )}
        >
          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={clsx(
                'h-8 px-3 rounded-[var(--radius-sm)] text-sm',
                'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                'text-[var(--text-primary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
              )}
            >
              <option value="">Latest / Default</option>
              {selected !== 'Lost & Found' && <option value="price_asc">Price: Low to High</option>}
              {selected !== 'Lost & Found' && <option value="price_desc">Price: High to Low</option>}
              {selected === 'Buy & Sell' && <option value="usage_asc">Usage: Shortest First</option>}
              {selected === 'Buy & Sell' && <option value="usage_desc">Usage: Longest First</option>}
            </select>
          </div>

          {/* Category filter */}
          {selected !== 'Following' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={clsx(
                  'h-8 px-3 rounded-[var(--radius-sm)] text-sm',
                  'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                  'text-[var(--text-primary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                )}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Negotiable filter */}
          {selected !== 'Lost & Found' && selected !== 'Following' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Price Negotiation
              </label>
              <select
                value={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.value)}
                className={clsx(
                  'h-8 px-3 rounded-[var(--radius-sm)] text-sm',
                  'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                  'text-[var(--text-primary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                )}
              >
                <option value="">All</option>
                <option value="true">Negotiable Only</option>
                <option value="false">Fixed Price Only</option>
              </select>
            </div>
          )}

          {/* Warranty filter (Buy & Sell only) */}
          {selected === 'Buy & Sell' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Warranty
              </label>
              <select
                value={hasWarranty}
                onChange={(e) => setHasWarranty(e.target.value)}
                className={clsx(
                  'h-8 px-3 rounded-[var(--radius-sm)] text-sm',
                  'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                  'text-[var(--text-primary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                )}
              >
                <option value="">All</option>
                <option value="true">Has Warranty</option>
                <option value="false">No Warranty</option>
              </select>
            </div>
          )}

          {/* Price filter */}
          {selected !== 'Lost & Found' && selected !== 'Following' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Max Price
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  inputMode="numeric"
                  value={maxPrice === 0 ? '' : maxPrice}
                  onChange={(e) => {
                    const v = e.target.value
                    setMaxPrice(v === '' ? 0 : Math.max(0, Number(v)))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault()
                  }}
                  placeholder="Any"
                  className={clsx(
                    'h-8 w-28 pl-6 pr-3 rounded-[var(--radius-sm)] text-sm',
                    'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                    'text-[var(--text-primary)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                  )}
                />
              </div>
            </div>
          )}

          {/* Min Seats filter */}
          {(selected === 'Travelling Tickets' || selected === 'Event Passes') && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Min Seats
              </label>
              <input
                type="number"
                min="1"
                placeholder="Any"
                value={minSeats}
                onChange={(e) => setMinSeats(e.target.value)}
                className={clsx(
                  'h-8 w-20 px-2 rounded-[var(--radius-sm)] text-sm',
                  'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                  'text-[var(--text-primary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                )}
              />
            </div>
          )}

          {/* Date & Time Filters */}
          {selected !== 'Buy & Sell' && selected !== 'Following' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  {selected === 'Lost & Found' ? 'Found After' : selected === 'Travelling Tickets' ? 'Departure After' : 'Event After'}
                </label>
                <input
                  type="datetime-local"
                  value={dateAfter}
                  onChange={(e) => setDateAfter(e.target.value)}
                  className={clsx(
                    'h-8 px-2 rounded-[var(--radius-sm)] text-xs',
                    'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                    'text-[var(--text-primary)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                  )}
                />
              </div>

              {selected !== 'Lost & Found' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    {selected === 'Travelling Tickets' ? 'Departure Before' : 'Event Before'}
                  </label>
                  <input
                    type="datetime-local"
                    value={dateBefore}
                    onChange={(e) => setDateBefore(e.target.value)}
                    className={clsx(
                      'h-8 px-2 rounded-[var(--radius-sm)] text-xs',
                      'bg-[var(--bg-primary)] border border-[var(--border-primary)]',
                      'text-[var(--text-primary)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<X size={12} />}
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          )}
        </motion.div>
      )}

      {/* ── Product Grid with Infinite Scroll ── */}
      <ProductGrid
        items={filteredItems}
        type={getBackendType(selected)}
        tabLabel={selected}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        sentinelRef={sentinelRef}
        emptyTitle={isFollowing ? 'No posts from followed users' : `No ${selected} items found`}
        emptyDescription={
          isFollowing
            ? 'Follow campus peers, buyers, and sellers to see their latest listings and updates here.'
            : selectedCategory || maxPrice > 0 || searchQuery
              ? 'Try clearing your filters or search terms to see more results.'
              : 'Be the first to post something!'
        }
        emptyAction={
          isFollowing ? (
            <Button
              variant="primary"
              onClick={() => navigate('/search?tab=users')}
              className="!bg-[var(--following-primary)] hover:!bg-[var(--following-primary-hover)] text-white cursor-pointer font-semibold shadow-sm"
            >
              Discover Students to Follow
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => navigate('/add-item')}
            >
              Post an Item
            </Button>
          )
        }
      />
    </div>
  )
}
