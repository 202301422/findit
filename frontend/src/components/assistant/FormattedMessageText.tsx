import React from 'react'

interface FormattedMessageTextProps {
  content: string
  isUser?: boolean
}

const renderInlineFormatted = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2)
      return (
        <strong
          key={index}
          className="font-bold text-[var(--text-primary)] bg-[var(--color-primary-500)]/10 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] px-1 py-0.2 rounded-[var(--radius-xs)]"
        >
          {inner}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const inner = part.slice(1, -1)
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] font-mono text-[11px] text-[var(--color-primary-500)]"
        >
          {inner}
        </code>
      )
    }
    return part
  })
}

export default function FormattedMessageText({ content, isUser }: FormattedMessageTextProps) {
  if (!content) return null

  if (isUser) {
    return <span className="whitespace-pre-wrap word-break-words">{content}</span>
  }

  const lines = content.split('\n')

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-0.5" />
        }

        // Numbered list item: e.g. "1. Step description"
        const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/)
        if (numMatch) {
          const [, num, itemText] = numMatch
          return (
            <div key={idx} className="flex items-start gap-2 my-0.5">
              <span className="w-4 h-4 rounded-full bg-[var(--color-primary-500)]/15 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 select-none">
                {num}
              </span>
              <div className="flex-1 text-[var(--text-primary)]">
                {renderInlineFormatted(itemText)}
              </div>
            </div>
          )
        }

        // Bullet list item: e.g. "• Item description" or "- Item description"
        const bulletMatch = trimmed.match(/^[•\-\*]\s+(.*)$/)
        if (bulletMatch) {
          const [, itemText] = bulletMatch
          return (
            <div key={idx} className="flex items-start gap-2 my-0.5 pl-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-500)] shrink-0 mt-1.5" />
              <div className="flex-1 text-[var(--text-primary)]">
                {renderInlineFormatted(itemText)}
              </div>
            </div>
          )
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-[var(--text-primary)]">
            {renderInlineFormatted(trimmed)}
          </p>
        )
      })}
    </div>
  )
}
