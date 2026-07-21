import type { ProfileData } from '../../types/profile.types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { User, Phone, Mail, GraduationCap, MapPin, ShieldAlert } from 'lucide-react'

export default function ProfileInfo({ profile }: { profile: ProfileData }) {
  const address = [profile?.city, profile?.state, profile?.country]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-4">
      {/* Bio section */}
      <Card padding="md" className="space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border-secondary)] pb-2">
          <User size={15} className="text-[var(--text-tertiary)]" />
          About Me
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {profile?.bio || 'No bio added yet.'}
        </p>
      </Card>

      {/* Info List */}
      <Card padding="md" className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-secondary)] pb-2">
          Details
        </h3>
        
        <div className="space-y-3.5">
          <div className="flex items-start gap-2.5">
            <GraduationCap className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">College</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-0.5">{profile?.college || 'Not specified'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Location</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-0.5">{address || 'Not specified'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Phone Number</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-0.5">{profile?.phone || 'Not specified'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Email</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-0.5 truncate">{profile?.email}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Verification & Status</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <Badge variant={profile?.isVerified ? 'success' : 'warning'} size="sm" dot>
                  {profile?.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant={profile?.accountStatus === 'active' ? 'primary' : 'error'} size="sm">
                  {profile?.accountStatus || 'active'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
