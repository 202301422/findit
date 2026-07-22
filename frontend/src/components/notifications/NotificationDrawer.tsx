import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, Trash2, Megaphone, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { markAllAsRead, refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/notifications?limit=10');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications drawer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    void fetchNotifications();
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      void refreshNotifications();
    } catch (err) {
      // ignore
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      void refreshNotifications();
    } catch (err) {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[var(--surface-card)] border-l border-[var(--border-primary)] shadow-[var(--shadow-xl)] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-[var(--border-secondary)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[var(--color-primary-500)]" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Notifications</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleMarkAllRead()}
                    title="Mark All as Read"
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4 text-[var(--color-success-500)]" /> Read All
                  </button>

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                  <p className="text-center text-xs text-[var(--text-tertiary)] py-10">Loading notifications...</p>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-tertiary)]">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => void handleMarkSingleRead(n._id)}
                      className={`p-3.5 rounded-[var(--radius-md)] border transition-all relative group cursor-pointer ${
                        !n.isRead
                          ? 'bg-[var(--color-primary-500)]/8 border-[var(--color-primary-500)]/30'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {n.type === 'emergency' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : n.type === 'broadcast' ? (
                            <Megaphone className="w-4 h-4 text-[var(--color-primary-500)] shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <h4 className="text-xs font-semibold text-[var(--text-primary)]">{n.title}</h4>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-[var(--text-tertiary)] font-mono block mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteNotification(n._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-tertiary)] hover:text-rose-500 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer View All Link */}
              <div className="p-3 border-t border-[var(--border-secondary)] text-center">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/notifications');
                  }}
                  className="text-xs font-semibold text-[var(--color-primary-500)] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  View All Notifications Center <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
