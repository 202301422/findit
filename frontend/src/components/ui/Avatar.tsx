import { useState } from 'react'
import { clsx } from 'clsx'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string
  name: string
  size?: AvatarSize
  online?: boolean
  className?: string
  onClick?: () => void
}

const sizeMap: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', dot: 'w-2 h-2 ring-1' },
  sm: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2.5 h-2.5 ring-[1.5px]' },
  md: { container: 'w-10 h-10', text: 'text-sm', dot: 'w-3 h-3 ring-2' },
  lg: { container: 'w-12 h-12', text: 'text-base', dot: 'w-3.5 h-3.5 ring-2' },
  xl: { container: 'w-16 h-16', text: 'text-lg', dot: 'w-4 h-4 ring-2' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

// Generate a consistent hue based on name for the fallback background
function nameToHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export default function Avatar({
  src,
  name,
  size = 'md',
  online,
  className,
  onClick,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { container, text, dot } = sizeMap[size]
  const initials = getInitials(name)
  const hue = nameToHue(name)
  const showImage = src && !imgError

  return (
    <div
      className={clsx('relative inline-flex shrink-0 items-center justify-center', container, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className={clsx(
            'w-full h-full rounded-full object-cover',
            onClick && 'cursor-pointer',
          )}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={clsx(
            'w-full h-full rounded-full flex items-center justify-center font-semibold text-white',
            onClick && 'cursor-pointer',
            text,
          )}
          style={{
            background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), hsl(${hue + 30}, 65%, 45%))`,
          }}
          aria-label={name}
        >
          {initials}
        </div>
      )}

      {online !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-[var(--bg-primary)]',
            dot,
            online ? 'bg-[var(--color-success-500)]' : 'bg-[var(--text-tertiary)]',
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  )
}
