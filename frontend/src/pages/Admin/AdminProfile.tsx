import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { User, Shield, Activity, Clock } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';

export default function AdminProfile() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const res = await api.get('/admin/audit-logs?limit=20');
        if (res.data.success) {
          setLogs(res.data.data.logs);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    void fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--color-primary-500)]" /> Admin Account Profile & Audit History
        </h2>
        <p className="text-xs text-[var(--text-tertiary)]">Review your administrator account identity and recorded action audit trail.</p>
      </div>

      {/* Account Info Card */}
      <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-[var(--shadow-md)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatar} name={user?.name || 'Admin'} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{user?.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/20">
                Administrator
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="text-[var(--text-tertiary)] block">Role Privileges</span>
          <span className="font-semibold text-[var(--color-success-500)] flex items-center gap-1 justify-end mt-1">
            <Shield className="w-3.5 h-3.5" /> Full SuperAdmin Rights
          </span>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 pb-3 border-b border-[var(--border-secondary)] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--color-primary-500)]" /> Personal Audit Action Trail
        </h3>

        {isLoadingLogs ? (
          <p className="text-center py-8 text-xs text-[var(--text-tertiary)]">Loading audit trail...</p>
        ) : logs.length === 0 ? (
          <p className="text-center py-8 text-xs text-[var(--text-tertiary)]">No recorded admin actions yet.</p>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log: any) => (
              <div
                key={log._id}
                className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-[var(--color-primary-500)]">{log.action}</div>
                  <div className="text-[var(--text-tertiary)] text-[11px] mt-0.5">{log.details || `Target ID: ${log.targetId}`}</div>
                </div>
                <div className="text-right text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
