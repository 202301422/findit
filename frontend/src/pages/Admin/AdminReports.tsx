import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AdminDataTable, { type Column } from '../../components/admin/ui/AdminDataTable';
import Badge from '../../components/admin/ui/Badge';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/reports?status=${statusFilter}`);
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, [statusFilter]);

  const handleUpdateReport = async (id: string, status: string) => {
    const notes = window.prompt('Resolution notes (optional):');
    try {
      const res = await api.patch(`/admin/reports/${id}/status`, { status, notes });
      if (res.data.success) {
        toast.success(`Report status updated to ${status}`);
        void fetchReports();
      }
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Report Reason',
      cell: (row) => (
        <div>
          <div className="font-semibold text-[var(--color-error-500)]">{row.reason}</div>
          {row.description && <div className="text-xs text-[var(--text-tertiary)] line-clamp-1">{row.description}</div>}
        </div>
      ),
    },
    {
      header: 'Reported By',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-[var(--text-primary)]">{row.reportedBy?.name || 'User'}</div>
          <div className="text-[var(--text-tertiary)]">{row.reportedBy?.email}</div>
        </div>
      ),
    },
    {
      header: 'Target Entity',
      cell: (row) => (
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {row.reportedUser ? `User: ${row.reportedUser.name}` : row.reportedMessageId ? 'ChatMessage' : 'Content Listing'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'pending'
              ? 'pending'
              : row.status === 'resolved'
              ? 'resolved'
              : 'dismissed'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-xs font-mono text-[var(--text-tertiary)]">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => void handleUpdateReport(row._id, 'resolved')}
            title="Mark Resolved"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-success-500)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => void handleUpdateReport(row._id, 'dismissed')}
            title="Dismiss Report"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
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
            <AlertTriangle className="w-5 h-5 text-[var(--color-error-500)]" /> Flagged Content & Reports
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">Investigate community reports, messages, and listings.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={reports}
        isLoading={isLoading}
        searchPlaceholder="Search reports..."
        keyExtractor={(item) => item._id}
        filename="findit-reports"
      />
    </div>
  );
}
