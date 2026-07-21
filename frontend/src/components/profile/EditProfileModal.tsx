import { useState, useEffect } from 'react'
import type { ProfileData, UpdateProfileData } from '../../types/profile.types'
import ProfileAvatar from './ProfileAvatar'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface EditProfileModalProps {
  profile: ProfileData
  isOpen: boolean
  onClose: () => void
  onSave: (data: UpdateProfileData) => Promise<boolean>
  loading: boolean
}

export default function EditProfileModal({
  profile,
  isOpen,
  onClose,
  onSave,
  loading,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: profile?.name || '',
    username: profile?.username || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    college: profile?.college || '',
    city: profile?.city || '',
    state: profile?.state || '',
    country: profile?.country || '',
  })

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        college: profile.college || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
      })
    }
  }, [profile, isOpen])

  const handleChange = (name: keyof UpdateProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onSave(formData)
    if (success) {
      onClose()
    }
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Edit Profile"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Area */}
        <ProfileAvatar avatar={profile?.avatar} name={profile?.name || ''} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            name="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            minLength={2}
            maxLength={50}
          />
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            minLength={3}
            maxLength={30}
            pattern="^[a-zA-Z0-9_]*$"
            title="Only letters, numbers and underscores allowed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address (Read Only)"
            value={profile?.email || ''}
            disabled
            className="!bg-[var(--bg-secondary)] !text-[var(--text-tertiary)] opacity-60"
          />
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] resize-y min-h-[80px]"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="border-t border-[var(--border-primary)] pt-3 space-y-3">
          <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
            Location & Education
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="College"
              name="college"
              value={formData.college}
              onChange={(e) => handleChange('college', e.target.value)}
              maxLength={100}
            />
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              maxLength={100}
            />
            <Input
              label="Country"
              name="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
