import { useId } from 'react'
import { Link } from 'react-router-dom'

type BrandLogoProps = {
  to?: string
  variant?: 'icon' | 'compact' | 'full'
  tone?: 'brand' | 'inverse'
  className?: string
  showTagline?: boolean
}

export default function BrandLogo({
  to,
  variant = 'compact',
  tone = 'brand',
  className = '',
  showTagline = false,
}: BrandLogoProps) {
  const gradientId = useId().replace(/:/g, '')

  const rootClassName = [
    'findit-brand',
    `findit-brand--${variant}`,
    `findit-brand--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span className="findit-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 72 72" focusable="false" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="12" y1="10" x2="62" y2="62" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--brand-mark-start)" />
              <stop offset="100%" stopColor="var(--brand-mark-end)" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="22" fill="none" stroke={`url(#${gradientId})`} strokeWidth="7" />
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
          <path
            d="M39 37.4l4.3-1.7-3 3.6 1.4 4.6-3.9-2.4-4 2.4 1.4-4.6-3-3.6 4.4 1.7L39 32l0 5.4Z"
            fill="var(--brand-mark-cut)"
            opacity="0.92"
          />
        </svg>
      </span>

      {variant !== 'icon' ? (
        <span className="findit-brand__copy">
          <span className="findit-brand__wordmark" aria-label="Findit">
            <span className="findit-brand__find">Find</span>
            <span className="findit-brand__it">it</span>
          </span>
          {(variant === 'full' || showTagline) ? (
            <span className="findit-brand__tagline">FIND IT. GET IT. DONE.</span>
          ) : null}
        </span>
      ) : null}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={rootClassName} aria-label="Findit home">
        {content}
      </Link>
    )
  }

  return <span className={rootClassName}>{content}</span>
}