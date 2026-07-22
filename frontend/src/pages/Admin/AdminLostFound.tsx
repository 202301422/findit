import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminDataTable, { type Column } from '../../components/admin/ui/AdminDataTable';
import Badge from '../../components/admin/ui/Badge';
import toast from 'react-hot-toast';
import { Search, CheckCircle, Trash2, MapPin } from 'lucide-react';

export default function AdminLostFound() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchFoundProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/admin/found?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${statusFilter}`
      );
      if (res.data.success) {
        setItems(res.data.data.products);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalItems(res.data.data.pagination.total);
      }
    } catch (err) {
      toast.error('Failed to load found items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchFoundProducts();
  }, [page, search, statusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/admin/found/${id}/status`, { status });
      if (res.data.success) {
        toast.success(`Status updated to ${status}`);
        void fetchFoundProducts();
      }
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this found item post?')) return;
    try {
      const res = await api.delete(`/admin/found/${id}`);
      if (res.data.success) {
        toast.success('Found post deleted');
        void fetchFoundProducts();
      }
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Item',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.imageUrl ||
              row.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=100&q=80'
            }
            alt={row.name}
            className="w-12 h-12 rounded-[var(--radius-md)] object-cover border border-[var(--border-primary)]"
          />
          <div>
            <div className="font-semibold text-[var(--text-primary)]">{row.name}</div>
            <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" /> {row.venue}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => <Badge variant="info">{row.category}</Badge>,
    },
    {
      header: 'Reporter',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-[var(--text-primary)]">{row.user?.name || 'User'}</div>
          <div className="text-[var(--text-tertiary)]">{row.user?.email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'active' : 'resolved'}>{row.status}</Badge>
      ),
    },
    {
      header: 'Found Date',
      cell: (row) => (
        <span className="text-xs font-mono text-[var(--text-tertiary)]">
          {new Date(row.dateTime || row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {/* Mark Resolved */}
          <button
            onClick={() => void handleUpdateStatus(row._id, 'closed')}
            title="Mark Claimed / Resolved"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-success-500)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => void handleDeleteItem(row._id)}
            title="Delete Item"
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" /> Lost & Found Moderation
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">Review reported lost items and recoveries on campus.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="closed">Claimed / Closed</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Search by item name, venue, or description..."
        onSearchChange={(val) => setSearch(val)}
        keyExtractor={(item) => item._id}
        filename="findit-lost-found"
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: (p) => setPage(p),
          totalItems,
        }}
      />
    </div>
  );
}
