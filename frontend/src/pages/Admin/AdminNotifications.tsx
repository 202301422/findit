import { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Bell, Send, Radio } from 'lucide-react';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('announcement');
  const [targetAudience, setTargetAudience] = useState('everyone');
  const [isSending, setIsSending] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message content are required');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.post('/admin/notifications', { title, message, type, targetAudience });
      if (res.data.success) {
        toast.success('Broadcast notification emitted to all online users!');
        setTitle('');
        setMessage('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--color-primary-500)]" /> System Broadcast Notifications
        </h2>
        <p className="text-xs text-[var(--text-tertiary)]">
          Emit real-time socket announcements and notifications to active users on FindIt.
        </p>
      </div>

      <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)]">
        <form onSubmit={(e) => void handleSendBroadcast(e)} className="space-y-5 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-primary)] mb-1.5">Broadcast Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled System Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-1.5">Notification Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="announcement">Announcement</option>
                <option value="alert">Critical Alert</option>
                <option value="update">Platform Update</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-1.5">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="everyone">All Registered Users</option>
                <option value="active_buyers">Active Marketplace Users</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-primary)] mb-1.5">Message Body</label>
            <textarea
              required
              rows={4}
              placeholder="Write broadcast details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] text-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--color-primary-500)] text-xs">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Real-time WebSocket Broadcast Ready</span>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-semibold transition-all shadow-[var(--shadow-xs)] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending...' : 'Emit Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
