import { type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export default function Modal({
  open,
  onOpenChange,
  children,
  title,
  description,
  size = 'md',
  showClose = true,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={clsx(
                  'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)]',
                  '-translate-x-1/2 -translate-y-1/2',
                  'bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] shadow-xl',
                  'border border-[var(--border-secondary)]',
                  'p-6 focus:outline-none',
                  'max-h-[85vh] overflow-y-auto',
                  sizeClasses[size],
                )}
              >
                {showClose && (
                  <DialogPrimitive.Close asChild>
                    <button
                      className={clsx(
                        'absolute top-4 right-4 p-1.5 rounded-[var(--radius-sm)]',
                        'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
                        'hover:bg-[var(--bg-tertiary)] transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30',
                      )}
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </DialogPrimitive.Close>
                )}

                {title && (
                  <DialogPrimitive.Title className="text-lg font-semibold text-[var(--text-primary)] pr-8">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)] mt-1.5">
                    {description}
                  </DialogPrimitive.Description>
                )}

                <div className={clsx((title || description) && 'mt-5')}>
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
