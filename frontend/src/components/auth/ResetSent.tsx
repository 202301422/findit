import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import BrandLogo from '@/components/BrandLogo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { KeyRound, ArrowLeft } from 'lucide-react'

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
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center">
        <BrandLogo variant="icon" className="mb-4" />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Reset Password
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xs">
          We&apos;ve sent a password reset code to <span className="font-semibold text-[var(--text-primary)]">{email || 'your email'}</span>.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Reset Code"
          type="text"
          placeholder="Enter 6-character code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
          required
          disabled={loading}
          maxLength={6}
          iconLeft={<KeyRound size={16} />}
        />
        
        <div className="space-y-1.5">
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
            error={errors.password}
          />
          
          <ul className="grid grid-cols-1 gap-1 text-xs text-[var(--text-secondary)] mt-1.5 px-1 bg-[var(--bg-secondary)] p-3 rounded-[var(--radius-md)] border border-[var(--border-secondary)]">
            {passwordRequirements.map((rule) => {
              const isMet = rule.test(newPassword)
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
        </div>

        <Button type="submit" variant="primary" loading={loading} fullWidth className="h-11 mt-2">
          Reset Password
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
