import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminDataTable, { type Column } from '../../components/admin/ui/AdminDataTable';
import Badge from '../../components/admin/ui/Badge';
import AdminModal from '../../components/admin/ui/AdminModal';
import {
  AlertOctagon,
  ShieldAlert,
  Power,
  Trash2,
  Plus,
  Clock,
  Radio,
} from 'lucide-react';

export default function AdminEmergencyAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'campus',
    severity: 'critical',
    activeUntil: '',
    requireAcknowledgement: true,
  });

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/emergency-alerts');
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load emergency alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAlerts();
  }, []);

  const handleOpenCreate = () => {
    // Default active until = +4 hours from now
    const fourHoursLater = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setFormData({
      title: '',
      description: '',
      category: 'campus',
      severity: 'critical',
      activeUntil: fourHoursLater,
      requireAcknowledgement: true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/emergency-alerts', formData);
      if (res.data.success) {
        toast.success('HIGH PRIORITY EMERGENCY ALERT TRIGGERED!');
        setModalOpen(false);
        void fetchAlerts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to trigger emergency alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await api.patch(`/admin/emergency-alerts/${id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        void fetchAlerts();
      }
    } catch (err) {
      toast.error('Failed to toggle emergency alert status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this emergency alert entry?')) return;
    try {
      const res = await api.delete(`/admin/emergency-alerts/${id}`);
      if (res.data.success) {
        toast.success('Emergency alert deleted');
        void fetchAlerts();
      }
    } catch (err) {
      toast.error('Failed to delete emergency alert');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Emergency Alert',
      cell: (row) => (
        <div>
          <div className="font-bold text-rose-500 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
            <span>{row.title}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-rose-500/15 text-rose-500 border border-rose-500/20">
              {row.category}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{row.description}</p>
        </div>
      ),
    },
    {
      header: 'Severity',
      cell: (row) => (
        <Badge
          variant={
            row.severity === 'critical' || row.severity === 'high'
              ? 'banned'
              : 'suspended'
          }
        >
          {row.severity?.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Active State',
      cell: (row) => (
        <Badge variant={row.isActive ? 'active' : 'expired'}>
          {row.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      header: 'Ack Required & Count',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-[var(--text-primary)] block">
            {row.requireAcknowledgement ? 'Mandatory "I Understand"' : 'Optional'}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
            {row.acknowledgedBy?.length || 0} student acknowledgements
          </span>
        </div>
      ),
    },
    {
      header: 'Active Until',
      cell: (row) => (
        <div className="text-xs font-mono text-[var(--text-tertiary)] flex items-center gap-1">
          <Clock className="w-3 h-3 text-rose-400" />
          {new Date(row.activeUntil).toLocaleString()}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => void handleToggle(row._id)}
            title={row.isActive ? 'Deactivate Alert' : 'Reactivate Alert'}
            className={`p-1.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
              row.isActive
                ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                : 'text-[var(--text-tertiary)] hover:text-emerald-500 hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => void handleDelete(row._id)}
            title="Delete Alert"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-rose-500 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[var(--radius-xl)] bg-gradient-to-r from-rose-950/60 via-red-950/40 to-[var(--surface-card)] border border-rose-600/30 shadow-[var(--shadow-lg)]">
        <div>
          <h2 className="text-2xl font-black text-rose-500 flex items-center gap-2.5 tracking-tight">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" /> Emergency Alert Dispatch Center
          </h2>
          <p className="text-xs text-rose-200/80 mt-1">
            Trigger highest-priority campus alerts. Emergency alerts override broadcasts and force immediate sticky banners & modal popups across all connected users.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-[var(--radius-md)] shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> TRIGGER EMERGENCY ALERT
        </button>
      </div>

      {/* Emergency Alerts Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
          Active & Historical Emergency Dispatches
        </h3>

        <AdminDataTable
          columns={columns}
          data={alerts}
          isLoading={isLoading}
          searchPlaceholder="Search emergency alert title or description..."
          keyExtractor={(item) => item._id}
          filename="findit-emergency-alerts"
        />
      </div>

      {/* Emergency Alert Trigger Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="TRIGGER CAMPUS EMERGENCY ALERT"
        subtitle="HIGH PRIORITY: This will instantly emit fullscreen alerts & sticky banners to all online students."
        maxWidth="lg"
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-rose-400 mb-1">Emergency Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Severe Weather Warning: Campus Evacuation Protocol"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-[var(--bg-tertiary)] border border-rose-800/80 rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-rose-500 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Alert Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="campus">Campus Emergency</option>
                <option value="security">Security Alert</option>
                <option value="weather">Weather Alert</option>
                <option value="medical">Medical Emergency</option>
                <option value="fire">Fire Alert</option>
                <option value="maintenance">Maintenance Emergency</option>
                <option value="power">Power Failure</option>
                <option value="internet">Internet Outage</option>
                <option value="event_cancellation">Event Cancellation</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Severity Level</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="critical">CRITICAL (Red Banner + Modal + Sound)</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Active Until (Expiry)</label>
            <input
              type="datetime-local"
              required
              value={formData.activeUntil}
              onChange={(e) => setFormData({ ...formData, activeUntil: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-rose-950/40 border border-rose-900/60">
            <input
              type="checkbox"
              id="reqAck"
              checked={formData.requireAcknowledgement}
              onChange={(e) => setFormData({ ...formData, requireAcknowledgement: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded cursor-pointer"
            />
            <label htmlFor="reqAck" className="text-xs text-rose-200 cursor-pointer">
              <span className="font-bold block">Require Mandatory Student Acknowledgement</span>
              Forces users to click &quot;I Understand&quot; modal before continuing app usage.
            </label>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1">Emergency Description & Instructions</label>
            <textarea
              required
              rows={4}
              placeholder="Provide clear, urgent instructions for students..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-secondary)]">
            <span className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" /> Socket.io Instant Emergency Dispatch
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
                className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" />
                {isSubmitting ? 'Dispatching...' : 'TRIGGER EMERGENCY ALERT'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
