import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminDataTable, { type Column } from '../../components/admin/ui/AdminDataTable';
import Badge from '../../components/admin/ui/Badge';
import AdminDrawer from '../../components/admin/ui/AdminDrawer';
import AdminModal from '../../components/admin/ui/AdminModal';
import toast from 'react-hot-toast';
import {
  Users,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  CheckCircle,
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Selected User Detail Drawer
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Status Action Modal
  const [actionUser, setActionUser] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${statusFilter}&role=${roleFilter}`
      );
      if (res.data.success) {
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalItems(res.data.data.pagination.total);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [page, search, statusFilter, roleFilter]);

  const handleOpenUserDetail = async (user: any) => {
    setDrawerOpen(true);
    setIsDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      if (res.data.success) {
        setSelectedUserDetail(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load user detail');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success(`User role updated to ${newRole}`);
        void fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleVerification = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/verify`);
      if (res.data.success) {
        toast.success(res.data.message);
        void fetchUsers();
      }
    } catch (err: any) {
      toast.error('Failed to toggle verification');
    }
  };

  const handleExecuteStatusUpdate = async () => {
    if (!actionUser || !targetStatus) return;
    try {
      const res = await api.patch(`/admin/users/${actionUser._id}/status`, { status: targetStatus });
      if (res.data.success) {
        toast.success(`User status changed to ${targetStatus}`);
        setModalOpen(false);
        setActionUser(null);
        void fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user?')) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        toast.success('User permanently deleted');
        void fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'User Info',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
            }
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover border border-[var(--border-primary)]"
          />
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              {row.name}
              {row.isVerified && <CheckCircle className="w-3.5 h-3.5 text-[var(--color-info-500)] fill-[var(--color-info-500)]/20" />}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (row) => (
        <Badge variant={row.role === 'admin' ? 'admin' : 'user'}>{row.role}</Badge>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={
            row.accountStatus === 'active'
              ? 'active'
              : row.accountStatus === 'suspended'
              ? 'suspended'
              : 'banned'
          }
        >
          {row.accountStatus}
        </Badge>
      ),
    },
    {
      header: 'Stats',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[var(--text-secondary)] font-medium">{row.listingsCount ?? 0} Listings</div>
          <div className="text-[var(--text-tertiary)]">{row.messagesCount ?? 0} Messages</div>
        </div>
      ),
    },
    {
      header: 'Joined',
      cell: (row) => (
        <span className="text-xs text-[var(--text-tertiary)] font-mono">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {/* Detail Drawer */}
          <button
            onClick={() => void handleOpenUserDetail(row)}
            title="View User Detail"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-primary-500)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Verification Toggle */}
          <button
            onClick={() => void handleToggleVerification(row._id)}
            title="Toggle Verification"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-success-500)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
          </button>

          {/* Role Toggle */}
          {row.role === 'admin' ? (
            <button
              onClick={() => void handleUpdateRole(row._id, 'user')}
              title="Demote to User"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            >
              <ShieldOff className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => void handleUpdateRole(row._id, 'admin')}
              title="Promote to Admin"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-purple-500 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Suspend/Ban Modal */}
          <button
            onClick={() => {
              setActionUser(row);
              setTargetStatus(row.accountStatus === 'active' ? 'suspended' : 'active');
              setModalOpen(true);
            }}
            title="Change Account Status"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <UserX className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => void handleDeleteUser(row._id)}
            title="Delete User"
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
            <Users className="w-5 h-5 text-[var(--color-primary-500)]" /> User Directory & Accounts
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Manage user roles, verification badges, account statuses, and profile details.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <AdminDataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchPlaceholder="Search users by name, email, username..."
        onSearchChange={(val) => setSearch(val)}
        keyExtractor={(item) => item._id}
        filename="findit-users"
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: (p) => setPage(p),
          totalItems,
        }}
      />

      {/* User Detail Slide-over Drawer */}
      <AdminDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="User Account Details"
        subtitle={selectedUserDetail?.user?.email}
      >
        {isDetailLoading || !selectedUserDetail ? (
          <div className="text-center py-10 text-xs text-[var(--text-tertiary)]">Loading user profile...</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-[var(--radius-xl)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
              <img
                src={
                  selectedUserDetail.user.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
                }
                alt={selectedUserDetail.user.name}
                className="w-16 h-16 rounded-[var(--radius-xl)] object-cover border border-[var(--color-primary-500)]/40"
              />
              <div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">{selectedUserDetail.user.name}</h4>
                <p className="text-xs text-[var(--text-tertiary)]">@{selectedUserDetail.user.username || 'user'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={selectedUserDetail.user.role === 'admin' ? 'admin' : 'user'}>
                    {selectedUserDetail.user.role}
                  </Badge>
                  <Badge variant={selectedUserDetail.user.accountStatus}>{selectedUserDetail.user.accountStatus}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                <span className="text-[var(--text-tertiary)]">Phone:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedUserDetail.user.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                <span className="text-[var(--text-tertiary)]">College:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedUserDetail.user.college || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                <span className="text-[var(--text-tertiary)]">Location:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {[selectedUserDetail.user.city, selectedUserDetail.user.state].filter(Boolean).join(', ') || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                <span className="text-[var(--text-tertiary)]">Auth Provider:</span>
                <span className="font-semibold uppercase text-[var(--text-primary)]">{selectedUserDetail.user.authProvider}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                <span className="text-[var(--text-tertiary)]">Last Login:</span>
                <span className="font-mono text-[var(--text-secondary)]">
                  {selectedUserDetail.user.lastLogin ? new Date(selectedUserDetail.user.lastLogin).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase text-[var(--text-tertiary)] mb-2">User Content Summary</h5>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
                  <span className="block text-lg font-bold text-[var(--color-primary-500)]">
                    {selectedUserDetail.listings?.length || 0}
                  </span>
                  <span className="text-[var(--text-tertiary)] text-[10px]">Sell Listings</span>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
                  <span className="block text-lg font-bold text-[var(--color-success-500)]">
                    {selectedUserDetail.foundItems?.length || 0}
                  </span>
                  <span className="text-[var(--text-tertiary)] text-[10px]">Found Items</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminDrawer>

      {/* Account Status Update Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Update Account Status"
        subtitle={`User: ${actionUser?.name} (${actionUser?.email})`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-[var(--text-secondary)]">Select the new account status for this user:</p>

          <div className="grid grid-cols-3 gap-2">
            {['active', 'suspended', 'banned'].map((st) => (
              <button
                key={st}
                onClick={() => setTargetStatus(st)}
                className={`py-2 rounded-[var(--radius-md)] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  targetStatus === st
                    ? 'bg-[var(--color-primary-500)] text-white border-2 border-[var(--color-primary-400)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-secondary)] hover:bg-[var(--surface-elevated)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleExecuteStatusUpdate()}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-semibold cursor-pointer"
            >
              Save Status
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
