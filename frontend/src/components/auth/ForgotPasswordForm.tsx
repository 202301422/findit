import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import BrandLogo from '@/components/BrandLogo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Mail, ArrowLeft } from 'lucide-react'

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
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center">
        <BrandLogo variant="icon" className="mb-4" />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Forgot Password?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xs">
          Enter your student email and we&apos;ll send you a reset code.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          placeholder="you@dau.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading}
          iconLeft={<Mail size={16} />}
        />

        <Button type="submit" variant="primary" loading={loading} fullWidth className="h-11">
          Send Reset Link
        </Button>
      </form>

      <div className="text-center">
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
