import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, User as UserIcon, GraduationCap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { profileService } from '@/services/profileService'
import Avatar from '@/components/ui/Avatar'

interface UserSearchBarProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onSelectUser?: () => void
}

export default function UserSearchBar({
  placeholder = 'Search users by @username, name, or ID...',
  className,
  autoFocus = false,
  onSelectUser,
}: UserSearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced user search
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      setOpen(false)
      return
    }

    setLoading(true)
    setOpen(true)
    setSelectedIndex(-1)

    const timer = setTimeout(async () => {
      try {
        const users = await profileService.searchUsers(q)
        setResults(users)
      } catch (err) {
        console.error('Failed to search users:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback(
    (userId: string) => {
      setOpen(false)
      setQuery('')
      if (onSelectUser) onSelectUser()
      navigate(`/user/${userId}`)
    },
    [navigate, onSelectUser],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]._id)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Extract student ID or email prefix from email if available (e.g. 202301422 from 202301422@dau.ac.in)
  const getEmailPrefix = (email?: string) => {
    if (!email) return null
    return email.split('@')[0]
  }

  return (
    <div ref={containerRef} className={clsx('relative w-full', className)}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={clsx(
            'w-full h-9 pl-9 pr-8 rounded-[var(--radius-md)] text-xs sm:text-sm',
            'bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:[var(--text-tertiary)]',
            'border border-[var(--border-secondary)] focus:border-[var(--color-primary-500)]/60',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/20',
            'transition-all duration-200 shadow-xs',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-2.5 p-0.5 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Floating Live Results Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute top-full left-0 right-0 z-50 mt-1.5 overflow-hidden',
              'bg-[var(--surface-elevated)] border border-[var(--border-secondary)]',
              'rounded-[var(--radius-lg)] shadow-xl divide-y divide-[var(--border-secondary)]',
              'max-h-80 overflow-y-auto',
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2 p-3 text-xs text-[var(--text-tertiary)] justify-center">
                <div className="w-3.5 h-3.5 border-2 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
                <span>Searching users...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Users
                </div>
                {results.map((u, idx) => {
                  const isSelected = idx === selectedIndex
                  const emailPrefix = getEmailPrefix(u.email)
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => handleSelect(u._id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors',
                        isSelected ? 'bg-[var(--color-primary-500)]/12' : 'hover:bg-[var(--bg-secondary)]',
                      )}
                    >
                      <Avatar src={u.avatar} name={u.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {u.name}
                          </span>
                          {u.username && (
                            <span className="text-[11px] font-medium text-[var(--color-primary-500)] truncate">
                              @{u.username}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
                          {emailPrefix && (
                            <span className="font-mono bg-[var(--bg-tertiary)] px-1 py-0.2 rounded text-[var(--text-secondary)]">
                              ID: {emailPrefix}
                            </span>
                          )}
                          {u.college && (
                            <span className="flex items-center gap-0.5 truncate">
                              <GraduationCap size={10} />
                              {u.college}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[var(--text-tertiary)]">
                No users found for &quot;{query}&quot;
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
