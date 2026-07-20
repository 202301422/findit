import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMessages,
  sendMessage as sendMessageApi,
  markConversationRead,
  getConversations,
  deleteMessage as deleteMessageApi,
  reportMessage as reportMessageApi,
  type Message,
  type Conversation,
} from '../../services/chatService';
import { useSocket } from '../../hooks/useSocket';
import EmojiPicker from 'emoji-picker-react';
import './ChatDetail.css';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function SmallAvatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <div className="bubble-avatar">
        <img src={avatar} alt={name} />
      </div>
    );
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
  return <div className="bubble-avatar">{initials}</div>;
}

/* ─── Component ────────────────────────────────────────────────────────── */

export default function ChatDetail() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reportConfirmId, setReportConfirmId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Scroll to bottom on new messages ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Load conversation meta + messages ── */
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        // Fetch conversation info (from the list endpoint)
        const allConvs = await getConversations();
        const conv = allConvs.find((c) => c._id === conversationId);
        if (!cancelled && conv) setConversation(conv);

        // Fetch messages
        const { messages: msgs } = await getMessages(conversationId);
        if (!cancelled) setMessages(msgs);

        // Mark as read
        await markConversationRead(conversationId);
      } catch (err) {
        console.error('Failed to load chat', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [conversationId]);

  /* ── Socket.io real-time new messages ── */
  useSocket({
    conversationId: conversationId ?? null,
    onNewMessage: (msg) => {
      // Avoid duplicates (optimistic update already appended our own message)
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark read immediately when we receive while window is open
      if (conversationId) {
        markConversationRead(conversationId).catch(() => {});
      }
    },
    onMessageDeleted: ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    },
  });

  /* ── Message Actions ── */
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMessageApi(deleteConfirmId);
      setMessages((prev) => prev.filter((m) => m._id !== deleteConfirmId));
    } catch (err) {
      console.error("Failed to delete message", err);
    }
    setDeleteConfirmId(null);
  };

  const confirmReport = async () => {
    if (!reportConfirmId) return;
    try {
      await reportMessageApi(reportConfirmId);
      alert("Message reported successfully.");
    } catch (err) {
      console.error("Failed to report message", err);
    }
    setReportConfirmId(null);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bubble-menu-container') && activeMenuMsgId) {
        setActiveMenuMsgId(null);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [activeMenuMsgId]);

  /* ── Auto-resize textarea ── */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  /* ── Send ── */
  const handleSend = async () => {
    if ((!text.trim() && !attachedFile) || !conversationId || sending) return;

    const trimmed = text.trim();
    setText('');
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setSending(true);
    const fileToSend = attachedFile;
    const previewToUse = filePreview;
    
    // Clear attachment immediately for UX
    setAttachedFile(null);
    setFilePreview(null);

    // Optimistic update with a temp id
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      _id: tempId,
      conversationId: conversationId,
      sender: {
        _id: user!._id,
        name: user!.name,
        username: user!.username,
        avatar: user!.avatar,
      },
      text: trimmed,
      imageUrl: previewToUse || undefined,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const real = await sendMessageApi(conversationId, trimmed, fileToSend || undefined);
      // Replace temp with real message, unless socket already added it
      setMessages((prev) => {
        const hasReal = prev.some(m => m._id === real._id && m._id !== tempId);
        if (hasReal) {
          return prev.filter(m => m._id !== tempId);
        }
        return prev.map((m) => (m._id === tempId ? real : m));
      });
    } catch (err) {
      console.error('Send failed', err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setText(trimmed); // restore text
      if (fileToSend && previewToUse) {
        setAttachedFile(fileToSend);
        setFilePreview(previewToUse);
      }
    } finally {
      setSending(false);
    }
  };

  /* ── Enter to send (Shift+Enter for newline) ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Derived ── */
  const other = conversation?.otherParticipant;
  const myId = user?._id;

  /* ── Render ── */
  return (
    <div className="chat-page">
      {/* ── Header ── */}
      <div className="chat-header">
        <button
          className="chat-back-btn"
          onClick={() => navigate('/messages')}
          aria-label="Back to messages"
        >
          ←
        </button>

        {other ? (
          <>
            {other.avatar ? (
              <div className="chat-header-avatar">
                <img src={other.avatar} alt={other.name} />
              </div>
            ) : (
              <div className="chat-header-avatar">
                {other.name
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() || '')
                  .join('')}
              </div>
            )}

            <div className="chat-header-info">
              <div className="chat-header-name">{other.name}</div>
              {conversation?.item?.itemName && (
                <div className="chat-header-item">📦 {conversation.item.itemName}</div>
              )}
            </div>

          </>
        ) : (
          <div className="chat-header-info">
            <div className="chat-header-name">Chat</div>
          </div>
        )}
      </div>

      {conversation?.item && (
        <div 
          className="chat-product-banner"
          onClick={() => navigate(`/product/${conversation.item!.itemId}?type=${conversation.item!.itemType}`)}
        >
          {conversation.item.itemImage ? (
            <img src={conversation.item.itemImage} alt={conversation.item.itemName} />
          ) : (
            <div className="chat-product-banner-fallback">📦</div>
          )}
          <div className="chat-product-banner-info">
            <div className="chat-product-banner-title">{conversation.item.itemName}</div>
            <div className="chat-product-banner-sub">Click to view {conversation.item.itemType} details</div>
          </div>
          <div className="chat-product-banner-arrow">›</div>
        </div>
      )}

      {/* ── Messages ── */}
      {loading ? (
        <div className="chat-loading">
          <div className="chat-loading-dots">
            <span /><span /><span />
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="chat-empty">
          <div className="chat-empty-icon">👋</div>
          <p>Say hello! Start the conversation.</p>
        </div>
      ) : (
        <div className="chat-messages" id="chat-messages-container">
          {messages.map((msg, idx) => {
            const isMine = msg.sender._id === myId || msg.sender._id?.toString() === myId;
            const showDate =
              idx === 0 || !isSameDay(msg.createdAt, messages[idx - 1].createdAt);
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showAvatar =
              !isMine &&
              (!prevMsg || prevMsg.sender._id !== msg.sender._id || showDate);

            return (
              <div key={msg._id}>
                {showDate && (
                  <div className="chat-date-divider">
                    <span>{formatDateLabel(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`bubble-row ${isMine ? 'mine' : 'theirs'}`} style={{ zIndex: activeMenuMsgId === msg._id ? 10 : 1, position: 'relative' }}>
                  {!isMine &&
                    (showAvatar ? (
                      <SmallAvatar
                        name={msg.sender.name || 'User'}
                        avatar={msg.sender.avatar}
                      />
                    ) : (
                      <div className="bubble-spacer" />
                    ))}

                  <div className="bubble">
                    {msg.imageUrl && (
                      <div className="bubble-image" onClick={() => setFullscreenImage(msg.imageUrl!)} style={{ cursor: 'pointer' }}>
                        <img src={msg.imageUrl} alt="attachment" />
                      </div>
                    )}
                    {msg.text && <div>{msg.text}</div>}
                    <span className="bubble-time">{formatBubbleTime(msg.createdAt)}</span>
                    {isMine && (
                      <span className="bubble-read" style={{ opacity: msg.read ? 1 : 0.6 }}>
                        {msg.read ? (
                          <svg viewBox="0 0 18 18" width="16" height="16"><path fill="#4FC3F7" d="M17.394 5.075l-1.052-1.052a.5.5 0 00-.707 0l-7.796 7.795-1.92-1.92a.5.5 0 00-.707 0l-1.052 1.053a.5.5 0 000 .707l3.325 3.325a.5.5 0 00.707 0l9.202-9.201a.5.5 0 000-.707zM11.854 4.023l-1.052-1.052a.5.5 0 00-.707 0l-4.524 4.524 1.052 1.053 4.524-4.525a.5.5 0 01.707 0zM1.803 11.871l-1.052-1.052a.5.5 0 00-.707 0L.044 10.819a.5.5 0 000 .707l3.325 3.325a.5.5 0 00.707 0l1.052-1.053a.5.5 0 000-.707l-3.325-3.325z"></path></svg>
                        ) : (
                          <svg viewBox="0 0 18 18" width="16" height="16"><path fill="#999" d="M16.63 5.446l-1.052-1.052a.5.5 0 00-.707 0l-7.796 7.795-3.325-3.325a.5.5 0 00-.707 0L2.69 9.917a.5.5 0 000 .707l4.378 4.377a.5.5 0 00.707 0l9.202-9.201a.5.5 0 000-.707z"></path></svg>
                        )}
                      </span>
                    )}

                    {/* Sexy context menu button inside the bubble */}
                    <div className="bubble-menu-container">
                      <button 
                        className="bubble-menu-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuMsgId(activeMenuMsgId === msg._id ? null : msg._id);
                        }}
                        aria-label="Message options"
                      >
                        ⋮
                      </button>
                      {activeMenuMsgId === msg._id && (
                        <div className="bubble-menu-dropdown">
                          {isMine ? (
                            <button onClick={() => { setDeleteConfirmId(msg._id); setActiveMenuMsgId(null); }} className="bubble-menu-item text-danger">Delete</button>
                          ) : (
                            <button onClick={() => { setReportConfirmId(msg._id); setActiveMenuMsgId(null); }} className="bubble-menu-item">Report</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ── Input ── */}
      <div className="chat-input-area">
        {filePreview && (
          <div className="chat-attachment-preview">
            <img src={filePreview} alt="Preview" />
            <button onClick={() => { setAttachedFile(null); setFilePreview(null); }}>✕</button>
          </div>
        )}
        {showEmojiPicker && (
          <div className="chat-emoji-picker">
            <EmojiPicker onEmojiClick={(e) => setText(prev => prev + e.emoji)} />
          </div>
        )}
        <div className="chat-input-controls">
          <button className="chat-icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
          <label className="chat-icon-btn">
            📎
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAttachedFile(file);
                  setFilePreview(URL.createObjectURL(file));
                }
              }} 
            />
          </label>
        </div>
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            className="chat-textarea"
            rows={1}
            placeholder="Type a message…"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          id="chat-send-btn"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={(!text.trim() && !attachedFile) || sending}
          aria-label="Send message"
        >
          {sending ? '⏳' : '➤'}
        </button>
      </div>

      {/* ── Fullscreen Image Modal ── */}
      {fullscreenImage && (
        <div className="chat-fullscreen-overlay" onClick={() => setFullscreenImage(null)}>
          <button className="chat-fullscreen-close" onClick={() => setFullscreenImage(null)}>✕</button>
          <img src={fullscreenImage} alt="Fullscreen Attachment" className="chat-fullscreen-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {/* ── Custom Modals ── */}
      {deleteConfirmId && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <h3>Delete Message</h3>
            <p>Are you sure you want to delete this message for everyone? This cannot be undone.</p>
            <div className="custom-modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {reportConfirmId && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <h3>Report Message</h3>
            <p>Do you want to report this message to moderators?</p>
            <div className="custom-modal-actions">
              <button className="btn-cancel" onClick={() => setReportConfirmId(null)}>Cancel</button>
              <button className="btn-primary" onClick={confirmReport}>Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
