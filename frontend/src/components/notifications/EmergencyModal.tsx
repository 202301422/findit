import { useNotifications } from '../../contexts/NotificationContext';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencyModal() {
  const { unacknowledgedEmergencyAlerts, acknowledgeAlert } = useNotifications();

  if (unacknowledgedEmergencyAlerts.length === 0) return null;

  const alert = unacknowledgedEmergencyAlerts[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Emergency Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg rounded-2xl bg-rose-950 border-2 border-rose-600 shadow-2xl p-6 overflow-hidden z-10 text-white"
        >
          {/* Top Emergency Pulse Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 animate-pulse" />

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-rose-600/30 border border-rose-500/50 text-rose-400 shrink-0">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600/40 border border-rose-400 text-rose-200">
                CRITICAL CAMPUS EMERGENCY
              </span>
              <h3 className="text-xl font-black text-white mt-1 leading-tight">{alert.title}</h3>
            </div>
          </div>

          <div className="my-4 p-4 rounded-xl bg-black/40 border border-rose-800/60 text-sm text-rose-100 leading-relaxed max-h-60 overflow-y-auto">
            {alert.description}
          </div>

          <div className="pt-4 border-t border-rose-800/60 flex flex-col gap-3">
            <p className="text-xs text-rose-200/80 text-center font-medium">
              You must acknowledge this emergency notification before continuing to use FindIt.
            </p>

            <button
              onClick={() => void acknowledgeAlert(alert._id)}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" /> I UNDERSTAND & ACKNOWLEDGE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
