import { ShoppingBag, MapPin, Ticket, CalendarDays, HelpCircle } from 'lucide-react'

interface AssistantSuggestionsProps {
  onSelectSuggestion: (prompt: string) => void
  customSuggestions?: string[]
}

const DEFAULT_SUGGESTIONS = [
  { text: 'Find laptops under ₹40,000', icon: ShoppingBag },
  { text: 'Search Lost & Found near library', icon: MapPin },
  { text: 'Find travel ticket for tomorrow', icon: Ticket },
  { text: 'Find concert pass under ₹3,000', icon: CalendarDays },
  { text: 'How does FindIt work?', icon: HelpCircle },
]

export default function AssistantSuggestions({
  onSelectSuggestion,
  customSuggestions,
}: AssistantSuggestionsProps) {
  if (customSuggestions && customSuggestions.length > 0) {
    return (
      <div className="flex flex-wrap gap-1.5 py-2">
        {customSuggestions.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectSuggestion(prompt)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--color-primary-500)] hover:border-[var(--color-primary-500)]/40 hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--surface-elevated)] transition-all cursor-pointer shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        Suggested Prompts
      </p>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(item.text)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-card)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:text-[var(--color-primary-500)] hover:border-[var(--color-primary-500)] transition-all cursor-pointer shadow-xs hover:shadow-sm"
            >
              <Icon size={13} className="text-[var(--color-primary-500)] shrink-0" />
              <span>{item.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
