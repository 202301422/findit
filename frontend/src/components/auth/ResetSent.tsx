import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

export default function ResetSent() {
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const location = useLocation()
  const { resetPassword } = useAuth()
  
  const email = location.state?.email

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
    { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
    { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
    { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
    { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
  ]

  const unmetPasswordRequirements = passwordRequirements.filter((rule) => !rule.test(newPassword))

  function validatePassword(): boolean {
    if (unmetPasswordRequirements.length > 0) {
      setErrors({ password: 'Password does not meet all requirements' })
      return false
    }

    setErrors({})
    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    if (!email) {
      toast.error('Email not found. Please try requesting a reset again.')
      navigate('/forgot-password')
      return
    }

    if (!validatePassword()) {
      return
    }

    setLoading(true)
    try {
      await resetPassword({ email, otp, newPassword })
      toast.success('Password successfully reset! Please login.')
      navigate('/signin')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="brand-mark" aria-hidden="true">
        <MailCheckIcon />
      </div>

      <h1>Reset Password</h1>
      <p className="subtitle">
        We&apos;ve sent a password reset code to {email || 'your email'}.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <label>
          Reset Code
          <div className="field-shell">
            <input
              type="text"
              placeholder="Enter 6-character code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              required
              disabled={loading}
              maxLength={6}
            />
          </div>
        </label>
        
        <label>
          New Password
          <div className="field-shell">
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <ul
            aria-label="Password requirements"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0.6rem 0 0',
              display: 'grid',
              gap: '0.35rem',
              fontSize: '0.92rem',
              color: 'var(--muted, #6b7280)'
            }}
          >
            {passwordRequirements.map((rule) => {
              const isMet = rule.test(newPassword)

              return (
                <li
                  key={rule.label}
                  style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                >
                  <span
                    aria-hidden="true"
                    style={{ color: isMet ? 'var(--success, #16a34a)' : 'var(--muted, #6b7280)' }}
                  >
                    {isMet ? '✓' : '•'}
                  </span>
                  <span style={{ color: isMet ? 'var(--text, #111827)' : 'inherit' }}>
                    {rule.label}
                  </span>
                </li>
              )
            })}
          </ul>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <Link
          to="/signin"
          className="primary-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            background: 'transparent',
            color: 'var(--accent)',
            border: '1.5px solid var(--line)',
            boxShadow: 'none',
            marginTop: '0.5rem'
          }}
        >
          Back to Sign In
        </Link>
      </form>
    </>
  )
}

/* ── Icon ── */

function MailCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" style={{ stroke: '#ff7a2f', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2 8 5 8-5" />
      <path d="M22 7l-5 5-2-2" />
    </svg>
  )
}
