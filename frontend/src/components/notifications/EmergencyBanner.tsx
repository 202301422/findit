import { useNotifications } from '../../contexts/NotificationContext';
import { AlertOctagon, X } from 'lucide-react';
import { useState } from 'react';

export default function EmergencyBanner() {
  const { activeEmergencyAlerts } = useNotifications();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = activeEmergencyAlerts.filter(
    (a) => !dismissedIds.has(a._id) && !a.requireAcknowledgement
  );

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="sticky top-0 z-50 bg-rose-600 text-white shadow-xl">
      {visibleAlerts.map((alert) => (
        <div
          key={alert._id}
          className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 border-b border-rose-500/40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-700/80 shrink-0 animate-pulse">
              <AlertOctagon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base tracking-tight">
                <span>{alert.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-rose-800 border border-rose-400">
                  {alert.severity} SEVERITY
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-100 mt-0.5 line-clamp-2">{alert.description}</p>
            </div>
          </div>

          <button
            onClick={() => setDismissedIds((prev) => new Set(prev).add(alert._id))}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
            title="Dismiss Banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
