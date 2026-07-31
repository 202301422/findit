import { useNavigate } from 'react-router-dom'
import { ShoppingBag, MapPin, Ticket, CalendarDays, ExternalLink, MessageCircle, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import type { AssistantListing } from '@/types/assistant.types'
import { navigateToProduct } from '@/utils/assistantNavigation'

interface AssistantListingCardProps {
  listing: AssistantListing
  isSelectedForCompare?: boolean
  onToggleCompare?: (listing: AssistantListing) => void
  onSelectSuggestion?: (prompt: string) => void
  onClosePanel?: () => void
}

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'found':
      return { label: 'Found Item', icon: MapPin, colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
    case 'ticket':
      return { label: 'Ticket', icon: Ticket, colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
    case 'pass':
      return { label: 'Event Pass', icon: CalendarDays, colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
    case 'sell':
    default:
      return { label: 'Buy & Sell', icon: ShoppingBag, colorClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' }
  }
}

export default function AssistantListingCard({
  listing,
  isSelectedForCompare,
  onToggleCompare,
  onSelectSuggestion,
  onClosePanel,
}: AssistantListingCardProps) {
  const navigate = useNavigate()
  const typeConfig = getTypeConfig(listing.type)
  const Icon = typeConfig.icon

  const imageSrc =
    listing.imageUrl ||
    (listing.images && listing.images.length > 0 ? listing.images[0].url : null)

  const title =
    listing.name ||
    (listing.origin?.city && listing.destination?.city
      ? `${listing.origin.city} → ${listing.destination.city}`
      : listing.ticketType || 'Listing Item')

  const priceVal = listing.sellingPrice ?? listing.price

  const locationText =
    typeof listing.venue === 'string'
      ? listing.venue
      : listing.venue?.city
      ? `${listing.venue.area ? `${listing.venue.area}, ` : ''}${listing.venue.city}`
      : listing.origin?.city
      ? `${listing.origin.city} → ${listing.destination?.city || ''}`
      : null

  const dateText = listing.dateTime
    ? new Date(listing.dateTime).toLocaleDateString()
    : listing.departureTime
    ? new Date(listing.departureTime).toLocaleDateString()
    : null

  const handleAskSeller = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (listing.user?._id) {
      if (onClosePanel) onClosePanel()
      navigate(`/chat/${listing.user._id}`)
    } else {
      navigateToProduct(listing._id, listing.type, navigate, onClosePanel)
    }
  }

  const handleFindSimilar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSelectSuggestion && (listing.category || listing.name)) {
      onSelectSuggestion(`Find similar items to ${listing.name || listing.category}`)
    }
  }

  return (
    <div
      className={clsx(
        'relative rounded-[var(--radius-lg)] p-3 bg-[var(--surface-card)] border transition-all shadow-2xs hover:shadow-xs',
        isSelectedForCompare
          ? 'border-[var(--color-primary-500)] ring-1 ring-[var(--color-primary-500)]'
          : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail Image */}
        <div className="w-16 h-16 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] overflow-hidden shrink-0 flex items-center justify-center border border-[var(--border-secondary)]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Icon className="w-7 h-7 text-[var(--text-tertiary)]" />
          )}
        </div>

        {/* Content details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                typeConfig.colorClass,
              )}
            >
              <Icon size={10} />
              {typeConfig.label}
            </span>

            {priceVal !== undefined && (
              <span className="text-xs font-bold text-[var(--color-primary-500)]">
                ₹{priceVal.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
            {title}
          </h4>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-secondary)]">
            {locationText && <span className="truncate">📍 {locationText}</span>}
            {dateText && <span>📅 {dateText}</span>}
            {listing.isNegotiable && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                • Negotiable
              </span>
            )}
            {listing.hasWarranty && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                • Warranty ({listing.warrantyValue || 1} {listing.warrantyUnit || 'mo'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Rufus Quick Actions */}
      <div className="mt-2.5 pt-2 border-t border-[var(--border-secondary)] flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-2">
          {onToggleCompare && (
            <label className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(isSelectedForCompare)}
                onChange={() => onToggleCompare(listing)}
                className="w-3.5 h-3.5 rounded border-[var(--border-primary)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
              />
              <span>Compare</span>
            </label>
          )}

          {listing.user?._id && (
            <button
              type="button"
              onClick={handleAskSeller}
              title="Chat with seller"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary-500)] cursor-pointer"
            >
              <MessageCircle size={12} />
              <span>Ask seller</span>
            </button>
          )}

          {onSelectSuggestion && (listing.category || listing.name) && (
            <button
              type="button"
              onClick={handleFindSimilar}
              title="Find similar campus items"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary-500)] cursor-pointer"
            >
              <Sparkles size={11} />
              <span>Similar</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigateToProduct(listing._id, listing.type, navigate, onClosePanel)}
          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-semibold text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        >
          <span>View</span>
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  )
}
