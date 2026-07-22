import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { ShieldCheck, Calendar } from 'lucide-react'

export default function ProfileHeader({
  profile,
}: {
  profile: any
}) {
  const memberYear = new Date(profile?.createdAt || Date.now()).getFullYear()

  return (
    <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] overflow-hidden shadow-[var(--shadow-card)] relative">
      {/* Cover Banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-700)] relative" />

      {/* Header Info area */}
      <div className="px-4 sm:px-6 pb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-5">
          {/* Avatar frame - only avatar overlaps banner */}
          <div className="relative p-1 rounded-full bg-[var(--bg-primary)] ring-4 ring-[var(--surface-card)] shrink-0 shadow-md -mt-10 sm:-mt-14">
            <Avatar
              src={profile?.avatar}
              name={profile?.name || 'User'}
              className="w-20 h-20 sm:w-28 sm:h-28"
            />
          </div>

          {/* User info details */}
          <div className="space-y-1.5 pt-1 sm:pt-3 pb-1">
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
      </div>
    </div>
  )
}
