import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Search,
  Ticket,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  FolderTree,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Megaphone,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../BrandLogo';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Marketplace', path: '/admin/marketplace', icon: ShoppingBag },
  { label: 'Lost & Found', path: '/admin/lost-found', icon: Search },
  { label: 'Tickets & Passes', path: '/admin/passes-tickets', icon: Ticket },
  { label: 'Reports', path: '/admin/reports', icon: AlertTriangle },
  { label: 'Chats', path: '/admin/chats', icon: MessageSquare },
  { label: 'Categories', path: '/admin/categories', icon: FolderTree },
  { label: 'Broadcasts', path: '/admin/broadcasts', icon: Megaphone },
  { label: 'Emergency Alerts', path: '/admin/emergency-alerts', icon: ShieldAlert },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
  { label: 'Profile', path: '/admin/profile', icon: User },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <BrandLogo to="/admin" variant="compact" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-primary-500)] ml-0.5">
              Admin
            </span>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto">
            <BrandLogo to="/admin" variant="icon" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/25 font-semibold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--color-primary-500)]' : 'text-[var(--text-tertiary)]'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Admin User Footer */}
      <div className="p-3 border-t border-[var(--border-primary)]">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-[var(--color-primary-500)]/30"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{user?.name}</span>
                <span className="text-[10px] text-[var(--color-primary-500)] font-medium">Administrator</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--color-error-500)]/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--color-error-500)]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex h-screen sticky top-0 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] text-[var(--text-secondary)] flex-col justify-between transition-all duration-300 z-30 select-none ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[var(--bg-overlay)] backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] flex flex-col lg:hidden shadow-xl"
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
