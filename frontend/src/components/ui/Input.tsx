import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, iconRight, fullWidth = true, className, id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id || autoId
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint ? `${inputId}-hint` : undefined

    return (
      <div className={clsx('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={clsx(errorId, hintId) || undefined}
            className={clsx(
              'w-full h-11 rounded-[var(--radius-md)] border bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm',
              'placeholder:text-[var(--text-tertiary)]',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--color-error-500)] focus:ring-[var(--color-error-500)]/30 focus:border-[var(--color-error-500)]'
                : 'border-[var(--border-primary)] hover:border-[var(--text-tertiary)]',
              iconLeft ? 'pl-10' : 'pl-3.5',
              iconRight ? 'pr-10' : 'pr-3.5',
              className,
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-[var(--color-error-500)] mt-0.5">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
