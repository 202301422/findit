import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMessages,
  sendMessage as sendMessageApi,
  markConversationRead,
  getConversations,
  deleteMessage as deleteMessageApi,
  reportMessage as reportMessageApi,
  type Message,
  type Conversation,
} from '@/services/chatService'
import { useSocket } from '@/hooks/useSocket'
import EmojiPicker from 'emoji-picker-react'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { 
  ArrowLeft, Send, Smile, Paperclip, X, Trash2, ShieldAlert, Check, CheckCheck, MoreVertical
} from 'lucide-react'
import { clsx } from 'clsx'

function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export default function ChatDetail() {
  const { id: conversationId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [reportConfirmId, setReportConfirmId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  /* ── Load conversation + messages ── */
  useEffect(() => {
    if (!conversationId) return
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        const allConvs = await getConversations()
        const conv = allConvs.find((c) => c._id === conversationId)
        if (!cancelled && conv) setConversation(conv)

        const { messages: msgs } = await getMessages(conversationId)
        if (!cancelled) setMessages(msgs)

        await markConversationRead(conversationId)
      } catch (err) {
        console.error('Failed to load chat', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [conversationId])

  /* ── Socket triggers ── */
  useSocket({
    conversationId: conversationId ?? null,
    onNewMessage: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev
        return [...prev, msg]
      });
      if (conversationId) {
        markConversationRead(conversationId).catch(() => {})
      }
    },
    onMessageDeleted: ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId))
    },
  })

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteMessageApi(deleteConfirmId)
      setMessages((prev) => prev.filter((m) => m._id !== deleteConfirmId))
      toast.success('Message deleted')
    } catch (err) {
      console.error('Failed to delete message', err)
    }
    setDeleteConfirmId(null)
  }

  const confirmReport = async () => {
    if (!reportConfirmId) return
    try {
      await reportMessageApi(reportConfirmId)
      toast.success('Message reported to moderators')
    } catch (err) {
      console.error('Failed to report message', err)
    }
    setReportConfirmId(null)
  }

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.bubble-menu-container') && activeMenuMsgId) {
        setActiveMenuMsgId(null)
      }
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [activeMenuMsgId])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }
  }

  const handleSend = async () => {
    if ((!text.trim() && !attachedFile) || !conversationId || sending) return

    const trimmed = text.trim()
    setText('')
    setShowEmojiPicker(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setSending(true)
    const fileToSend = attachedFile
    const previewToUse = filePreview

    setAttachedFile(null)
    setFilePreview(null)

    const tempId = `temp-${Date.now()}`
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
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const real = await sendMessageApi(conversationId, trimmed, fileToSend || undefined)
      setMessages((prev) => {
        const hasReal = prev.some((m) => m._id === real._id && m._id !== tempId)
        if (hasReal) {
          return prev.filter((m) => m._id !== tempId)
        }
        return prev.map((m) => (m._id === tempId ? real : m))
      })
    } catch (err) {
      console.error('Send failed', err)
      setMessages((prev) => prev.filter((m) => m._id !== tempId))
      setText(trimmed)
      if (fileToSend && previewToUse) {
        setAttachedFile(fileToSend)
        setFilePreview(previewToUse)
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const other = conversation?.otherParticipant
  const myId = user?._id

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-secondary)] bg-[var(--surface-card)] overflow-hidden shadow-[var(--shadow-card)] relative">
      {/* ── Header ── */}
      <div className="h-16 px-4 border-b border-[var(--border-secondary)] flex items-center justify-between shrink-0 bg-[var(--surface-elevated)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 rounded-full border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-pointer"
            aria-label="Back to messages"
          >
            <ArrowLeft size={16} />
          </button>
          {other && (
            <div className="flex items-center gap-2.5">
              <Avatar src={other.avatar} name={other.name} size="sm" />
              <div>
                <span className="text-sm font-bold text-[var(--text-primary)] block leading-tight">
                  {other.name}
                </span>
                {conversation?.item?.itemName && (
                  <span className="text-[10px] font-semibold text-[var(--text-tertiary)] block">
                    Product: {conversation.item.itemName}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item info header banner */}
      {conversation?.item && (
        <button
          onClick={() => navigate(`/product/${conversation.item!.itemId}?type=${conversation.item!.itemType}`)}
          className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]/50 transition-colors text-left shrink-0 w-full"
        >
          {conversation.item.itemImage ? (
            <img src={conversation.item.itemImage} alt="" className="w-10 h-8 object-cover rounded-[var(--radius-sm)] border border-[var(--border-secondary)]" />
          ) : (
            <div className="w-10 h-8 flex items-center justify-center bg-[var(--border-primary)] rounded-[var(--radius-sm)] text-xs text-[var(--text-tertiary)]">📦</div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-[var(--text-primary)] block truncate">{conversation.item.itemName}</span>
            <span className="text-[9px] font-medium text-[var(--text-tertiary)] block uppercase tracking-wider">Click to view product listing</span>
          </div>
          <span className="text-[var(--text-tertiary)] text-lg">&rsaquo;</span>
        </button>
      )}

      {/* ── Messages Feed ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface-sunken)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-xs text-[var(--text-tertiary)]">
            <div className="w-6 h-6 border-2 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[var(--text-tertiary)] space-y-2">
            <span className="text-4xl">👋</span>
            <p className="text-sm font-semibold">Start the conversation!</p>
            <p className="text-xs max-w-xs">Type a message or use template templates below to ask about the item details.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender._id === myId || msg.sender._id?.toString() === myId
            const showDate = idx === 0 || !isSameDay(msg.createdAt, messages[idx - 1].createdAt)
            const prevMsg = idx > 0 ? messages[idx - 1] : null
            const showAvatar = !isMine && (!prevMsg || prevMsg.sender._id !== msg.sender._id || showDate)

            return (
              <div key={msg._id} className="space-y-2">
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-full shadow-xs">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={clsx(
                  'flex items-end gap-2 max-w-[85%] relative group',
                  isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}>
                  {!isMine && (
                    showAvatar ? (
                      <Avatar src={msg.sender.avatar} name={msg.sender.name || '?'} size="xs" className="mb-0.5" />
                    ) : (
                      <div className="w-6 shrink-0" />
                    )
                  )}

                  <div className={clsx(
                    'relative px-3 py-2.5 text-sm rounded-[var(--radius-lg)] shadow-card select-text space-y-1',
                    isMine 
                      ? 'bg-[var(--color-primary-500)] text-white rounded-br-xs' 
                      : 'bg-[var(--surface-card)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-bl-xs'
                  )}>
                    {msg.imageUrl && (
                      <div
                        onClick={() => setFullscreenImage(msg.imageUrl!)}
                        className="rounded-[var(--radius-sm)] overflow-hidden border border-black/5 bg-black/5 cursor-pointer max-w-[200px]"
                      >
                        <img src={msg.imageUrl} alt="" className="object-cover w-full h-full max-h-40" />
                      </div>
                    )}
                    {msg.text && <p className="whitespace-pre-wrap break-words pr-2">{msg.text}</p>}
                    
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className={clsx(
                        'text-[9px] font-semibold block',
                        isMine ? 'text-white/60' : 'text-[var(--text-tertiary)]'
                      )}>
                        {formatBubbleTime(msg.createdAt)}
                      </span>
                      {isMine && (
                        <span title={msg.read ? 'Seen' : 'Sent'}>
                          {msg.read ? (
                            <CheckCheck size={13} strokeWidth={2.5} className="text-white/90" />
                          ) : (
                            <Check size={11} strokeWidth={2.5} className="text-white/60" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Context menu action trigger */}
                    <div className="bubble-menu-container absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuMsgId(activeMenuMsgId === msg._id ? null : msg._id)
                        }}
                        className={clsx(
                          "w-5 h-5 rounded-full flex items-center justify-center cursor-pointer",
                          isMine ? "hover:bg-white/10 text-white" : "hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                        )}
                      >
                        <MoreVertical size={12} />
                      </button>
                      {activeMenuMsgId === msg._id && (
                        <div className="absolute right-0 top-6 z-50 min-w-[80px] bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-[var(--radius-sm)] shadow-md py-1 animate-scale-in text-xs">
                          {isMine ? (
                            <button
                              type="button"
                              onClick={() => { setDeleteConfirmId(msg._id); setActiveMenuMsgId(null) }}
                              className="w-full px-2.5 py-1.5 text-left text-[var(--color-error-500)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                            >
                              Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setReportConfirmId(msg._id); setActiveMenuMsgId(null) }}
                              className="w-full px-2.5 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                            >
                              Report
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input controls ── */}
      <div className="p-3 border-t border-[var(--border-secondary)] bg-[var(--surface-elevated)] shrink-0 space-y-2">
        {filePreview && (
          <div className="flex items-center justify-between gap-3 p-1.5 px-3 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] max-w-sm animate-fade-in">
            <img src={filePreview} alt="" className="w-10 h-8 object-cover rounded-[var(--radius-sm)]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">Attached Image</span>
            <button
              onClick={() => { setAttachedFile(null); setFilePreview(null) }}
              className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end relative">
          <div className="flex gap-1 shrink-0 pb-1.5">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
              title="Add Emoji"
            >
              <Smile size={18} />
            </button>

            <label
              className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
              title="Attach Image"
            >
              <Paperclip size={18} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setAttachedFile(file)
                    setFilePreview(URL.createObjectURL(file))
                  }
                }}
              />
            </label>
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type your message..."
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full max-h-24 p-2 px-3.5 rounded-[var(--radius-lg)] border bg-[var(--bg-primary)] border-[var(--border-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] resize-none transition-all py-2.5"
            />
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={(!text.trim() && !attachedFile) || sending}
            className="w-10 h-10 flex items-center justify-center rounded-full shrink-0 !p-0 shadow-sm"
          >
            <Send size={16} />
          </Button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 z-40 bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-[var(--radius-lg)] shadow-lg max-w-full overflow-hidden">
            <EmojiPicker onEmojiClick={(e) => setText((p) => p + e.emoji)} />
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X size={24} />
          </button>
          <img src={fullscreenImage} alt="" className="max-w-full max-h-full object-contain rounded-md" />
        </div>
      )}

      {/* Confirmation Modals */}
      <Modal open={deleteConfirmId !== null} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null) }} title="Delete Message">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Are you sure you want to permanently delete this message for everyone? This action is permanent.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" iconLeft={<Trash2 size={14} />} onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal open={reportConfirmId !== null} onOpenChange={(o) => { if (!o) setReportConfirmId(null) }} title="Report Message">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Do you want to report this message to moderators for violating guidelines?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setReportConfirmId(null)}>Cancel</Button>
            <Button variant="primary" iconLeft={<ShieldAlert size={14} />} onClick={confirmReport}>Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
