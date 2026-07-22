import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCheck,
  Trash2,
  Megaphone,
  AlertTriangle,
  Info,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Badge from '../../components/admin/ui/Badge';
import { useNotifications } from '../../contexts/NotificationContext';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'broadcast' | 'emergency' | 'system'
  const [search, setSearch] = useState('');

  const { markAllAsRead, refreshNotifications } = useNotifications();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/notifications?page=${page}&limit=12&filter=${filter}&search=${encodeURIComponent(search)}`
      );
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalItems(res.data.data.pagination.total);
      }
    } catch (err) {
      toast.error('Failed to load notification center');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, [page, filter, search]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success('All notifications marked as read');
    void fetchNotifications();
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      void refreshNotifications();
    } catch (err) {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notification removed');
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      void refreshNotifications();
    } catch (err) {
      toast.error('Failed to remove notification');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-[var(--shadow-md)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[var(--color-primary-500)]" /> Notification Center
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Stay updated with campus broadcasts, emergency alerts, item listing updates, and system notices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleMarkAllRead()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-[var(--radius-md)] transition-all cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[var(--color-success-500)]" /> Mark All Read
          </button>
          <button
            onClick={() => void fetchNotifications()}
            className="p-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: 'All', value: 'all' },
            { label: 'Emergency Alerts', value: 'emergency' },
            { label: 'Broadcasts', value: 'broadcast' },
            { label: 'System Notices', value: 'system' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === tab.value
                  ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Items List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center text-xs text-[var(--text-tertiary)] py-12">Loading notification center...</p>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)]">
            <Bell className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No notifications found</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">You are all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => void handleMarkSingleRead(n._id)}
              className={`p-4 rounded-[var(--radius-xl)] border transition-all cursor-pointer relative group ${
                !n.isRead
                  ? 'bg-[var(--color-primary-500)]/8 border-[var(--color-primary-500)]/30 shadow-sm'
                  : 'bg-[var(--surface-card)] border-[var(--border-primary)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-[var(--radius-md)] shrink-0 ${
                      n.type === 'emergency'
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : n.type === 'broadcast'
                        ? 'bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/30'
                        : 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                    }`}
                  >
                    {n.type === 'emergency' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : n.type === 'broadcast' ? (
                      <Megaphone className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{n.title}</h4>
                      {n.type === 'emergency' && <Badge variant="banned">{n.severity || 'CRITICAL'}</Badge>}
                      {n.type === 'broadcast' && <Badge variant="info">{n.broadcastType || 'BROADCAST'}</Badge>}
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono block mt-2">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(n._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-rose-500 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                  title="Remove Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <div>
            Showing page <span className="font-semibold text-[var(--text-primary)]">{page}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{totalPages}</span> ({totalItems} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
