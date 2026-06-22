import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

interface SignInFormProps {
  onSignIn?: (data: { email: string; password: string }) => void
}

export default function SignInForm({ onSignIn }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { login, googleLogin } = useAuth()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (onSignIn) {
      onSignIn({ email, password })
    }
    
    setLoading(true)
    try {
      await login({ email, password })
      toast.success('Successfully logged in!')
      navigate('/home')
    } catch (error: any) {
      toast.error(error.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    try {
      await googleLogin()
      toast.success('Successfully logged in with Google!')
      navigate('/home')
    } catch (error: any) {
      toast.error(error.message || 'Google login failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <button
        className="brand-mark"
        type="button"
        onClick={() => navigate('/')}
        aria-label="Findit home"
      >
        Findit
      </button>

      <h1>Welcome back!</h1>
      <p className="subtitle">Sign in to your Findit account</p>

      <div className="social-row">
        <button
          type="button"
          className="social-btn google"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Loading...' : 'Google'}</span>
        </button>
      </div>

      <div className="divider" aria-hidden="true">
        <span />
        <p>or continue with email</p>
        <span />
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email Address
          <div className="field-shell">
            <MailIcon />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading || googleLoading}
            />
          </div>
        </label>

        <label>
          Password
          <div className="field-shell password-shell">
            <LockIcon />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </label>

        <Link to="/forgot-password" className="text-link align-right">
          Forgot password?
        </Link>

        <button type="submit" className="primary-btn" disabled={loading || googleLoading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="footer-copy">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-link inline">
            Sign Up
          </Link>
        </p>
      </form>
    </>
  )
}

/* ── Icons ── */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.1-.9 2.6-2.2 3.7l3.3 2.5c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M6.6 14.1l-.7.5-2.4 1.8C5 19.4 8.2 21 12 21c2.6 0 4.8-.9 6.4-2.4l-3.3-2.5c-.9.6-2 .9-3.1.9-2.3 0-4.3-1.6-5-3.9z" />
      <path fill="#FBBC05" d="M3.5 7.7A9 9 0 0 0 3 12c0 .8.1 1.5.3 2.2l3.1-2.4c-.1-.5-.2-1.1-.2-1.7s.1-1.2.2-1.7L3.5 7.7z" />
      <path fill="#4285F4" d="M12 4.8c1.5 0 2.8.5 3.8 1.4l2.8-2.8A9.8 9.8 0 0 0 12 1C8.2 1 5 2.6 3.5 5.7l3.1 2.4C7.7 6.2 9.7 4.8 12 4.8z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2 8 5 8-5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="4" y="10" width="16" height="10" rx="2" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.5-7 9-7c1.2 0 2.4.2 3.5.6" />
      <path d="M21 12s-3.5 7-9 7-9-7-9-7a17 17 0 0 1 3.2-4.2" />
      <path d="M10 14a3 3 0 0 1 4-4" />
      <path d="M4 4l16 16" />
    </svg>
  )
}
