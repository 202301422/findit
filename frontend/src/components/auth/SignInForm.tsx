import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import BrandLogo from '@/components/BrandLogo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

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
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center">
        <BrandLogo variant="full" className="mb-4" showTagline />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Welcome back!
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Sign in to your Findit account
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
          label="Email Address"
          type="email"
          placeholder="you@dau.ac.in"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          disabled={loading || googleLoading}
          iconLeft={<Mail size={16} />}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          disabled={loading || googleLoading}
          iconLeft={<Lock size={16} />}
          iconRight={
            <button
              type="button"
              className="focus:outline-none text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || googleLoading}
          fullWidth
          className="h-11"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
        >
          Sign Up
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
