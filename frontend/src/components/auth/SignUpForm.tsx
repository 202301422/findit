import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import BrandLogo from '@/components/BrandLogo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'

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

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
    { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
    { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
    { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
    { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
  ]

  const unmetPasswordRequirements = passwordRequirements.filter((rule) => !rule.test(password))

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) newErrors.fullName = 'Name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[0-9]{9}@dau\.ac\.in$/.test(email))
      newErrors.email = 'Must be a valid DAU student email (e.g. 123456789@dau.ac.in)'
    if (!phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, '')))
      newErrors.phone = 'Invalid phone number'
    if (unmetPasswordRequirements.length > 0) {
      newErrors.password = 'Password does not meet all requirements'
    }
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
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center">
        <BrandLogo variant="full" className="mb-4" showTagline />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Create Account
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Join Findit and start buying &amp; selling
        </p>
      </div>

      <div className="social-row flex justify-center">
        <Button
          type="button"
          variant="secondary"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          fullWidth
          iconLeft={<GoogleIcon />}
          className="h-11 shadow-sm hover:shadow-md transition-shadow font-semibold"
        >
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </Button>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-[var(--border-primary)]"></div>
        <span className="flex-shrink mx-4 text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
          or email
        </span>
        <div className="flex-grow border-t border-[var(--border-primary)]"></div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
          disabled={loading || googleLoading}
          iconLeft={<User size={16} />}
          error={errors.fullName}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@dau.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading || googleLoading}
          iconLeft={<Mail size={16} />}
          error={errors.email}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="+91 99999 99999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
          disabled={loading || googleLoading}
          iconLeft={<Phone size={16} />}
          error={errors.phone}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={loading || googleLoading}
          iconLeft={<Lock size={16} />}
          error={errors.password}
          iconRight={
            <button
              type="button"
              className="focus:outline-none text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              onClick={() => setShowPassword((c) => !c)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <ul className="grid grid-cols-1 gap-1 text-xs text-[var(--text-secondary)] mt-1.5 px-1 bg-[var(--bg-secondary)] p-3 rounded-[var(--radius-md)] border border-[var(--border-secondary)]">
          {passwordRequirements.map((rule) => {
            const isMet = rule.test(password)
            return (
              <li key={rule.label} className="flex items-center gap-2">
                <span className={isMet ? 'text-[var(--color-success-500)]' : 'text-[var(--text-tertiary)]'}>
                  {isMet ? '✓' : '•'}
                </span>
                <span className={isMet ? 'text-[var(--text-primary)] line-through opacity-60' : ''}>
                  {rule.label}
                </span>
              </li>
            )
          })}
        </ul>

        <Input
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={loading || googleLoading}
          iconLeft={<Lock size={16} />}
          error={errors.confirmPassword}
          iconRight={
            <button
              type="button"
              className="focus:outline-none text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              onClick={() => setShowConfirm((c) => !c)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-3">
          By signing up you agree to our{' '}
          <Link to="#" className="font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="#" className="font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors">
            Privacy Policy
          </Link>
          .
        </p>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || googleLoading}
          fullWidth
          className="h-11"
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
        Already have an account?{' '}
        <Link
          to="/signin"
          className="font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-1" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.1-.9 2.6-2.2 3.7l3.3 2.5c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M6.6 14.1l-.7.5-2.4 1.8C5 19.4 8.2 21 12 21c2.6 0 4.8-.9 6.4-2.4l-3.3-2.5c-.9.6-2 .9-3.1.9-2.3 0-4.3-1.6-5-3.9z" />
      <path fill="#FBBC05" d="M3.5 7.7A9 9 0 0 0 3 12c0 .8.1 1.5.3 2.2l3.1-2.4c-.1-.5-.2-1.1-.2-1.7s.1-1.2.2-1.7L3.5 7.7z" />
      <path fill="#4285F4" d="M12 4.8c1.5 0 2.8.5 3.8 1.4l2.8-2.8A9.8 9.8 0 0 0 12 1C8.2 1 5 2.6 3.5 5.7l3.1 2.4C7.7 6.2 9.7 4.8 12 4.8z" />
    </svg>
  )
}
