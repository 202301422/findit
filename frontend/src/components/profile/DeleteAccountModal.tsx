import { useState } from 'react'
import { profileService } from '../../services/profileService'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  requiresPassword: boolean
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  requiresPassword,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      await profileService.deleteAccount(password)
      toast.success('Account deleted successfully')
      await logout()
      navigate('/signin')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account')
      setLoading(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Delete Account"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2.5 p-3 rounded-[var(--radius-md)] bg-[var(--color-error-50)] dark:bg-[var(--color-error-500)]/10 text-xs text-[var(--color-error-600)] dark:text-[var(--color-error-500)] border border-[var(--color-error-500)]/20">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>
            <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account,
            all your listings, passes, and personal data from our servers.
          </p>
        </div>

        {requiresPassword && (
          <Input
            label="Enter password to confirm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Your password"
          />
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
            disabled={loading}
          >
            Delete My Account
          </Button>
        </div>
      </form>
    </Modal>
  )
}
