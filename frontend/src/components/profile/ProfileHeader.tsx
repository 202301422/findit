import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { ShieldCheck, Calendar } from 'lucide-react'
import FollowersModal from '@/components/profile/FollowersModal'

export default function ProfileHeader({
  profile,
}: {
  profile: any
}) {
  const memberYear = new Date(profile?.createdAt || Date.now()).getFullYear()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers')

  const followersCount = (profile?.followers || []).length
  const followingCount = (profile?.following || []).length

  return (
    <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] overflow-hidden shadow-[var(--shadow-card)] relative">
      {/* Cover Banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-700)] relative" />

      {/* Header Info area */}
      <div className="px-4 sm:px-6 pb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-5">
            {/* Avatar frame */}
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

          {/* Connections / Followers & Following counts */}
          <div className="flex items-center gap-3 text-xs font-semibold self-start sm:self-end mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => { setModalTab('followers'); setIsModalOpen(true) }}
              className="hover:text-[var(--color-primary-500)] transition-colors cursor-pointer bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-secondary)] shadow-xs"
            >
              <span className="text-[var(--text-primary)] font-bold mr-1">{followersCount}</span> Followers
            </button>

            <button
              type="button"
              onClick={() => { setModalTab('following'); setIsModalOpen(true) }}
              className="hover:text-[var(--color-primary-500)] transition-colors cursor-pointer bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-secondary)] shadow-xs"
            >
              <span className="text-[var(--text-primary)] font-bold mr-1">{followingCount}</span> Following
            </button>
          </div>
        </div>
      </div>

      {/* Followers & Following Connections Modal */}
      {profile && (
        <FollowersModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={profile._id}
          userName={profile.name}
          initialTab={modalTab}
        />
      )}
    </div>
  )
}
