import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import Badge from '@/components/ui/Badge'
import { 
  ShoppingBag, Search, Ticket, Bus, Train, Plane, Bookmark, BookmarkCheck
} from 'lucide-react'
import { profileService } from '@/services/profileService'
import { useAuth, isPostSaved } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface ProductCardProps {
  item: any
  type: string // 'sell' | 'found' | 'ticket' | 'pass'
  tabLabel: string
  /** If specified, overrides automatic saved check from AuthContext */
  initialSaved?: boolean
}

function getResolvedItemType(item: any, defaultType: string): string {
  if (item.type) return item.type
  if (item.itemType) return item.itemType
  if (item.category === 'Travelling Tickets' || item.ticketType || item.origin) return 'ticket'
  if (item.category === 'Event Passes') return 'pass'
  if (item.category === 'Lost & Found') return 'found'
  return defaultType || 'sell'
}

function getResolvedCategoryLabel(item: any, defaultTabLabel: string): string {
  if (item.category) return item.category
  const resolvedType = getResolvedItemType(item, defaultTabLabel)
  if (resolvedType === 'ticket') return 'Travelling Tickets'
  if (resolvedType === 'pass') return 'Event Passes'
  if (resolvedType === 'found') return 'Lost & Found'
  return 'Buy & Sell'
}

function getItemTitle(item: any): string {
  if (item.title) return item.title
  if (item.name) return item.name
  if (item.origin?.city && item.destination?.city) {
    return `${item.origin.city} → ${item.destination.city}`
  }
  return item.ticketType ? `${item.ticketType} Ticket` : 'Untitled'
}

function getItemPrice(item: any, resolvedCategory: string): string | null {
  if (resolvedCategory === 'Lost & Found') return null
  const price = item.sellingPrice ?? item.price
  return price !== undefined && price !== null ? `₹${Number(price).toLocaleString('en-IN')}` : null
}

function getItemImage(item: any): string | null {
  return item.images?.[0]?.url || item.imageUrl || null
}

function renderPlaceholderIcon(item: any, resolvedCategory: string) {
  if (resolvedCategory === 'Travelling Tickets' || item.ticketType) {
    if (item.ticketType === 'Bus') return <Bus className="w-8 h-8 text-[var(--color-primary-500)]" />
    if (item.ticketType === 'Train') return <Train className="w-8 h-8 text-[var(--color-primary-500)]" />
    return <Plane className="w-8 h-8 text-[var(--color-primary-500)]" />
  }
  if (resolvedCategory === 'Event Passes') return <Ticket className="w-8 h-8 text-[var(--color-primary-500)]" />
  if (resolvedCategory === 'Lost & Found') return <Search className="w-8 h-8 text-[var(--color-primary-500)]" />
  return <ShoppingBag className="w-8 h-8 text-[var(--color-primary-500)]" />
}

function getStatusBadge(item: any, resolvedType: string, resolvedCategory: string) {
  if (item.status === 'sold' || item.status === 'closed') {
    if (resolvedType === 'found' || resolvedCategory === 'Lost & Found') {
      return { label: 'Returned', variant: 'success' as const }
    }
    return { label: 'Sold', variant: 'error' as const }
  }
  if (item.isNegotiable) return { label: 'Negotiable', variant: 'success' as const }
  return null
}

