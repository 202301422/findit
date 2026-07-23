import { useState, useCallback, useEffect } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { MessageSquare, Calendar, ShieldCheck, Bookmark, BookmarkCheck } from 'lucide-react'
import { profileService } from '@/services/profileService'
import { useAuth, isPostSaved } from '@/contexts/AuthContext'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

import { useNavigate } from 'react-router-dom'

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
  /** The item ID to save/unsave */
  itemId?: string
  /** The item type ('sell' | 'found' | 'ticket' | 'pass') */
  itemType?: string
  /** Whether the item is already saved by the current user */
  initialSaved?: boolean
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
  itemId,
  itemType,
  initialSaved,
}: SellerCardProps) {
  const navigate = useNavigate()
  const btnLabel = isFound ? 'Contact Finder' : 'Chat with Seller'
  const { user, refreshUser } = useAuth()

  const savedInContext = isPostSaved(user, itemId)
  const [isSaved, setIsSaved] = useState(initialSaved ?? savedInContext)
  const [savingBookmark, setSavingBookmark] = useState(false)

  useEffect(() => {
    if (initialSaved === undefined) {
      setIsSaved(savedInContext)
    }
  }, [savedInContext, initialSaved])

  const handleSave = useCallback(async () => {
    if (!itemId || !itemType || savingBookmark) return
    setSavingBookmark(true)
    try {
      const res = await profileService.toggleSavedPost(itemId, itemType)
      setIsSaved(res.saved)
      await refreshUser()
      toast.success(res.saved ? 'Post saved!' : 'Removed from saved')
    } catch {
      toast.error('Failed to update saved posts')
    } finally {
      setSavingBookmark(false)
    }
  }, [itemId, itemType, savingBookmark, refreshUser])

  return (
    <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div
          onClick={() => seller?._id && navigate(`/user/${seller._id}`)}
          className="flex items-center gap-3 cursor-pointer group/seller"
          title={`View ${seller.name}'s profile`}
        >
          <div className="transition-transform group-hover/seller:scale-105">
            <Avatar
              src={seller.avatar}
              name={seller.name}
              size="lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm sm:text-base text-[var(--text-primary)] group-hover/seller:text-[var(--color-primary-500)] transition-colors">
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
        <div className="flex gap-2">
          {/* Primary chat/contact action */}
          <Button
            type="button"
            variant={isFound ? 'secondary' : 'primary'}
            onClick={onChat}
            fullWidth
            iconLeft={<MessageSquare size={16} />}
            className={clsx(
              "h-10 text-sm font-semibold flex-1",
              isFound && "!bg-[var(--color-success-50)] !text-[var(--color-success-600)] !border-[var(--color-success-500)]/20 hover:!bg-[var(--color-success-500)]/10"
            )}
          >
            {btnLabel}
          </Button>

          {/* Save / Bookmark button — always visible on detail page */}
          {itemId && itemType && (
            <button
              type="button"
              onClick={handleSave}
              disabled={savingBookmark}
              aria-label={isSaved ? 'Remove from saved' : 'Save this post'}
              title={isSaved ? 'Remove from saved' : 'Save this post'}
              className={clsx(
                'h-10 w-10 shrink-0 rounded-[var(--radius-md)] border flex items-center justify-center transition-all duration-200 cursor-pointer',
                isSaved
                  ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)] text-white shadow-sm'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-500)]',
                savingBookmark && 'opacity-60 pointer-events-none',
              )}
            >
              {isSaved ? (
                <BookmarkCheck size={16} strokeWidth={2.5} />
              ) : (
                <Bookmark size={16} strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>
      )}

      {isOwner && (
        <div className="p-3 text-center text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
          This is your own listing
        </div>
      )}

      {isSold && !isOwner && (
        <div className="flex flex-col gap-2">
          <div className="p-3 text-center text-xs font-bold text-[var(--color-error-600)] bg-[var(--color-error-50)] border border-[var(--color-error-500)]/20 rounded-[var(--radius-md)]">
            {isFound ? 'This item has already been returned to its owner' : 'This item has already been sold'}
          </div>
          {/* Still allow saving a sold item for reference */}
          {itemId && itemType && (
            <button
              type="button"
              onClick={handleSave}
              disabled={savingBookmark}
              aria-label={isSaved ? 'Remove from saved' : 'Save this post'}
              className={clsx(
                'w-full h-9 rounded-[var(--radius-md)] border flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 cursor-pointer',
                isSaved
                  ? 'bg-[var(--color-primary-500)]/10 border-[var(--color-primary-500)]/30 text-[var(--color-primary-600)]'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--color-primary-500)] hover:border-[var(--color-primary-500)]/40',
                savingBookmark && 'opacity-60 pointer-events-none',
              )}
            >
              {isSaved ? (
                <><BookmarkCheck size={14} strokeWidth={2.5} /> Saved</>
              ) : (
                <><Bookmark size={14} strokeWidth={2.5} /> Save for later</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
