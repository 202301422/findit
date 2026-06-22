import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface VerifyEmailFormProps {
  email?: string
  onVerifyOTP?: (code: string) => void
  onResendOTP?: () => void
}

export default function VerifyEmailForm({
  email = 'john@example.com',
  onVerifyOTP,
  onResendOTP,
}: VerifyEmailFormProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = useState(59)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()

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
    if (!/^\d?$/.test(value)) return
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
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || ''
    }
    setOtp(next)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  function handleSubmit() {
    if (!allFilled) return
    const code = otp.join('')
    if (onVerifyOTP) {
      onVerifyOTP(code)
    }
    navigate('/signin')
  }

  function handleResend() {
    if (countdown > 0) return
    setCountdown(59)
    setOtp(Array(6).fill(''))
    inputRefs.current[0]?.focus()
    if (onResendOTP) {
      onResendOTP()
    }
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <>
      <Link to="/signup" className="back-link">
        ← Back
      </Link>

      <div className="brand-mark" aria-hidden="true">
        <MailCheckIcon />
      </div>

      <h1>Verify your email</h1>
      <p className="subtitle">
        We&apos;ve sent a 6-digit verification code to{' '}
        <strong>{email}</strong>
      </p>

      <div className="otp-row">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            className="otp-input"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <div className="info-box">
        <p>
          Check your spam folder if you don&apos;t see the email in your inbox
          within a few minutes.
        </p>
      </div>

      <button
        type="button"
        className="primary-btn"
        disabled={!allFilled}
        onClick={handleSubmit}
      >
        {allFilled ? 'Verify Code' : 'Enter Code Above'}
      </button>

      <p className="footer-copy">
        Didn&apos;t receive the code?{' '}
        <button
          type="button"
          className={`text-link inline ${countdown > 0 ? 'disabled' : ''}`}
          onClick={handleResend}
          disabled={countdown > 0}
        >
          Resend Code
        </button>
        {countdown > 0 && (
          <span className="countdown-text">
            {' '}You can resend in {timeDisplay}
          </span>
        )}
      </p>
    </>
  )
}

/* ── Icons ── */

function MailCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" style={{ stroke: '#ff7a2f', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2 8 5 8-5" />
      <path d="M22 7l-5 5-2-2" />
    </svg>
  )
}
