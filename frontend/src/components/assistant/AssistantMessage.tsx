import { useNavigate } from 'react-router-dom'
import { Sparkles, User, SlidersHorizontal, CheckCircle2, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { AssistantMessage as AssistantMessageType, AssistantListing } from '@/types/assistant.types'
import AssistantListingCard from './AssistantListingCard'
import AssistantSuggestions from './AssistantSuggestions'
import FormattedMessageText from './FormattedMessageText'
import { applyFiltersToHome, navigateToProduct } from '@/utils/assistantNavigation'

interface AssistantMessageProps {
  message: AssistantMessageType
  selectedCompareIds: string[]
  onToggleCompareListing?: (listing: AssistantListing) => void
  onSelectSuggestion?: (prompt: string) => void
  onClosePanel?: () => void
}

export default function AssistantMessage({
  message,
  selectedCompareIds,
  onToggleCompareListing,
  onSelectSuggestion,
  onClosePanel,
}: AssistantMessageProps) {
  const navigate = useNavigate()
  const isUser = message.role === 'user'

  const hasFilters =
    message.appliedFilters &&
    Object.keys(message.appliedFilters).length > 0 &&
    (message.appliedFilters.search ||
      message.appliedFilters.category ||
      message.appliedFilters.maxPrice ||
      message.appliedFilters.isNegotiable ||
      message.appliedFilters.hasWarranty ||
      message.appliedFilters.dateAfter ||
      message.appliedFilters.dateBefore ||
      message.appliedFilters.venue ||
      message.appliedFilters.originCity ||
      message.appliedFilters.destinationCity)

  return (
    <div
      className={clsx(
        'flex items-start gap-2.5 my-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar Icon */}
      <div
        className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-2xs transition-colors duration-300',
          isUser
            ? 'bg-[var(--color-primary-500)]'
            : 'bg-gradient-to-tr from-[var(--color-primary-600)] to-[var(--color-primary-400)]',
        )}
      >
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      {/* Message Bubble */}
      <div
        className={clsx(
          'max-w-[88%] sm:max-w-[82%] space-y-2.5',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={clsx(
            'px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs word-break-words space-y-2',
            isUser
              ? 'bg-[var(--color-primary-500)] text-white rounded-tr-xs font-medium'
              : message.isError
              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-tl-xs'
              : 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-tl-xs',
          )}
        >
          {(message.imageBase64 || message.imageUrl) && (
            <div className="rounded-[var(--radius-md)] overflow-hidden border border-white/20 max-w-[200px] shadow-xs">
              <img
                src={message.imageBase64 || message.imageUrl}
                alt="Uploaded search query"
                className="w-full h-auto object-cover max-h-48 rounded-[var(--radius-md)]"
              />
            </div>
          )}
          {message.content ? <FormattedMessageText content={message.content} isUser={isUser} /> : null}
        </div>

        {/* Applied Filters Button */}
        {hasFilters && message.appliedFilters && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => applyFiltersToHome(message.appliedFilters!, navigate, onClosePanel)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-all cursor-pointer shadow-xs"
            >
              <SlidersHorizontal size={13} />
              <span>View all matching results on Home</span>
            </button>
          </div>
        )}

        {/* Structured Listing Cards Grid */}
        {message.listings && message.listings.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 gap-2">
              {message.listings.map((item) => (
                <AssistantListingCard
                  key={item._id}
                  listing={item}
                  isSelectedForCompare={selectedCompareIds.includes(item._id)}
                  onToggleCompare={onToggleCompareListing}
                  onSelectSuggestion={onSelectSuggestion}
                  onClosePanel={onClosePanel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Grounded Listing Comparison Block */}
        {message.comparison && (
          <div className="rounded-[var(--radius-lg)] p-3 bg-[var(--surface-card)] border border-[var(--border-primary)] space-y-3 shadow-xs text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[var(--color-primary-500)] border-b border-[var(--border-secondary)] pb-2">
              <Sparkles size={14} />
              <span>Listing Comparison</span>
            </div>

            <p className="text-[var(--text-primary)] leading-relaxed font-medium">
              {message.comparison.summary}
            </p>

            {/* Items Breakdown */}
            {message.comparison.items && message.comparison.items.length > 0 && (
              <div className="space-y-2">
                {message.comparison.items.map((compItem) => {
                  const matchListing = message.listings?.find((l) => l._id === compItem.listingId)
                  const title = matchListing
                    ? matchListing.name || matchListing.ticketType || 'Listing Item'
                    : `Listing #${compItem.listingId.slice(-6)}`

                  const isBest = message.comparison?.bestChoiceListingId === compItem.listingId

                  return (
                    <div
                      key={compItem.listingId}
                      className={clsx(
                        'p-2.5 rounded-[var(--radius-md)] border space-y-1.5 bg-[var(--bg-secondary)]',
                        isBest
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-[var(--border-primary)]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-[var(--text-primary)] truncate">
                          {title}
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                            <CheckCircle2 size={10} />
                            Best Fit
                          </span>
                        )}
                      </div>

                      {/* Advantages */}
                      {compItem.advantages && compItem.advantages.length > 0 && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 space-y-0.5">
                          {compItem.advantages.map((adv, idx) => (
                            <p key={idx} className="flex items-start gap-1">
                              <span>✓</span>
                              <span>{adv}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Limitations */}
                      {compItem.limitations && compItem.limitations.length > 0 && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 space-y-0.5">
                          {compItem.limitations.map((lim, idx) => (
                            <p key={idx} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{lim}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {matchListing && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigateToProduct(
                                matchListing._id,
                                matchListing.type,
                                navigate,
                                onClosePanel,
                              )
                            }
                            className="text-[10px] font-bold text-[var(--color-primary-500)] hover:underline cursor-pointer"
                          >
                            Open details →
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Caveats */}
            {message.comparison.caveats && message.comparison.caveats.length > 0 && (
              <div className="text-[11px] text-[var(--text-tertiary)] flex items-start gap-1">
                <HelpCircle size={12} className="shrink-0 mt-0.5 text-amber-500" />
                <div>
                  {message.comparison.caveats.map((cav, idx) => (
                    <span key={idx}>{cav} </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contextual Suggestion Prompts */}
        {message.suggestedPrompts &&
          message.suggestedPrompts.length > 0 &&
          onSelectSuggestion && (
            <AssistantSuggestions
              onSelectSuggestion={onSelectSuggestion}
              customSuggestions={message.suggestedPrompts}
            />
          )}
      </div>
    </div>
  )
}
