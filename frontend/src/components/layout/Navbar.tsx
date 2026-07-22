import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  MessageCircle,
  Menu,
  X,
  ShoppingBag,
  MapPin,
  Ticket,
  CalendarDays,
  LogOut,
  HelpCircle,
  User,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { getTotalUnread } from '@/services/chatService'
import Avatar from '@/components/ui/Avatar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { CountBadge } from '@/components/ui/Badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import BrandLogo from '@/components/BrandLogo'

const NAV_TABS = [
  { id: 'Buy & Sell', label: 'Buy & Sell', icon: ShoppingBag },
  { id: 'Lost & Found', label: 'Lost & Found', icon: MapPin },
  { id: 'Travelling Tickets', label: 'Tickets', icon: Ticket },
  { id: 'Event Passes', label: 'Passes', icon: CalendarDays },
] as const

function getResolvedTab(pathname: string, search: string): string {
  if (pathname.startsWith('/product/')) {
    const params = new URLSearchParams(search)
    const type = params.get('type')
    if (type === 'found') return 'Lost & Found'
    if (type === 'pass') return 'Event Passes'
    if (type === 'ticket') return 'Travelling Tickets'
    if (type === 'sell') return 'Buy & Sell'
  }
  return sessionStorage.getItem('home_tab') || 'Buy & Sell'
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [selectedTab, setSelectedTab] = useState<string>(() =>
    getResolvedTab(location.pathname, location.search),
  )
  const isHomePage = location.pathname === '/home'

  // Sync selectedTab state with sessionStorage and route changes
  useEffect(() => {
    const syncTab = () => {
      setSelectedTab(getResolvedTab(location.pathname, location.search))
    }
    syncTab()
    window.addEventListener('storage', syncTab)
    return () => window.removeEventListener('storage', syncTab)
  }, [location.pathname, location.search])

  // Track scroll for glass effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Fetch unread count
  useEffect(() => {
    let cancelled = false
    const fetchUnread = async () => {
      try {
        const count = await getTotalUnread()
        if (!cancelled) setUnreadCount(count)
      } catch {
        // silently ignore
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleTabClick = useCallback(
    (tabId: string) => {
      sessionStorage.setItem('home_tab', tabId)
      setSelectedTab(tabId)
      window.dispatchEvent(new Event('storage'))
      if (location.pathname !== '/home') {
        navigate('/home')
      }
      setMobileOpen(false)
    },
    [navigate, location.pathname],
  )

  const handleLogout = async () => {
    await logout()
    navigate('/signin')
  }

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'glass-strong shadow-sm border-b border-[var(--border-secondary)]'
            : 'bg-[var(--bg-primary)] border-b border-transparent',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* ── Main row ── */}
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 -ml-2 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <BrandLogo to="/home" variant="compact" className="!gap-2" />
            </div>

            {/* Center: Nav tabs (desktop only) */}
            {isHomePage && (
              <nav className="hidden lg:flex items-center gap-1">
                {NAV_TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = selectedTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={clsx(
                        'relative flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] text-sm font-medium',
                        'transition-all duration-200 cursor-pointer',
                        isActive
                          ? 'text-[var(--color-primary-500)] bg-[var(--color-primary-500)]/8'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
                      )}
                    >
                      <Icon size={16} />
                      <span className="hidden xl:inline">{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute -bottom-[17px] left-2 right-2 h-0.5 bg-[var(--color-primary-500)] rounded-full"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </button>
                  )
                })}
              </nav>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Add Item */}
              <button
                onClick={() => navigate('/add-item')}
                className={clsx(
                  'hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-[var(--radius-md)]',
                  'bg-[var(--color-primary-500)] text-white text-sm font-medium',
                  'hover:bg-[var(--color-primary-600)] transition-colors cursor-pointer',
                  'shadow-sm hover:shadow-md',
                )}
              >
                <Plus size={16} />
                <span className="hidden md:inline">Add Item</span>
              </button>

              {/* Messages */}
              <button
                onClick={() => navigate('/messages')}
                className={clsx(
                  'relative p-2 rounded-[var(--radius-md)]',
                  'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  'hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer',
                  location.pathname.startsWith('/messages') && 'text-[var(--color-primary-500)] bg-[var(--color-primary-500)]/8',
                )}
                aria-label="Messages"
              >
                <MessageCircle size={20} />
                <CountBadge count={unreadCount} />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle size="sm" className="hidden sm:flex" />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[var(--border-primary)] transition-all cursor-pointer">
                    <Avatar
                      src={user?.avatar}
                      name={user?.name || 'User'}
                      size="sm"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2.5 border-b border-[var(--border-secondary)]">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuItem
                    icon={<User size={16} />}
                    onSelect={() => navigate('/profile')}
                  >
                    Profile
                  </DropdownMenuItem>
                  <div className="sm:hidden px-1 py-1">
                    <DropdownMenuItem
                      icon={<Plus size={16} />}
                      onSelect={() => navigate('/add-item')}
                    >
                      Add Item
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    icon={<HelpCircle size={16} />}
                    onSelect={() => navigate('/help')}
                  >
                    Help & FAQ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={<LogOut size={16} />}
                    danger
                    onSelect={handleLogout}
                  >
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-out Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={clsx(
                'fixed top-0 left-0 bottom-0 z-30 w-72',
                'bg-[var(--bg-primary)] border-r border-[var(--border-secondary)]',
                'flex flex-col pt-20 pb-6 px-4 lg:hidden',
                'shadow-xl',
              )}
            >
              <div className="flex flex-col gap-1">
                {NAV_TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = selectedTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium',
                        'transition-all duration-200 cursor-pointer',
                        isActive
                          ? 'text-[var(--color-primary-500)] bg-[var(--color-primary-500)]/8'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
                      )}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-auto flex flex-col gap-1">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Theme
                  </span>
                  <ThemeToggle size="sm" />
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
