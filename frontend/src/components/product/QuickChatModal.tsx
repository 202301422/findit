import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrCreateConversation, sendMessage } from '@/services/chatService'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { Send } from 'lucide-react'
import { clsx } from 'clsx'

const QUICK_MSGS = [
  'Is this still available?',
  'Can you do a lower price?',
  "I'm interested. When can we meet?",
]
const QUICK_MSGS_FOUND = [
  'Is this item still available?',
  'I think this belongs to me.',
  'Can I verify ownership details?',
]

interface Seller {
  _id: string
  name: string
  avatar?: string
}

interface QuickChatModalProps {
  open: boolean
  onClose: () => void
  seller: Seller
  productName: string
  isFound?: boolean
  itemId?: string
  itemType?: string
  itemImage?: string
}

export default function QuickChatModal({
  open,
  onClose,
  seller,
  productName,
  isFound = false,
  itemId,
  itemType,
  itemImage,
}: QuickChatModalProps) {
  const navigate = useNavigate()
  const quickMsgs = isFound ? QUICK_MSGS_FOUND : QUICK_MSGS
  const [quick, setQuick] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const effective = msg.trim() || quick || ''

  function pickQuick(m: string) {
    setQuick(m)
    setMsg(m)
  }

  async function handleSend() {
    if (!effective || sending) return
    setSending(true)
    try {
      const conv = await getOrCreateConversation({
        recipientId: seller._id,
        itemId,
        itemType,
        itemName: productName,
        itemImage,
      })
      await sendMessage(conv._id, effective)
      toast.success('Message sent!')
      onClose()
      navigate(`/messages/${conv._id}`)
    } catch {
      toast.error('Failed to send message to ' + seller.name + '!')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      size="md"
    >
      <div className="space-y-5">
        {/* Header Block */}
        <div className="flex items-center gap-3">
          <Avatar
            src={seller.avatar}
            name={seller.name}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">
              {seller.name}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Usually replies within an hour
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Send a message to discuss <strong className="text-[var(--text-primary)] font-semibold">{productName}</strong>.
          </p>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
              Quick Templates
            </span>
            <div className="flex flex-wrap gap-2">
              {quickMsgs.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => pickQuick(m)}
                  className={clsx(
                    'text-xs px-3 py-1.5 rounded-full border text-left cursor-pointer transition-all',
                    quick === m && msg === m
                      ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)] shadow-xs'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
              Custom Message
            </span>
            <textarea
              className={clsx(
                'w-full min-h-[100px] p-3 rounded-[var(--radius-md)] border text-sm',
                'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)]',
                'placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]',
                'transition-all resize-none'
              )}
              placeholder="Type your own message here..."
              value={msg}
              onChange={(e) => {
                setMsg(e.target.value)
                setQuick(null)
              }}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            disabled={!effective || sending}
            onClick={handleSend}
            fullWidth
            loading={sending}
            iconLeft={<Send size={14} />}
            className="h-11 font-semibold"
          >
            Send Message
          </Button>
        </div>
      </div>
    </Modal>
  )
}
