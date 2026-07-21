import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getConversations, type Conversation } from '@/services/chatService'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { Search, MessageSquare, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getConversations()
        if (!cancelled) setConversations(data)
      } catch (err) {
        console.error('Failed to load conversations', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) =>
        c.otherParticipant?.name?.toLowerCase().includes(q) ||
        c.item?.itemName?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
    )
  }, [conversations, search])

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-2">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
          <p className="text-xs text-[var(--text-tertiary)] font-medium mt-0.5">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <Input
        placeholder="Search chats, items, or users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        iconLeft={<Search size={16} />}
      />

      {/* Chat List */}
      <Card padding="none" className="divide-y divide-[var(--border-secondary)] overflow-hidden">
        {loading ? (
          /* Loading skeletons */
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 animate-shimmer">
              <div className="w-11 h-11 rounded-full bg-[var(--bg-tertiary)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--bg-tertiary)] rounded-xs w-1/3" />
                <div className="h-3 bg-[var(--bg-tertiary)] rounded-xs w-2/3" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={24} />}
            title={search ? 'No matching conversations' : 'No messages yet'}
            description={search ? 'Try searching other terms.' : 'Chat conversations with sellers or buyers will appear here.'}
          />
        ) : (
          filtered.map((conv) => {
            const other = conv.otherParticipant
            const hasUnread = conv.myUnread > 0

            return (
              <button
                key={conv._id}
                onClick={() => navigate(`/messages/${conv._id}`)}
                className={clsx(
                  'w-full flex items-center gap-3 p-4 text-left cursor-pointer transition-colors',
                  'hover:bg-[var(--bg-secondary)] focus:outline-none',
                  hasUnread && 'bg-[var(--color-primary-50)]/5 dark:bg-[var(--color-primary-500)]/3'
                )}
              >
                <Avatar
                  src={other?.avatar}
                  name={other?.name || '?'}
                  size="md"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx(
                      'text-sm font-semibold truncate',
                      hasUnread ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]/90'
                    )}>
                      {other?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] font-medium shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-0.5">
                      <p className={clsx(
                        'text-xs truncate',
                        hasUnread ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-medium'
                      )}>
                        {conv.lastMessage || 'Start the conversation!'}
                      </p>
                      {conv.item?.itemName && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-500)]/10 px-1.5 py-0.5 rounded-full mt-1 max-w-full truncate">
                          <span>📦</span>
                          <span className="truncate">{conv.item.itemName}</span>
                        </div>
                      )}
                    </div>

                    {hasUnread && (
                      <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-[var(--color-error-500)] rounded-full shrink-0">
                        {conv.myUnread > 99 ? '99+' : conv.myUnread}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-[var(--text-tertiary)] shrink-0 hidden sm:block" />
              </button>
            )
          })
        )}
      </Card>
    </div>
  )
}
