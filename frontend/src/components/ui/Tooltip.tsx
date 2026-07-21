import { type ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { clsx } from 'clsx'

interface TooltipProps {
  children: ReactNode
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  delayDuration?: number
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

export default function Tooltip({
  children,
  content,
  side = 'top',
  delayDuration = 300,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={clsx(
            'z-50 px-2.5 py-1.5 text-xs font-medium rounded-[var(--radius-sm)]',
            'bg-[var(--bg-inverse)] text-[var(--text-inverse)]',
            'shadow-md animate-[fade-in_0.15s_ease]',
            'data-[state=delayed-open]:animate-[slide-down_0.2s_ease]',
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--bg-inverse)]" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
