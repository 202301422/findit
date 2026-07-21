import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import Badge from '@/components/ui/Badge'
import { 
  ShoppingBag, Search, Ticket, Bus, Train, Plane
} from 'lucide-react'

interface ProductCardProps {
  item: any
  type: string // 'sell' | 'found' | 'ticket' | 'pass'
  tabLabel: string
}

function getItemTitle(item: any): string {
  if (item.name) return item.name
  if (item.origin?.city && item.destination?.city) {
    return `${item.origin.city} → ${item.destination.city}`
  }
  return item.ticketType || 'Untitled'
}

function getItemPrice(item: any, tabLabel: string): string | null {
  if (tabLabel === 'Lost & Found') return null
  const price = item.sellingPrice || item.price
  return price ? `₹${price.toLocaleString('en-IN')}` : null
}

function getItemImage(item: any): string | null {
  return item.images?.[0]?.url || item.imageUrl || null
}

function renderPlaceholderIcon(tabLabel: string, item: any) {
  if (tabLabel === 'Travelling Tickets') {
    if (item.ticketType === 'Bus') return <Bus className="w-8 h-8 text-[var(--color-primary-500)]" />
    if (item.ticketType === 'Train') return <Train className="w-8 h-8 text-[var(--color-primary-500)]" />
    return <Plane className="w-8 h-8 text-[var(--color-primary-500)]" />
  }
  if (tabLabel === 'Event Passes') return <Ticket className="w-8 h-8 text-[var(--color-primary-500)]" />
  if (tabLabel === 'Lost & Found') return <Search className="w-8 h-8 text-[var(--color-primary-500)]" />
  return <ShoppingBag className="w-8 h-8 text-[var(--color-primary-500)]" />
}

function getStatusBadge(item: any) {
  if (item.status === 'sold') return { label: 'Sold', variant: 'error' as const }
  if (item.isNegotiable) return { label: 'Negotiable', variant: 'success' as const }
  return null
}

export default function ProductCard({ item, type, tabLabel }: ProductCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const imageUrl = getItemImage(item)
  const title = getItemTitle(item)
  const price = getItemPrice(item, tabLabel)
  const statusBadge = getStatusBadge(item)
  const showImage = imageUrl && !imgError

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => navigate(`/product/${item._id}?type=${type}`)}
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
        if (e.key === 'Enter') navigate(`/product/${item._id}?type=${type}`)
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
              {renderPlaceholderIcon(tabLabel, item)}
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
              {tabLabel === 'Lost & Found' ? 'Found item' : '—'}
            </span>
          )}

          {item.user?.avatar && (
            <img
              src={item.user.avatar}
              alt=""
              className="w-6 h-6 rounded-full object-cover ring-2 ring-[var(--bg-primary)]"
            />
          )}
        </div>

        {/* Extra info for specific types */}
        {tabLabel === 'Travelling Tickets' && item.departureTime && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 truncate">
            {new Date(item.departureTime).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {tabLabel === 'Event Passes' && item.dateTime && (
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
