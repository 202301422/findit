import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rect'
  width?: string | number
  height?: string | number
  count?: number
}

export default function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = clsx(
    'bg-[var(--bg-tertiary)] animate-shimmer',
    'bg-gradient-to-r from-[var(--bg-tertiary)] via-[var(--border-primary)] to-[var(--bg-tertiary)]',
    'bg-[length:200%_100%]',
    variant === 'circle' && 'rounded-full',
    variant === 'text' && 'rounded-[var(--radius-sm)] h-4',
    variant === 'rect' && 'rounded-[var(--radius-md)]',
    className,
  )

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  if (count > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={baseClasses}
            style={{
              ...style,
              width: i === count - 1 ? '75%' : style.width, // Last line shorter
            }}
          />
        ))}
      </div>
    )
  }

  return <div className={baseClasses} style={style} />
}

/* ── Pre-built skeleton compositions ── */

export function SkeletonCard() {
  return (
    <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] overflow-hidden">
      <Skeleton variant="rect" height={200} className="w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={14} />
        <div className="flex justify-between items-center pt-1">
          <Skeleton width={80} height={24} className="rounded-full" />
          <Skeleton variant="circle" width={32} height={32} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonLine({ width = '100%' }: { width?: string | number }) {
  return <Skeleton variant="text" width={width} />
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circle" width={size} height={size} />
}