export default function ProductCard({ item, type, tabLabel, initialSaved }: ProductCardProps) {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const resolvedType = getResolvedItemType(item, type)
  const resolvedCategory = getResolvedCategoryLabel(item, tabLabel)

  const savedInContext = isPostSaved(user, item._id)
  const [isSaved, setIsSaved] = useState(initialSaved ?? savedInContext)
  const [savingBookmark, setSavingBookmark] = useState(false)

  useEffect(() => {
    if (initialSaved === undefined) {
      setIsSaved(savedInContext)
    }
  }, [savedInContext, initialSaved])

  const imageUrl = getItemImage(item)
  const title = getItemTitle(item)
  const price = getItemPrice(item, resolvedCategory)
  const statusBadge = getStatusBadge(item, resolvedType, resolvedCategory)
  const showImage = imageUrl && !imgError

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation() // prevent card navigation
    if (savingBookmark) return
    setSavingBookmark(true)
    try {
      const res = await profileService.toggleSavedPost(item._id, resolvedType)
      setIsSaved(res.saved)
      await refreshUser()
      toast.success(res.saved ? 'Post saved!' : 'Post removed from saved')
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSavingBookmark(false)
    }
  }, [item._id, resolvedType, savingBookmark, refreshUser])

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => navigate(`/product/${item._id}?type=${resolvedType}`)}
      className={clsx(
        'group relative bg-[var(--surface-card)] rounded-[var(--radius-lg)]',
        'border border-[var(--border-secondary)] overflow-hidden cursor-pointer',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
        'transition-shadow duration-300',
      )}
      role="button"
      tabIndex={0}
      aria-label={`View ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/product/${item._id}?type=${resolvedType}`)
      }}
    >
      {/* ── Image / Fallback Placeholder ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-tertiary)]">
        {showImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-[var(--bg-tertiary)] via-[var(--border-primary)] to-[var(--bg-tertiary)] bg-[length:200%_100%]" />
            )}
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={clsx(
                'w-full h-full object-cover transition-transform duration-500',
                'group-hover:scale-105',
                imgLoaded ? 'opacity-100' : 'opacity-0',
              )}
            />
          </>
        ) : (
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-primary-50)]/90 via-[var(--bg-tertiary)] to-[var(--color-primary-100)]/60 dark:from-[var(--color-primary-500)]/12 dark:via-[var(--surface-card)] dark:to-[var(--color-primary-500)]/5 overflow-hidden">
            {/* Soft glowing ambient circle */}
            <div className="absolute w-24 h-24 rounded-full bg-[var(--color-primary-500)]/15 blur-xl pointer-events-none" />

            {/* Premium Icon Badge Container */}
            <div className="relative p-3.5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-secondary)] shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 flex items-center justify-center">
              {renderPlaceholderIcon(item, resolvedCategory)}
            </div>
          </div>
        )}

        {/* Status badge overlay */}
        {statusBadge && (
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={statusBadge.variant} size="sm" dot>
              {statusBadge.label}
            </Badge>
          </div>
        )}

        {/* ── Bookmark / Save Button (appears on card hover or when saved) ── */}
        <button
          type="button"
          onClick={handleBookmark}
          disabled={savingBookmark}
          aria-label={isSaved ? 'Remove from saved' : 'Save post'}
          title={isSaved ? 'Remove from saved' : 'Save post'}
          className={clsx(
            'absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center',
            'backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md',
            isSaved
              ? 'bg-[var(--color-primary-500)] text-white opacity-100 scale-100'
              : 'bg-black/50 text-white hover:bg-black/75 hover:scale-110 opacity-0 group-hover:opacity-100',
            savingBookmark && 'pointer-events-none opacity-60',
          )}
        >
          {isSaved ? (
            <BookmarkCheck size={15} strokeWidth={2.5} />
          ) : (
            <Bookmark size={15} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* ── Content ── */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1 mb-1">
          {title}
        </h3>

        <div className="flex items-center justify-between">
          {price ? (
            <span className="text-base font-bold text-[var(--color-primary-500)]">
              {price}
            </span>
          ) : (
            <span className="text-xs font-medium text-[var(--text-tertiary)]">
              {resolvedCategory === 'Lost & Found' ? 'Found item' : '—'}
            </span>
          )}

          {item.user?._id && item.user?.avatar ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/user/${item.user._id}`)
              }}
              title={`View ${item.user.name || 'user'}'s profile`}
              className="hover:scale-110 transition-transform cursor-pointer"
            >
              <img
                src={item.user.avatar}
                alt={item.user.name || ''}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-[var(--bg-primary)]"
              />
            </button>
          ) : item.user?.avatar ? (
            <img
              src={item.user.avatar}
              alt=""
              className="w-6 h-6 rounded-full object-cover ring-2 ring-[var(--bg-primary)]"
            />
          ) : null}
        </div>

        {/* Extra info for specific types */}
        {(resolvedCategory === 'Travelling Tickets' || resolvedType === 'ticket') && item.departureTime && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 truncate">
            {new Date(item.departureTime).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {(resolvedCategory === 'Event Passes' || resolvedType === 'pass') && item.dateTime && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 truncate">
            {new Date(item.dateTime).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </motion.article>
  )
}
