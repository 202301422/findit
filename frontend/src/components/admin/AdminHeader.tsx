import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  X,
  User,
  ShoppingBag,
  Ticket,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Command-K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle global search API query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Compute page title from path
  const pageTitle = (() => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard Overview';
    if (path.includes('analytics')) return 'Analytics & Insights';
    if (path.includes('users')) return 'User Management';
    if (path.includes('marketplace')) return 'Marketplace Products';
    if (path.includes('lost-found')) return 'Lost & Found Moderation';
    if (path.includes('passes-tickets')) return 'Tickets & Travel Passes';
    if (path.includes('reports')) return 'Reports & Flagged Content';
    if (path.includes('chats')) return 'Chat Conversations & Moderation';
    if (path.includes('categories')) return 'Category Management';
    if (path.includes('notifications')) return 'Broadcast Notifications';
    if (path.includes('settings')) return 'System Settings';
    if (path.includes('profile')) return 'Admin Profile';
    return 'Admin Panel';
  })();

  return (
    <header className="sticky top-0 z-20 glass-strong border-b border-[var(--border-primary)] px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">{pageTitle}</h1>
          <p className="text-xs text-[var(--text-tertiary)] hidden sm:block">FindIt Command & Moderation Center</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Bar Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-[var(--text-tertiary)] text-xs hover:border-[var(--border-focus)] transition-colors w-36 sm:w-48 lg:w-64 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left truncate">Search anything...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-tertiary)]">
            Ctrl+K
          </kbd>
        </button>

        {/* View App Link */}
        <button
          onClick={() => navigate('/home')}
          title="Return to Main Application"
          className="p-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors border border-[var(--border-secondary)] flex items-center gap-1 text-xs font-medium cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Main App</span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title="Toggle Dark / Light Theme"
          className="p-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors border border-[var(--border-secondary)] cursor-pointer"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => navigate('/admin/notifications')}
          title="Notifications Center"
          className="relative p-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors border border-[var(--border-secondary)] cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-primary-500)] ring-2 ring-[var(--bg-primary)]" />
        </button>

        {/* Admin Avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--border-secondary)]">
          <Avatar
            src={user?.avatar}
            name={user?.name || 'Admin'}
            size="sm"
          />
        </div>
      </div>

      {/* Global Command-K Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="relative w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] shadow-xl overflow-hidden z-10"
            >
              <div className="p-4 border-b border-[var(--border-secondary)] flex items-center gap-3">
                <Search className="w-5 h-5 text-[var(--color-primary-500)]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users, marketplace products, lost & found, tickets, passes..."
                  className="w-full text-sm bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                {isSearching ? (
                  <p className="text-center text-xs text-[var(--text-tertiary)] py-6">Searching...</p>
                ) : !searchResults ? (
                  <p className="text-center text-xs text-[var(--text-tertiary)] py-6">
                    Type to search across all platform entities.
                  </p>
                ) : (
                  <>
                    {/* Users */}
                    {searchResults.users?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--color-info-500)]" /> Users ({searchResults.users.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.users.map((u: any) => (
                            <div
                              key={u._id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/admin/users');
                              }}
                              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] cursor-pointer flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-[var(--text-primary)]">{u.name} ({u.email})</span>
                              <span className="text-[10px] text-[var(--text-tertiary)] uppercase">{u.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    {searchResults.products?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[var(--color-success-500)]" /> Marketplace Products ({searchResults.products.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.products.map((p: any) => (
                            <div
                              key={p._id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/admin/marketplace');
                              }}
                              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] cursor-pointer flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
                              <span className="text-[10px] text-[var(--color-success-500)] font-bold">₹{p.sellingPrice}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tickets & Passes */}
                    {searchResults.ticketsPasses?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-purple-400" /> Passes & Tickets ({searchResults.ticketsPasses.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.ticketsPasses.map((item: any) => (
                            <div
                              key={item._id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/admin/passes-tickets');
                              }}
                              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] cursor-pointer flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-[var(--text-primary)]">{item.name || `${item.origin?.city} → ${item.destination?.city}`}</span>
                              <span className="text-[10px] text-purple-400 font-bold">₹{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reports */}
                    {searchResults.reports?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-error-500)]" /> Flagged Reports ({searchResults.reports.length})
                        </h4>
                        <div className="space-y-1">
                          {searchResults.reports.map((r: any) => (
                            <div
                              key={r._id}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/admin/reports');
                              }}
                              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] cursor-pointer flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-[var(--color-error-500)]">{r.reason}</span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">Reported by {r.reportedBy?.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
