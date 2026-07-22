import { useRef } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { Upload, Trash2, Camera } from 'lucide-react'

interface ProfileAvatarProps {
  avatarPreview?: string
  name: string
  onFileSelect: (file: File) => void
  onRemove: () => void
}

export default function ProfileAvatar({
  avatarPreview,
  name,
  onFileSelect,
  onRemove,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-lg)]">
      <div className="relative group">
        <div className="relative p-1 rounded-full bg-[var(--bg-primary)] ring-2 ring-[var(--border-primary)] shadow-sm overflow-hidden">
          <Avatar
            src={avatarPreview}
            name={name}
            className="w-24 h-24 sm:w-28 sm:h-28"
          />
        </div>
        
        {/* Hover Camera icon indicator */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center shadow-md hover:bg-[var(--color-primary-600)] transition-all cursor-pointer"
          aria-label="Upload profile image"
        >
          <Camera size={14} />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          iconLeft={<Upload size={14} />}
          className="text-xs font-semibold"
        >
          {avatarPreview ? 'Replace Image' : 'Upload Image'}
        </Button>
        {avatarPreview && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onRemove}
            iconLeft={<Trash2 size={14} />}
            className="text-xs font-semibold !bg-[var(--color-error-50)] !text-[var(--color-error-600)] !border-[var(--color-error-500)]/20 hover:!bg-[var(--color-error-500)]/10"
          >
            Remove
          </Button>
        )}
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)] font-medium text-center">
        Allowed formats: JPG, PNG, WEBP. Max 5MB.
      </p>
    </div>
  )
}
