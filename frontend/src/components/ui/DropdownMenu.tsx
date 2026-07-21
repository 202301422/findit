import { type ReactNode } from 'react'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

/* ── Root ── */
export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger

/* ── Content ── */
interface DropdownMenuContentProps {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  className?: string
}

export function DropdownMenuContent({
  children,
  align = 'end',
  sideOffset = 6,
  className,
}: DropdownMenuContentProps) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        asChild
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className={clsx(
            'z-50 min-w-[180px] py-1.5 rounded-[var(--radius-md)]',
            'bg-[var(--surface-elevated)] border border-[var(--border-primary)]',
            'shadow-lg',
            className,
          )}
        >
          {children}
        </motion.div>
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  )
}

/* ── Item ── */
interface DropdownMenuItemProps {
  children: ReactNode
  icon?: ReactNode
  danger?: boolean
  onSelect?: () => void
  disabled?: boolean
}

export function DropdownMenuItem({
  children,
  icon,
  danger = false,
  onSelect,
  disabled,
}: DropdownMenuItemProps) {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer',
        'outline-none transition-colors',
        'data-[highlighted]:bg-[var(--bg-tertiary)]',
        'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
        danger
          ? 'text-[var(--color-error-500)] data-[highlighted]:text-[var(--color-error-600)]'
          : 'text-[var(--text-primary)]',
      )}
    >
      {icon && <span className="shrink-0 w-4 h-4 text-[var(--text-tertiary)]">{icon}</span>}
      {children}
    </DropdownPrimitive.Item>
  )
}

/* ── Separator ── */
export function DropdownMenuSeparator() {
  return (
    <DropdownPrimitive.Separator className="my-1 h-px bg-[var(--border-secondary)]" />
  )
}

/* ── Label ── */
export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownPrimitive.Label className="px-3 py-1.5 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
      {children}
    </DropdownPrimitive.Label>
  )
}
