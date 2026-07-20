import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations, type Conversation } from '../../services/chatService';

import '../../styles/variables.css';
import '../../styles/sidebar.css';
import '../../styles/topbar.css';
import './Messages.css';

import Sidebar from '../../components/Sidebar/Sidebar';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function AvatarBubble({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <div className="conv-avatar">
        <img src={avatar} alt={name} />
      </div>
    );
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
  return <div className="conv-avatar">{initials}</div>;
}

function SkeletonCards() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="conv-skeleton">
          <div className="skeleton-circle" />
          <div className="skeleton-lines">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function Messages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getConversations();
        if (!cancelled) setConversations(data);
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherParticipant?.name?.toLowerCase().includes(q) ||
        c.item?.itemName?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const handleNav = (section: string) => {
    if (section === 'Buy & Sell' || section === 'Lost & Found' || section === 'Travelling Tickets' || section === 'Event Passes') {
      sessionStorage.setItem('home_tab', section);
      navigate('/home');
    }
  };

  return (
    <div className="site-root">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        selected="Messages"
        handleNav={handleNav}
        handleHelp={() => navigate('/help')}
        handleLogout={async () => {
          await logout();
          navigate('/signin');
        }}
      />

      <div className="main" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="messages-page">
          {/* Header */}
          <div className="messages-header">
            <h1>Messages</h1>
            <p>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Search */}
          <div className="messages-search">
            <div className="messages-search-wrapper">
              <span className="search-icon">🔎</span>
              <input
                id="messages-search-input"
                className="messages-search-input"
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="conversations-list">
            {loading ? (
              <SkeletonCards />
            ) : filtered.length === 0 ? (
              <div className="messages-empty">
                <div className="messages-empty-icon">💬</div>
                <p>{search ? 'No matching conversations' : 'No messages yet'}</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const other = conv.otherParticipant;
                const hasUnread = conv.myUnread > 0;
                return (
                  <button
                    key={conv._id}
                    id={`conv-card-${conv._id}`}
                    className={`conv-card ${hasUnread ? 'unread' : ''}`}
                    onClick={() => navigate(`/messages/${conv._id}`)}
                  >
                    <AvatarBubble name={other?.name || '?'} avatar={other?.avatar} />

                    <div className="conv-meta">
                      <div className="conv-top-row">
                        <span className="conv-name">{other?.name || 'Unknown'}</span>
                        <span className="conv-time">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <div className="conv-bottom-row">
                        <div>
                          <div className={`conv-preview ${hasUnread ? 'bold' : ''}`}>
                            {conv.lastMessage || 'Start the conversation!'}
                          </div>
                          {conv.item?.itemName && (
                            <span className="conv-item-chip">📦 {conv.item.itemName}</span>
                          )}
                        </div>
                        {hasUnread && (
                          <span className="conv-unread-badge">
                            {conv.myUnread > 99 ? '99+' : conv.myUnread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
