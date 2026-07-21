import { type ReactNode, type HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'article' | 'section'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
}

export default function Card({
  children,
  hover = false,
  padding = 'md',
  as: Tag = 'div',
  className,
  ...props
}: CardProps) {


  const classes = clsx(
    'bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)]',
    'shadow-[var(--shadow-card)] transition-all duration-300',
    paddingClasses[padding],
    hover && 'hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-primary)]',
    className,
  )

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={classes}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  )
}
