import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { clsx } from 'clsx'

import api from '@/utils/api'
import ProductGrid from '@/components/product/ProductGrid'
import Button from '@/components/ui/Button'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

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

export default function Home() {
  const [selected, setSelected] = useState(
    () => sessionStorage.getItem('home_tab') || 'Buy & Sell',
  )
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState(0)
  const [isNegotiable, setIsNegotiable] = useState('')
  const [hasWarranty, setHasWarranty] = useState('')
  const [sort, setSort] = useState('')
  const [dateAfter, setDateAfter] = useState('')
  const [dateBefore, setDateBefore] = useState('')
  const [minSeats, setMinSeats] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Infinite scroll state
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Track the current filter "signature" to reset on any filter change
  const filterKey = useMemo(() => JSON.stringify({
    selected, selectedCategory, maxPrice, isNegotiable, hasWarranty,
    sort, searchQuery, dateAfter, dateBefore, minSeats
  }), [selected, selectedCategory, maxPrice, isNegotiable, hasWarranty, sort, searchQuery, dateAfter, dateBefore, minSeats])

  const navigate = useNavigate()

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

  // Listen for tab changes from navbar
  useEffect(() => {
    const handler = () => {
      const tab = sessionStorage.getItem('home_tab')
      if (tab && tab !== selected) {
        setSelected(tab)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [selected])

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

  // Reset and fetch first page on filter/tab changes
  useEffect(() => {
    let cancelled = false
    const fetchFirstPage = async () => {
      setLoading(true)
      setItems([])
      setPage(1)
      setHasMore(false)
      try {
        const params = buildParams(1)
        const response = await api.get(`/feed/list?${params.toString()}`)
        if (!cancelled && response.data.success) {
          setItems(response.data.data.items)
          setHasMore(response.data.data.hasNextPage)
          setPage(1)
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
      const params = buildParams(nextPage)
      const response = await api.get(`/feed/list?${params.toString()}`)
      if (response.data.success) {
        setItems((prev) => [...prev, ...response.data.data.items])
        setHasMore(response.data.data.hasNextPage)
        setPage(nextPage)
      }
    } catch (error) {
      console.error('Failed to load more items:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, buildParams])

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

  return (
    <div className="space-y-6">
      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={clsx(
          'relative rounded-[var(--radius-xl)] overflow-hidden',
          'bg-gradient-to-br from-[var(--color-primary-500)] via-[var(--color-primary-600)] to-[var(--color-primary-700)]',
          'p-6 sm:p-8 lg:p-10',
        )}
      >
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-sm" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-sm" />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Your Campus Marketplace
          </h1>
          <p className="text-sm sm:text-base text-white/80 mb-5">
            Find what you need from fellow students — buy, sell, trade, and more.
          </p>

          {/* Search bar in hero */}
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Search for items, tickets, passes, venue, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx(
                'w-full h-10 pl-10 pr-4 rounded-[var(--radius-md)]',
                'bg-white/95 text-gray-900 text-xs sm:text-sm',
                'placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-white/30',
                'shadow-md hover:shadow-lg transition-shadow',
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Section Title + Filters Trigger ── */}
      <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {selected}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<SlidersHorizontal size={14} />}
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(showFilters && '!bg-[var(--color-primary-500)]/8 !text-[var(--color-primary-500)]')}
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

          {/* Negotiable filter */}
          {selected !== 'Lost & Found' && (
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
          {selected !== 'Lost & Found' && (
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
          {selected !== 'Buy & Sell' && (
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
        emptyTitle={`No ${selected} items found`}
        emptyDescription={
          selectedCategory || maxPrice > 0 || searchQuery
            ? 'Try clearing your filters or search terms to see more results.'
            : 'Be the first to post something!'
        }
        emptyAction={
          <Button
            variant="primary"
            onClick={() => navigate('/add-item')}
          >
            Post an Item
          </Button>
        }
      />
    </div>
  )
}
