import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import { connectSocket } from '../utils/socketClient';
import toast from 'react-hot-toast';

export interface EmergencyAlertData {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  activeUntil: string;
  requireAcknowledgement: boolean;
  isActive: boolean;
  createdBy?: { name: string; email: string };
  createdAt?: string;
}

export interface BroadcastData {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: string;
  createdBy?: { name: string; email: string };
}

interface NotificationContextType {
  unreadCount: number;
  activeEmergencyAlerts: EmergencyAlertData[];
  unacknowledgedEmergencyAlerts: EmergencyAlertData[];
  acknowledgeAlert: (alertId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Audio synth chime for emergency alerts
function playEmergencyChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4); // A4

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    // Ignore audio autoplay restrictions
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeEmergencyAlerts, setActiveEmergencyAlerts] = useState<EmergencyAlertData[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Fetch active emergency alerts and notifications from backend
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      // 1. Fetch active emergency alerts
      const emergencyRes = await api.get('/notifications/emergency-alerts/active');
      if (emergencyRes.data.success) {
        const alerts: EmergencyAlertData[] = emergencyRes.data.data;
        setActiveEmergencyAlerts(alerts);

        // Populate local acknowledged set from user._id
        const acked = new Set<string>();
        if (user?._id) {
          alerts.forEach((a: any) => {
            if (a.acknowledgedBy?.includes(user._id)) {
              acked.add(a._id);
            }
          });
        }
        setAcknowledgedIds(acked);
      }

      // 2. Fetch unread notification count
      const notifRes = await api.get('/notifications?limit=1');
      if (notifRes.data.success) {
        setUnreadCount(notifRes.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  // Socket.io Real-time Event Listener
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();

    // Emergency Alert triggered
    const handleEmergencyAlert = (payload: { alert: EmergencyAlertData }) => {
      if (!payload?.alert) return;
      playEmergencyChime();
      setActiveEmergencyAlerts((prev) => [payload.alert, ...prev.filter((a) => a._id !== payload.alert._id)]);
      toast.error(`EMERGENCY ALERT: ${payload.alert.title}`, { duration: 6000 });
      setUnreadCount((prev) => prev + 1);
    };

    // Emergency Alert toggled
    const handleEmergencyToggled = (payload: { alertId: string; isActive: boolean }) => {
      if (!payload?.alertId) return;
      if (!payload.isActive) {
        setActiveEmergencyAlerts((prev) => prev.filter((a) => a._id !== payload.alertId));
      } else {
        void refreshNotifications();
      }
    };

    // Broadcast Message received
    const handleBroadcastMessage = (payload: { broadcast: BroadcastData }) => {
      if (!payload?.broadcast) return;
      const b = payload.broadcast;
      toast(`📢 Broadcast: ${b.title}\n${b.message}`, {
        duration: 5000,
        style: {
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-focus)',
        },
      });
      setUnreadCount((prev) => prev + 1);
    };

    // Product Status Updated (Real-time synchronization across all pages)
    const handleItemStatusUpdated = (payload: { itemType: string; itemId: string; status: string; product: any }) => {
      // Dispatch custom DOM event so feed pages can listen and update instantly
      window.dispatchEvent(new CustomEvent('findit_item_status_updated', { detail: payload }));
    };

    socket.on('emergency_alert', handleEmergencyAlert);
    socket.on('emergency_alert_toggled', handleEmergencyToggled);
    socket.on('broadcast_message', handleBroadcastMessage);
    socket.on('item_status_updated', handleItemStatusUpdated);

    return () => {
      socket.off('emergency_alert', handleEmergencyAlert);
      socket.off('emergency_alert_toggled', handleEmergencyToggled);
      socket.off('broadcast_message', handleBroadcastMessage);
      socket.off('item_status_updated', handleItemStatusUpdated);
    };
  }, [isAuthenticated, refreshNotifications]);

  // Acknowledge Emergency Alert ("I Understand")
  const acknowledgeAlert = async (alertId: string) => {
    try {
      await api.post(`/notifications/emergency-alerts/${alertId}/acknowledge`);
      setAcknowledgedIds((prev) => new Set(prev).add(alertId));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Mark all notifications read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unacknowledgedEmergencyAlerts = activeEmergencyAlerts.filter(
    (a) => a.requireAcknowledgement && !acknowledgedIds.has(a._id)
  );

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        activeEmergencyAlerts,
        unacknowledgedEmergencyAlerts,
        acknowledgeAlert,
        refreshNotifications,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
