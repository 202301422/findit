import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { clsx } from 'clsx'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export default function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  const iconSize = size === 'sm' ? 16 : 18

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        sizeClasses,
        'relative flex items-center justify-center rounded-[var(--radius-md)]',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        'hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
        className,
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, rotate: 90, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isDark ? (
          <Moon size={iconSize} />
        ) : (
          <Sun size={iconSize} />
        )}
      </motion.div>
    </button>
  )
}
