import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Edit2, ShieldCheck, Calendar } from 'lucide-react'

export default function ProfileHeader({
  profile,
  onEdit,
}: {
  profile: any
  onEdit: () => void
}) {
  const memberYear = new Date(profile?.createdAt || Date.now()).getFullYear()

  return (
    <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] overflow-hidden shadow-[var(--shadow-card)]">
      {/* Cover Banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-700)] relative" />

      {/* Header Info area */}
      <div className="px-4 sm:px-6 pb-6 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-14">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-5">
          {/* Avatar frame */}
          <div className="relative p-1 rounded-full bg-[var(--bg-primary)] ring-4 ring-[var(--surface-card)] shrink-0 shadow-md">
            <Avatar
              src={profile?.avatar}
              name={profile?.name || 'User'}
              className="w-20 h-20 sm:w-28 sm:h-28"
            />
          </div>

          <div className="space-y-1.5 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                {profile?.name}
              </h2>
              {profile?.isVerified && (
                <span title="Verified email">
                  <ShieldCheck className="w-5 h-5 text-[var(--color-primary-500)] shrink-0" />
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              @{profile?.username || 'user'} &bull; {profile?.email}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile?.isVerified && (
                <Badge variant="success" size="sm" dot>
                  Verified Email
                </Badge>
              )}
              <Badge variant="default" size="sm" className="flex items-center gap-1">
                <Calendar size={10} />
                Joined {memberYear}
              </Badge>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          iconLeft={<Edit2 size={13} />}
          className="sm:mb-1 w-full sm:w-auto font-semibold"
        >
          Edit Profile
        </Button>
      </div>
    </div>
  )
}
