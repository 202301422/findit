import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { MessageSquare, Calendar, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'

interface Seller {
  _id: string
  name: string
  email: string
  avatar?: string
  createdAt?: string
  phone?: string
  college?: string
}

interface SellerCardProps {
  seller: Seller
  createdAt: string
  isOwner: boolean
  isSold?: boolean
  isFound?: boolean
  onChat: () => void
}

function memberSince(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
}

export default function SellerCard({
  seller,
  createdAt,
  isOwner,
  isSold = false,
  isFound = false,
  onChat,
}: SellerCardProps) {
  const btnLabel = isFound ? 'Contact Finder' : 'Chat with Seller'
  
  return (
    <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={seller.avatar}
            name={seller.name}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                {seller.name}
              </span>
              <span title="Verified User">
                <ShieldCheck className="w-4 h-4 text-[var(--color-primary-500)] shrink-0" />
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
              <Calendar size={12} />
              {seller.createdAt && `Joined ${memberSince(seller.createdAt)}`}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
            Posted
          </span>
          <span className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 block">
            {timeAgo(createdAt)}
          </span>
        </div>
      </div>

      {/* Action triggers */}
      {!isOwner && !isSold && (
        <Button
          type="button"
          variant={isFound ? 'secondary' : 'primary'}
          onClick={onChat}
          fullWidth
          iconLeft={<MessageSquare size={16} />}
          className={clsx(
            "h-10 text-sm font-semibold",
            isFound && "!bg-[var(--color-success-50)] !text-[var(--color-success-600)] !border-[var(--color-success-500)]/20 hover:!bg-[var(--color-success-500)]/10"
          )}
        >
          {btnLabel}
        </Button>
      )}

      {isOwner && (
        <div className="p-3 text-center text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
          This is your own listing
        </div>
      )}

      {isSold && !isOwner && (
        <div className="p-3 text-center text-xs font-bold text-[var(--color-error-600)] bg-[var(--color-error-50)] border border-[var(--color-error-500)]/20 rounded-[var(--radius-md)]">
          {isFound ? 'This item has already been claimed / closed' : 'This item has already been sold'}
        </div>
      )}
    </div>
  )
}
