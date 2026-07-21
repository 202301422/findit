import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-[var(--text-tertiary)]">
          {typeof icon === 'string' ? (
            <span className="text-5xl">{icon}</span>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
              {icon}
            </div>
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  )
}
