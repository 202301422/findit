import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from "@/contexts/AuthContext";
import BrandLogo from '@/components/BrandLogo'
import Button from '@/components/ui/Button'
import { ArrowLeft, Inbox } from 'lucide-react'
import { clsx } from 'clsx'

interface VerifyEmailFormProps {
  email?: string
  onVerifyOTP?: (code: string) => void
  onResendOTP?: () => void
}

export default function VerifyEmailForm({
  onVerifyOTP,
  onResendOTP,
}: VerifyEmailFormProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = useState(59)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail } = useAuth()

  const email = location.state?.email || 'john@example.com'

  const allFilled = otp.every((d) => d !== '')

  /* ── Countdown timer ── */
  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  /* ── Auto-focus first input ── */
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function handleChange(index: number, value: string) {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData
      .getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || ''
    }
    setOtp(next)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleSubmit() {
    if (!allFilled) return
    const code = otp.join('')
    if (onVerifyOTP) {
      onVerifyOTP(code)
    }

    setLoading(true)
    try {
      await verifyEmail({ email, otp: code })
      toast.success('Email verified successfully! Please login.')
      navigate('/signin')
    } catch (error: any) {
      toast.error(error.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    if (onResendOTP) {
      onResendOTP()
    }

    setLoading(true)
    try {
      toast.error('Resend OTP logic requires backend endpoint integration in context')
      setCountdown(59)
      setOtp(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center">
        <BrandLogo variant="icon" className="mb-4" />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Verify your email
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xs">
          We&apos;ve sent a 6-character verification code to <span className="font-semibold text-[var(--text-primary)]">{email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2.5 my-6">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            className={clsx(
              "w-12 h-14 text-center text-xl font-bold rounded-[var(--radius-md)] border bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] transition-all",
              digit ? "border-[var(--color-primary-500)]" : "border-[var(--border-primary)]"
            )}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            autoComplete="one-time-code"
            spellCheck={false}
            aria-label={`Character ${i + 1}`}
          />
        ))}
      </div>

      <div className="flex gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-xs text-[var(--text-secondary)]">
        <Inbox className="w-5 h-5 text-[var(--text-tertiary)] shrink-0" />
        <p>
          Check your spam folder if you don&apos;t see the email in your inbox
          within a few minutes.
        </p>
      </div>

      <Button
        type="button"
        variant="primary"
        disabled={!allFilled || loading}
        onClick={handleSubmit}
        fullWidth
        loading={loading}
        className="h-11"
      >
        {allFilled ? 'Verify Code' : 'Enter Code Above'}
      </Button>

      <div className="text-center text-sm text-[var(--text-secondary)]">
        Didn&apos;t receive the code?{' '}
        {countdown > 0 ? (
          <span className="text-[var(--text-tertiary)] font-medium">
            Resend in {timeDisplay}
          </span>
        ) : (
          <button
            type="button"
            className="font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors cursor-pointer"
            onClick={handleResend}
          >
            Resend Code
          </button>
        )}
      </div>

      <div className="text-center">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Sign Up
        </Link>
      </div>
    </div>
  )
}
