import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminDataTable, { type Column } from '../../components/admin/ui/AdminDataTable';
import Badge from '../../components/admin/ui/Badge';
import AdminModal from '../../components/admin/ui/AdminModal';
import StatCard from '../../components/admin/ui/StatCard';
import {
  Megaphone,
  Send,
  Radio,
  BarChart2,
  Trash2,
  Edit3,
  Users,
  Plus,
} from 'lucide-react';

export default function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    priority: 'medium',
    targetAudience: 'everyone',
    expiryDate: '',
  });

  const fetchBroadcasts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/admin/broadcasts?page=${page}&limit=10&search=${encodeURIComponent(search)}&type=${typeFilter}&priority=${priorityFilter}`
      );
      if (res.data.success) {
        setBroadcasts(res.data.data.broadcasts);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalItems(res.data.data.pagination.total);
      }
    } catch (err) {
      toast.error('Failed to fetch broadcast messages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/broadcasts/analytics');
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    void fetchBroadcasts();
    void fetchAnalytics();
  }, [page, search, typeFilter, priorityFilter]);

  const handleOpenCreate = () => {
    setEditingBroadcast(null);
    setFormData({
      title: '',
      message: '',
      type: 'announcement',
      priority: 'medium',
      targetAudience: 'everyone',
      expiryDate: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingBroadcast(b);
    setFormData({
      title: b.title,
      message: b.message,
      type: b.type || 'announcement',
      priority: b.priority || 'medium',
      targetAudience: b.targetAudience || 'everyone',
      expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().slice(0, 16) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBroadcast) {
        const res = await api.put(`/admin/broadcasts/${editingBroadcast._id}`, formData);
        if (res.data.success) {
          toast.success('Broadcast updated and re-emitted');
        }
      } else {
        const res = await api.post('/admin/broadcasts', formData);
        if (res.data.success) {
          toast.success('Broadcast sent instantly to all online users!');
        }
      }
      setModalOpen(false);
      void fetchBroadcasts();
      void fetchAnalytics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Broadcast action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this broadcast message?')) return;
    try {
      const res = await api.delete(`/admin/broadcasts/${id}`);
      if (res.data.success) {
        toast.success('Broadcast deleted');
        void fetchBroadcasts();
        void fetchAnalytics();
      }
    } catch (err) {
      toast.error('Failed to delete broadcast');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Broadcast Message',
      cell: (row) => (
        <div>
          <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>{row.title}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)]">
              {row.type}
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">{row.message}</p>
        </div>
      ),
    },
    {
      header: 'Target Audience',
      cell: (row) => (
        <span className="text-xs font-semibold capitalize text-[var(--text-secondary)]">
          {row.targetAudience?.replace('_', ' ') || 'Everyone'}
        </span>
      ),
    },
    {
      header: 'Priority',
      cell: (row) => (
        <Badge
          variant={
            row.priority === 'urgent'
              ? 'banned'
              : row.priority === 'high'
              ? 'suspended'
              : 'active'
          }
        >
          {row.priority || 'medium'}
        </Badge>
      ),
    },
    {
      header: 'Sent By & Date',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-[var(--text-primary)]">{row.createdBy?.name || 'Admin'}</div>
          <div className="text-[var(--text-tertiary)] font-mono text-[10px]">
            {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Broadcast"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => void handleDelete(row._id)}
            title="Delete Broadcast"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[var(--color-primary-500)]" /> Broadcast Messaging Suite
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Create, schedule, target, and monitor real-time campus broadcasts across FindIt.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Broadcast
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Broadcasts"
          value={analytics?.totalBroadcasts ?? '-'}
          icon={<Radio className="w-5 h-5" />}
          color="primary"
          subtitle="Sent messages"
        />
        <StatCard
          title="Targeted Students"
          value={analytics?.totalUsers ?? '-'}
          icon={<Users className="w-5 h-5" />}
          color="emerald"
          subtitle="Active campus reach"
        />
        <StatCard
          title="Broadcast Channels"
          value={analytics?.typeDistribution?.length ?? 7}
          icon={<BarChart2 className="w-5 h-5" />}
          color="indigo"
          subtitle="Message categories"
        />
      </div>

      {/* Main Broadcast Data Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Broadcast History & Active Dispatches
          </h3>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="announcement">Announcement</option>
              <option value="info">Info</option>
              <option value="reminder">Reminder</option>
              <option value="update">Update</option>
              <option value="warning">Warning</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <AdminDataTable
          columns={columns}
          data={broadcasts}
          isLoading={isLoading}
          searchPlaceholder="Search broadcast title or message..."
          onSearchChange={(val) => setSearch(val)}
          keyExtractor={(item) => item._id}
          filename="findit-broadcasts"
          pagination={{
            currentPage: page,
            totalPages,
            onPageChange: (p) => setPage(p),
            totalItems,
          }}
        />
      </div>

      {/* Create / Edit Broadcast Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBroadcast ? 'Edit Broadcast Message' : 'Create & Dispatch Broadcast'}
        maxWidth="lg"
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Broadcast Title</label>
            <input
              type="text"
              required
              placeholder="e.g. End of Semester Marketplace Discount Week"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Message Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="announcement">Announcement</option>
                <option value="info">Information</option>
                <option value="reminder">Reminder</option>
                <option value="update">Update</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="everyone">Everyone</option>
                <option value="all_students">All Students</option>
                <option value="marketplace_users">Marketplace Users</option>
                <option value="lost_found_users">Lost & Found Users</option>
                <option value="ticket_users">Ticket Users</option>
                <option value="pass_users">Pass Users</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Optional Expiry Date</label>
            <input
              type="datetime-local"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Message Content</label>
            <textarea
              required
              rows={4}
              placeholder="Write the full broadcast message content..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-secondary)]">
            <span className="text-[11px] text-[var(--color-primary-500)] flex items-center gap-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Instant Socket.io Delivery Enabled
            </span>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-semibold cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Dispatching...' : 'Dispatch Broadcast'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
