import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
  variant?: 'default' | 'pills'
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'default',
}: TabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  if (variant === 'pills') {
    return (
      <div
        className={clsx(
          'flex gap-2 overflow-x-auto scrollbar-hide pb-1',
          className,
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
                'transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)]',
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={clsx(
                    'text-[11px] px-1.5 py-0.5 rounded-full font-semibold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--border-primary)] text-[var(--text-tertiary)]',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Default underline variant
  return (
    <div
      className={clsx(
        'flex border-b border-[var(--border-primary)] overflow-x-auto scrollbar-hide',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const isHovered = tab.id === hoveredTab

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className={clsx(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap cursor-pointer',
              'transition-colors duration-200',
              isActive
                ? 'text-[var(--color-primary-500)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary-500)] rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            {isHovered && !isActive && (
              <motion.div
                layoutId="tab-hover"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--border-primary)] rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
