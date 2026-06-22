import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

interface SignUpFormProps {
  onSignUp?: (data: {
    fullName: string
    email: string
    phone: string
    password: string
  }) => void
}

export default function SignUpForm({ onSignUp }: SignUpFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { signup, googleLogin } = useAuth()

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) newErrors.fullName = 'Name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[0-9]{9}@dau\.ac\.in$/.test(email))
      newErrors.email = 'Must be a valid DAU student email (e.g. 123456789@dau.ac.in)'
    if (!phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, '')))
      newErrors.phone = 'Invalid phone number'
    if (password.length < 8) newErrors.password = 'At least 8 characters'
    else if (!/[A-Z]/.test(password)) newErrors.password = 'Needs uppercase letter'
    else if (!/[a-z]/.test(password)) newErrors.password = 'Needs lowercase letter'
    else if (!/[0-9]/.test(password)) newErrors.password = 'Needs a number'
    else if (!/[^A-Za-z0-9]/.test(password))
      newErrors.password = 'Needs a special character'
    if (confirmPassword !== password)
      newErrors.confirmPassword = 'Passwords must match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    if (onSignUp) {
      onSignUp({ fullName, email, phone, password })
    }
    
    setLoading(true)
    try {
      await signup({ name: fullName, email, phone, password })
      toast.success('OTP sent to your email!')
      navigate('/verify-email', { state: { email } })
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up')
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

      <h1>Create Account</h1>
      <p className="subtitle">Join Findit and start buying &amp; selling</p>

      <div className="social-row social-row--duo">
        <button 
          type="button" 
          className="social-btn google"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Loading...' : 'Google'}</span>
        </button>
        <button type="button" className="social-btn facebook">
          <FacebookIcon />
          <span>Facebook</span>
        </button>
      </div>

      <div className="divider" aria-hidden="true">
        <span />
        <p>or sign up with email</p>
        <span />
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Full Name */}
        <label>
          Full Name
          <div className="field-shell">
            <UserIcon />
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
              disabled={loading || googleLoading}
            />
          </div>
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </label>

        {/* Email */}
        <label>
          Email Address
          <div className="field-shell">
            <MailIcon />
            <input
              type="email"
              placeholder="you@dau.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading || googleLoading}
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>

        {/* Phone */}
        <label>
          Phone Number
          <div className="field-shell">
            <PhoneIcon />
            <input
              type="tel"
              placeholder="+1 555 123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
              disabled={loading || googleLoading}
            />
          </div>
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>

        {/* Password */}
        <label>
          Password
          <div className="field-shell password-shell">
            <LockIcon />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowPassword((c) => !c)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        {/* Confirm Password */}
        <label>
          Confirm Password
          <div className="field-shell password-shell">
            <LockIcon />
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowConfirm((c) => !c)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword}</span>
          )}
        </label>

        {/* Terms */}
        <p className="terms-copy">
          By signing up you agree to our{' '}
          <Link to="#" className="text-link inline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="#" className="text-link inline">
            Privacy Policy
          </Link>
          .
        </p>

        <button type="submit" className="primary-btn" disabled={loading || googleLoading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="footer-copy">
          Already have an account?{' '}
          <Link to="/signin" className="text-link inline">
            Sign In
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

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.022 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.026 1.791-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97H15.83c-1.491 0-1.955.93-1.955 1.885v2.264h3.328l-.532 3.49h-2.796v8.437C19.612 23.095 24 18.1 24 12.073z"
      />
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
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
