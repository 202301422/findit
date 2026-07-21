import { useId } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

type BrandLogoProps = {
  to?: string
  variant?: 'icon' | 'compact' | 'full'
  className?: string
  showTagline?: boolean
}

export default function BrandLogo({
  to,
  variant = 'compact',
  className = '',
  showTagline = false,
}: BrandLogoProps) {
  const gradientId = useId().replace(/:/g, '')

  const rootClassName = clsx(
    'inline-flex items-center gap-2.5 no-underline select-none',
    className,
  )

  const content = (
    <>
      {/* SVG Mark */}
      <span className="shrink-0">
        <svg
          viewBox="0 0 72 72"
          focusable="false"
          aria-hidden="true"
          className="w-8 h-8"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="12"
              y1="10"
              x2="62"
              y2="62"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="var(--color-primary-500)" />
              <stop offset="100%" stopColor="var(--color-primary-600)" />
            </linearGradient>
          </defs>
          <circle
            cx="32"
            cy="32"
            r="22"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
          />
          <path
            d="M27 20h18l-4.2 6H33l-1.2 5h9.6l-4.1 5.8h-7.4l-2.6 11h-7.3L27 20Z"
            fill={`url(#${gradientId})`}
          />
          <path
            d="M46.5 46.5 58 58"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeWidth="7"
          />
        </svg>
      </span>

      {variant !== 'icon' && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight" aria-label="FindIt">
            <span className="text-[var(--text-primary)]">Find</span>
            <span className="text-[var(--color-primary-500)]">it</span>
          </span>
          {(variant === 'full' || showTagline) && (
            <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[var(--text-tertiary)]">
              FIND IT. GET IT. DONE.
            </span>
          )}
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={rootClassName} aria-label="FindIt home">
        {content}
      </Link>
    )
  }

  return <span className={rootClassName}>{content}</span>
}