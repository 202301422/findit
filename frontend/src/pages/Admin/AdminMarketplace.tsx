import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminDataTable, { type Column } from '../../components/admin/ui/AdminDataTable';
import Badge from '../../components/admin/ui/Badge';
import toast from 'react-hot-toast';
import { ShoppingBag, Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function AdminMarketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/admin/products?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${statusFilter}`
      );
      if (res.data.success) {
        setProducts(res.data.data.products);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalItems(res.data.data.pagination.total);
      }
    } catch (err: any) {
      toast.error('Failed to fetch marketplace products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, [page, search, statusFilter]);

  const handleUpdateStatus = async (productId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/products/${productId}/status`, { status });
      if (res.data.success) {
        toast.success(`Product status updated to ${status}`);
        void fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update product status');
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    try {
      const res = await api.patch(`/admin/products/${productId}/status`, { isFeatured: !currentFeatured });
      if (res.data.success) {
        toast.success(`Product featured status updated`);
        void fetchProducts();
      }
    } catch (err: any) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      const res = await api.delete(`/admin/products/${productId}`);
      if (res.data.success) {
        toast.success('Listing deleted');
        void fetchProducts();
      }
    } catch (err: any) {
      toast.error('Failed to delete listing');
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    if (!window.confirm(`Delete ${selected.length} selected listings?`)) return;
    try {
      const ids = selected.map((s) => s._id);
      const res = await api.post('/admin/products/bulk-delete', { ids });
      if (res.data.success) {
        toast.success(`${ids.length} products deleted`);
        void fetchProducts();
      }
    } catch (err: any) {
      toast.error('Bulk deletion failed');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Product',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.imageUrl ||
              row.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=100&q=80'
            }
            alt={row.name}
            className="w-12 h-12 rounded-[var(--radius-md)] object-cover border border-[var(--border-primary)]"
          />
          <div>
            <div className="font-semibold text-[var(--text-primary)] line-clamp-1">{row.name}</div>
            <div className="text-xs text-[var(--text-tertiary)] capitalize">{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Seller',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-[var(--text-primary)]">{row.user?.name || 'Unknown'}</div>
          <div className="text-[var(--text-tertiary)]">{row.user?.email}</div>
        </div>
      ),
    },
    {
      header: 'Price',
      cell: (row) => <span className="font-bold text-[var(--color-success-500)]">₹{row.sellingPrice}</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.status === 'active' ? 'active' : row.status === 'sold' ? 'sold' : 'draft'}>{row.status}</Badge>
          {row.isFeatured && <Badge variant="featured">Featured</Badge>}
        </div>
      ),
    },
    {
      header: 'Listed Date',
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
            {/* Feature Toggle */}
            <button
              onClick={() => void handleToggleFeatured(row._id, !!row.isFeatured)}
              title="Toggle Featured"
              className={`p-1.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                row.isFeatured
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Star className="w-4 h-4" />
            </button>

            {/* Approve */}
            <button
              disabled={isSold}
              onClick={() => void handleUpdateStatus(row._id, 'active')}
              title={isSold ? 'Sold items cannot be reactivated' : 'Approve Listing'}
              className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${
                isSold
                  ? 'text-[var(--text-tertiary)] opacity-30 cursor-not-allowed'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--color-success-500)] hover:bg-[var(--bg-tertiary)] cursor-pointer'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>

            {/* Reject / Close */}
            <button
              disabled={isSold}
              onClick={() => void handleUpdateStatus(row._id, 'closed')}
              title={isSold ? 'Sold items are already finalized' : 'Reject / Close Listing'}
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
              onClick={() => void handleDeleteProduct(row._id)}
              title="Delete Listing"
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
            <ShoppingBag className="w-5 h-5 text-[var(--color-primary-500)]" /> Marketplace Listings Moderation
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Approve, feature, filter, and manage sell products listed on FindIt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Search product name or description..."
        onSearchChange={(val) => setSearch(val)}
        keyExtractor={(item) => item._id}
        filename="findit-marketplace"
        bulkActions={[
          {
            label: 'Delete Selected',
            action: (selected) => void handleBulkDelete(selected),
            variant: 'danger',
          },
        ]}
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
