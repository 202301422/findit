import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  primary: 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
  success: 'bg-[var(--color-success-50)] text-[var(--color-success-600)] dark:bg-[var(--color-success-500)]/10 dark:text-[var(--color-success-500)]',
  warning: 'bg-[var(--color-warning-50)] text-[var(--color-warning-600)] dark:bg-[var(--color-warning-500)]/10 dark:text-[var(--color-warning-500)]',
  error: 'bg-[var(--color-error-50)] text-[var(--color-error-600)] dark:bg-[var(--color-error-500)]/10 dark:text-[var(--color-error-500)]',
  info: 'bg-[var(--color-info-50)] text-[var(--color-info-600)] dark:bg-[var(--color-info-500)]/10 dark:text-[var(--color-info-500)]',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-[var(--color-success-500)]',
            variant === 'error' && 'bg-[var(--color-error-500)]',
            variant === 'warning' && 'bg-[var(--color-warning-500)]',
            variant === 'primary' && 'bg-[var(--color-primary-500)]',
            variant === 'info' && 'bg-[var(--color-info-500)]',
            variant === 'default' && 'bg-[var(--text-tertiary)]',
          )}
        />
      )}
      {children}
    </span>
  )
}

/* ── Notification count badge ── */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null

  return (
    <span
      className={clsx(
        'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1',
        'flex items-center justify-center',
        'text-[10px] font-bold text-white',
        'bg-[var(--color-error-500)] rounded-full',
        'ring-2 ring-[var(--bg-primary)]',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
