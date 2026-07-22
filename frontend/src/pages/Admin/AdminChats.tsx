import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MessageSquare, Trash2, MessageCircle, Layers } from 'lucide-react';

export default function AdminChats() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChatStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/chats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load chat statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchChatStats();
  }, []);

  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm('Delete this conversation and all its messages?')) return;
    try {
      const res = await api.delete(`/admin/chats/${id}`);
      if (res.data.success) {
        toast.success('Conversation deleted');
        void fetchChatStats();
      }
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const conversations = data?.conversations || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--color-success-500)]" /> Chat Conversations & Moderation
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">Monitor user chat activity and resolve dispute conversations.</p>
        </div>
      </div>

      {/* Summary Stat Pill Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-[var(--shadow-xs)] flex items-center gap-4">
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)]">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">Total Conversations</span>
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">{data?.totalConversations ?? '-'}</h3>
          </div>
        </div>

        <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-[var(--shadow-xs)] flex items-center gap-4">
          <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 text-emerald-500">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">Total Messages Sent</span>
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">{data?.totalMessages ?? '-'}</h3>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 pb-3 border-b border-[var(--border-secondary)]">
          Recent Active Conversations
        </h3>

        {isLoading ? (
          <p className="text-center py-8 text-xs text-[var(--text-tertiary)]">Loading chats...</p>
        ) : conversations.length === 0 ? (
          <p className="text-center py-8 text-xs text-[var(--text-tertiary)]">No conversations found.</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv: any) => (
              <div
                key={conv._id}
                className="flex items-center justify-between p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {conv.participants?.slice(0, 2).map((p: any) => (
                      <img
                        key={p._id}
                        src={p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                        alt={p.name}
                        className="w-8 h-8 rounded-full border-2 border-[var(--surface-card)] object-cover"
                      />
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {conv.participants?.map((p: any) => p.name).join(' & ') || 'Unknown Participants'}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                      Updated {new Date(conv.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => void handleDeleteConversation(conv._id)}
                  title="Delete Conversation"
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
