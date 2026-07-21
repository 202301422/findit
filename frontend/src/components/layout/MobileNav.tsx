import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react'
import { clsx } from 'clsx'
import { getTotalUnread } from '@/services/chatService'
import { useEffect, useState } from 'react'

const TABS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/add-item', label: 'Post', icon: Plus, isAction: true },
  { to: '/messages', label: 'Messages', icon: MessageCircle, showBadge: true },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function MobileNav() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchUnread = async () => {
      try {
        const count = await getTotalUnread()
        if (!cancelled) setUnreadCount(count)
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-[var(--bg-primary)] border-t border-[var(--border-secondary)]',
        'glass-strong',
        'safe-area-inset-bottom',
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon

          if (tab.isAction) {
            return (
              <button
                key={tab.to}
                onClick={() => navigate(tab.to)}
                className={clsx(
                  'flex flex-col items-center justify-center gap-0.5',
                  '-mt-4 w-12 h-12 rounded-full',
                  'bg-[var(--color-primary-500)] text-white shadow-lg',
                  'hover:bg-[var(--color-primary-600)] active:scale-95 transition-all cursor-pointer',
                )}
                aria-label={tab.label}
              >
                <Icon size={22} strokeWidth={2.5} />
              </button>
            )
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                clsx(
                  'relative flex flex-col items-center justify-center gap-0.5 px-3 py-1',
                  'text-[11px] font-medium transition-colors',
                  isActive
                    ? 'text-[var(--color-primary-500)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
                )
              }
            >
              <div className="relative">
                <Icon size={20} />
                {tab.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white bg-[var(--color-error-500)] rounded-full ring-2 ring-[var(--bg-primary)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
