import { Sparkles } from 'lucide-react'

export default function AssistantTypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 my-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--color-primary-600)] to-[var(--color-primary-400)] flex items-center justify-center text-white shrink-0 shadow-xs transition-colors duration-300">
        <Sparkles size={14} className="animate-pulse" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
