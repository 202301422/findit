import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminDataTable, { type Column } from '../../components/admin/ui/AdminDataTable';
import Badge from '../../components/admin/ui/Badge';
import toast from 'react-hot-toast';
import { Ticket, Trash2, Bus, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPassesTickets() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/tickets-passes?type=${typeFilter}&page=${page}&limit=10`);
      if (res.data.success) {
        setItems(res.data.data.items);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalItems(res.data.data.pagination.total);
      }
    } catch (err) {
      toast.error('Failed to load tickets and passes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, [page, typeFilter]);

  const handleUpdateStatus = async (type: string, id: string, status: string) => {
    try {
      const res = await api.patch(`/admin/tickets-passes/${type}/${id}/status`, { status });
      if (res.data.success) {
        toast.success(`${type} status updated to ${status}`);
        void fetchItems();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      const res = await api.delete(`/admin/tickets-passes/${type}/${id}`);
      if (res.data.success) {
        toast.success(`${type} deleted successfully`);
        void fetchItems();
      }
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Item',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--color-primary-500)] border border-[var(--border-secondary)]">
            {row.itemType === 'pass' ? <Bus className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-semibold text-[var(--text-primary)]">
              {row.name || `${row.origin?.city || 'Origin'} → ${row.destination?.city || 'Destination'}`}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] uppercase font-mono">{row.itemType}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      cell: (row) => <span className="font-bold text-[var(--color-success-500)]">₹{row.price}</span>,
    },
    {
      header: 'Seller',
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
        <Badge variant={row.status === 'active' ? 'active' : 'expired'}>{row.status || 'active'}</Badge>
      ),
    },
    {
      header: 'Created Date',
      cell: (row) => (
        <span className="text-xs font-mono text-[var(--text-tertiary)]">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => {
        const isSold = row.status === 'sold';
        return (
          <div className="flex items-center gap-1">
            {/* Approve / Activate */}
            <button
              disabled={isSold}
              onClick={() => void handleUpdateStatus(row.itemType, row._id, 'active')}
              title={isSold ? 'Sold items cannot be reactivated' : 'Activate Item'}
              className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${
                isSold
                  ? 'text-[var(--text-tertiary)] opacity-30 cursor-not-allowed'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--color-success-500)] hover:bg-[var(--bg-tertiary)] cursor-pointer'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              disabled={isSold}
              onClick={() => void handleUpdateStatus(row.itemType, row._id, 'closed')}
              title={isSold ? 'Sold items are finalized' : 'Close Item'}
              className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${
                isSold
                  ? 'text-[var(--text-tertiary)] opacity-30 cursor-not-allowed'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--bg-tertiary)] cursor-pointer'
              }`}
            >
              <XCircle className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => void handleDeleteItem(row.itemType, row._id)}
              title="Delete Item"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-500" /> Tickets & Travel Passes
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Manage student event passes, bus passes, and travel ticket resells.
          </p>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="ticket">Tickets Only</option>
          <option value="pass">Passes Only</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Filter items..."
        keyExtractor={(item) => item._id}
        filename="findit-passes-tickets"
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
