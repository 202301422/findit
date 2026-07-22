import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import StatCard from '../../components/admin/ui/StatCard';
import Badge from '../../components/admin/ui/Badge';
import {
  Users,
  UserPlus,
  UserCheck,
  ShoppingBag,
  CheckCircle,
  Ticket,
  ShieldAlert,
  MessageSquare,
  DollarSign,
  HardDrive,
  Activity,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardStats();
  }, []);

  const stats = data?.stats || {};
  const recentUsers = data?.recentUsers || [];
  const recentListings = data?.recentListings || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[var(--radius-xl)] bg-gradient-to-r from-[var(--color-primary-500)]/10 via-[var(--color-primary-600)]/8 to-[var(--bg-tertiary)] border border-[var(--color-primary-500)]/15 shadow-[var(--shadow-lg)]">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            System Overview & Metrics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time monitoring of campus transactions, users, and platform moderation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchDashboardStats()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-[var(--radius-md)] transition-all shadow-[var(--shadow-xs)] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/analytics"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] rounded-[var(--radius-md)] shadow-lg shadow-[var(--color-primary-500)]/20 transition-all"
          >
            Detailed Analytics <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers ?? '-'}
          icon={<Users className="w-5 h-5" />}
          color="primary"
          subtitle="Registered accounts"
        />
        <StatCard
          title="New Users Today"
          value={stats.newUsersToday ?? '-'}
          icon={<UserPlus className="w-5 h-5" />}
          color="emerald"
          trend={{ value: '+12%', isPositive: true }}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers ?? '-'}
          icon={<UserCheck className="w-5 h-5" />}
          color="cyan"
          subtitle="Good standing"
        />
        <StatCard
          title="Marketplace Listings"
          value={stats.totalListings ?? '-'}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="indigo"
          subtitle="Sell products"
        />
        <StatCard
          title="Found Items"
          value={stats.totalFoundItems ?? '-'}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
          subtitle="Lost & Found posts"
        />
        <StatCard
          title="Tickets"
          value={stats.totalTickets ?? '-'}
          icon={<Ticket className="w-5 h-5" />}
          color="purple"
          subtitle="Event/Travel tickets"
        />
        <StatCard
          title="Passes"
          value={stats.totalPasses ?? '-'}
          icon={<Ticket className="w-5 h-5" />}
          color="cyan"
          subtitle="Bus & transit passes"
        />
        <StatCard
          title="Open Reports"
          value={stats.openReports ?? '-'}
          icon={<ShieldAlert className="w-5 h-5" />}
          color="rose"
          subtitle="Requires review"
        />
        <StatCard
          title="Chats Today"
          value={stats.chatsToday ?? '-'}
          icon={<MessageSquare className="w-5 h-5" />}
          color="emerald"
          subtitle="Real-time messages"
        />
        <StatCard
          title="Revenue (Future Ready)"
          value={`₹${stats.revenue ?? 0}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="amber"
          subtitle="Platform fees"
        />
        <StatCard
          title="Storage Usage"
          value={`${stats.storageUsageMB ?? 0} MB`}
          icon={<HardDrive className="w-5 h-5" />}
          color="primary"
          subtitle="Cloudinary assets"
        />
      </div>

      {/* Grid Section: Recent Registrations & Latest Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-secondary)]">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[var(--color-primary-500)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Latest User Registrations
              </h3>
            </div>
            <Link to="/admin/users" className="text-xs text-[var(--color-primary-500)] hover:underline">
              View All Users
            </Link>
          </div>

          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">No recent signups found.</p>
            ) : (
              recentUsers.map((u: any) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        u.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-[var(--border-primary)]"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-primary)]">{u.name}</h4>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === 'admin' ? 'admin' : 'user'}>{u.role}</Badge>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Listings */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-secondary)]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Recent Marketplace Items
              </h3>
            </div>
            <Link to="/admin/marketplace" className="text-xs text-indigo-500 hover:underline">
              View Marketplace
            </Link>
          </div>

          <div className="space-y-3">
            {recentListings.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">No recent listings created.</p>
            ) : (
              recentListings.map((prod: any) => (
                <div
                  key={prod._id}
                  className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        prod.imageUrl ||
                        prod.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={prod.name}
                      className="w-10 h-10 rounded-[var(--radius-md)] object-cover border border-[var(--border-primary)]"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Listed by <span className="text-[var(--text-secondary)] font-medium">{prod.user?.name || 'User'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-[var(--color-success-500)] block">₹{prod.sellingPrice}</span>
                    <Badge variant={prod.status === 'active' ? 'active' : prod.status === 'sold' ? 'sold' : 'draft'}>
                      {prod.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Audit Activity Stream */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-secondary)]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--color-success-500)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Recent Administrative Actions
            </h3>
          </div>
          <Link to="/admin/profile" className="text-xs text-[var(--color-success-500)] hover:underline">
            Audit Logs
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentLogs.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] py-4 col-span-full text-center">
              No recent audit logs. Actions taken by admins will appear here.
            </p>
          ) : (
            recentLogs.map((log: any) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[var(--color-primary-500)]">{log.action}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[11px] truncate">{log.details || log.targetType}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border-secondary)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>By {log.admin?.name || 'Admin'}</span>
                  <span className="font-mono">{log.targetType}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
