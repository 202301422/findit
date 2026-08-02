import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Home as HomeIcon, ArrowLeft, ShoppingBag } from 'lucide-react'

export default function NotFoundPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-[var(--surface-card)] p-8 rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-md">
        {/* Visual Badge */}
        <div className="relative inline-flex items-center justify-center">
          <span className="text-7xl font-extrabold text-[var(--color-primary-500)]/20 select-none">404</span>
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-[var(--color-primary-500)]">
            FindIt
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Page not found</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Sorry, we couldn&apos;t find the page or listing you were looking for. It may have been removed or relocated.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus listings..."
            aria-label="Search campus listings from 404 page"
            className="w-full h-10 pl-9 pr-20 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white rounded-[var(--radius-md)] transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-lg)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
          <Link
            to="/home"
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ShoppingBag size={14} />
            <span>Go to Marketplace</span>
          </Link>
          <Link
            to="/home"
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-lg)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5"
          >
            <HomeIcon size={14} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
