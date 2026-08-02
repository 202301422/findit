import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, X, Tag, Package, Ticket, MapPin, Sparkles, User as UserIcon, ArrowLeft, ShoppingBag } from 'lucide-react'
import api from '@/utils/api'
import ProductCard from '@/components/product/ProductCard'
import UserSearchBar from '@/components/ui/UserSearchBar'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'

type SearchTab = 'all' | 'marketplace' | 'lost-found' | 'tickets' | 'users'

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialQuery = searchParams.get('q') || ''
  const initialCategory = (searchParams.get('tab') as SearchTab) || 'all'

  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<SearchTab>(initialCategory)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent')

  useScrollRestoration(`search_${activeTab}`, items.length > 0)

  const fetchSearchResults = useCallback(async (q: string, tab: SearchTab) => {
    if (!q.trim()) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const res = await api.get('/search', { params: { q, type: tab, sort: sortBy } })
      const data = res.data?.data?.results || res.data?.data || []
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Search failed:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [sortBy])

  useEffect(() => {
    fetchSearchResults(query, activeTab)
  }, [query, activeTab, fetchSearchResults])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: query, tab: activeTab })
    fetchSearchResults(query, activeTab)
  }

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab)
    setSearchParams({ q: query, tab })
  }

  const clearSearch = () => {
    setQuery('')
    setSearchParams({})
    setItems([])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-3">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--surface-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Header & Main Search Bar */}
      <div className="bg-[var(--surface-card)] p-6 rounded-[var(--radius-xl)] border border-[var(--border-primary)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Search className="w-6 h-6 text-[var(--color-primary-500)]" />
              Search FindIt
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Find products, lost items, event passes, traveling tickets, or fellow students across campus.
            </p>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, location, or listing title..."
              aria-label="Search FindIt items and users"
              className="w-full h-12 pl-11 pr-10 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-12 px-6 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-medium rounded-[var(--radius-lg)] shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm cursor-pointer"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Tabs Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'All Results', icon: Sparkles },
            { id: 'marketplace', label: 'Marketplace', icon: Package },
            { id: 'lost-found', label: 'Lost & Found', icon: MapPin },
            { id: 'tickets', label: 'Tickets & Passes', icon: Ticket },
            { id: 'users', label: 'Users', icon: UserIcon },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as SearchTab)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[var(--radius-full)] whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)] shadow-xs'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Content */}
      {activeTab === 'users' ? (
        <div className="bg-[var(--surface-card)] p-6 rounded-[var(--radius-xl)] border border-[var(--border-primary)] shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            User Search
          </h2>
          <UserSearchBar autoFocus placeholder="Type name, @username, or student ID..." />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-64 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Found {items.length} result(s) for &quot;{query}&quot;</span>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="sr-only">Sort search results</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--text-primary)]"
              >
                <option value="recent">Most Recent</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ProductCard key={item._id || item.id} item={item} type={item.type || 'sell'} tabLabel="Search" />
            ))}
          </div>
        </div>
      ) : query ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-[var(--color-primary-500)]" />}
          title="No results found"
          description={`We couldn't find any items matching "${query}". Try adjusting your query or switching tabs.`}
          action={
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-2 text-xs font-semibold bg-[var(--color-primary-500)] text-white rounded-[var(--radius-lg)] hover:bg-[var(--color-primary-600)] transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <Link
                to="/home"
                className="px-4 py-2 text-xs font-semibold border border-[var(--border-primary)] bg-[var(--surface-card)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-[var(--radius-lg)] transition-colors flex items-center gap-1.5"
              >
                <ShoppingBag size={14} />
                <span>Go to Marketplace</span>
              </Link>
            </div>
          }
        />
      ) : (
        <EmptyState
          icon={<Tag className="w-8 h-8 text-[var(--color-primary-500)]" />}
          title="Start searching"
          description="Type keywords above to discover items, lost property, passes, or university peers."
          action={
            <Link
              to="/home"
              className="px-4 py-2 text-xs font-semibold bg-[var(--color-primary-500)] text-white rounded-[var(--radius-lg)] hover:bg-[var(--color-primary-600)] transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingBag size={14} />
              <span>Go to Marketplace</span>
            </Link>
          }
        />
      )}
    </div>
  )
}
