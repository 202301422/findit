import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import BrandLogo from '../BrandLogo'

interface ForgotPasswordFormProps {
  onForgotPassword?: (data: { email: string }) => void
}

export default function ForgotPasswordForm({ onForgotPassword }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (onForgotPassword) {
      onForgotPassword({ email })
    }
    
    setLoading(true)
    try {
      await forgotPassword({ email })
      toast.success('Password reset email sent!')
      navigate('/reset-sent', { state: { email } })
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <BrandLogo to="/" variant="icon" className="auth-shell__brand" />

      <h1>Forgot Password?</h1>
      <p className="subtitle">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email Address
          <div className="field-shell">
            <MailFieldIcon />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </label>

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="footer-copy">
          <Link to="/signin" className="text-link inline">
            ← Back to Sign In
          </Link>
        </p>
      </form>
    </>
  )
}

function MailFieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2 8 5 8-5" />
    </svg>
  )
}
