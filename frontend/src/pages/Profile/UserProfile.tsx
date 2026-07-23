import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, MapPin, GraduationCap, 
  ShieldCheck, ShoppingBag, Search, Ticket, CalendarDays,
  UserCheck, UserPlus, Bell, BellOff 
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { profileService } from '@/services/profileService'
import { useAuth, isFollowingUser, isNotifyOnPostEnabled } from '@/contexts/AuthContext'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProductGrid from '@/components/product/ProductGrid'
import FollowersModal from '@/components/profile/FollowersModal'

function memberSince(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getEmailPrefix(email?: string) {
  if (!email) return null
  return email.split('@')[0]
}

export default function UserProfile() {
  const { id: targetUserId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, refreshUser } = useAuth()

  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('All')

  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers')

  const isSelf = Boolean(currentUser && targetUserId && currentUser._id === targetUserId)
  const isFollowing = isFollowingUser(currentUser, targetUserId)
  const notifyEnabled = isNotifyOnPostEnabled(currentUser, targetUserId)

  useEffect(() => {
    if (isSelf) {
      navigate('/profile', { replace: true })
      return
    }

    if (!targetUserId) return

    let cancelled = false
    const fetchTargetUser = async () => {
      setLoading(true)
      try {
        const data = await profileService.getPublicProfile(targetUserId)
        if (!cancelled) {
          setUser(data.user)
          setListings(data.listings)
          setStats(data.stats)
          setFollowersCount(data.stats?.followersCount || (data.user.followers || []).length || 0)
          setFollowingCount(data.stats?.followingCount || (data.user.following || []).length || 0)
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err.message || 'Failed to load user profile')
          navigate('/home')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTargetUser()
    return () => { cancelled = true }
  }, [targetUserId, isSelf, navigate])

  const handleToggleFollow = async () => {
    if (!targetUserId || followLoading) return
    setFollowLoading(true)
    try {
      const res = await profileService.toggleFollowUser(targetUserId, true)
      await refreshUser()
      setFollowersCount(res.followersCount)
      toast.success(res.isFollowing ? `Following ${user.name}!` : `Unfollowed ${user.name}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleToggleBell = async () => {
    if (!targetUserId || followLoading) return
    setFollowLoading(true)
    try {
      const nextNotify = !notifyEnabled
      await profileService.toggleFollowNotifications(targetUserId, nextNotify)
      await refreshUser()
      toast.success(nextNotify ? 'Post notifications enabled 🔔' : 'Post notifications muted 🔕')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update notification settings')
    } finally {
      setFollowLoading(false)
    }
  }

  const emailPrefix = user ? getEmailPrefix(user.email) : null

  const filteredListings = listings.filter((item) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Buy & Sell') return item.type === 'sell' || item.category === 'Buy & Sell'
    if (activeTab === 'Lost & Found') return item.type === 'found' || item.category === 'Lost & Found'
    if (activeTab === 'Event Passes') return item.type === 'pass' || item.category === 'Event Passes'
    if (activeTab === 'Travelling Tickets') return item.type === 'ticket' || item.category === 'Travelling Tickets'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-tertiary)]">Loading user profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const tabs = [
    { id: 'All', label: `All Active (${listings.length})`, icon: ShoppingBag },
    { id: 'Buy & Sell', label: `Buy & Sell (${stats?.sellCount || 0})`, icon: ShoppingBag },
    { id: 'Lost & Found', label: `Lost & Found (${stats?.foundCount || 0})`, icon: Search },
    { id: 'Event Passes', label: `Passes (${stats?.passCount || 0})`, icon: CalendarDays },
    { id: 'Travelling Tickets', label: `Tickets (${stats?.ticketCount || 0})`, icon: Ticket },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">User Profile</h1>
      </div>

      {/* User Header Profile Card */}
      <div className="bg-[var(--surface-card)] rounded-[var(--radius-xl)] border border-[var(--border-secondary)] overflow-hidden shadow-[var(--shadow-card)]">
        {/* Cover Accent */}
        <div className="h-28 bg-gradient-to-r from-[var(--color-primary-500)] via-[var(--color-primary-600)] to-[var(--color-primary-700)] relative" />

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="ring-4 ring-[var(--surface-card)] rounded-full bg-[var(--surface-card)]">
                <Avatar src={user.avatar} name={user.name} size="xl" />
              </div>

              <div className="mb-1 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    {user.name}
                  </h2>
                  <span title="Verified User">
                    <ShieldCheck className="w-5 h-5 text-[var(--color-primary-500)] shrink-0" />
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-tertiary)] font-medium">
                  {user.username && (
                    <span className="text-[var(--color-primary-500)] font-semibold">
                      @{user.username}
                    </span>
                  )}
                  {user.username && emailPrefix && <span>•</span>}
                  {emailPrefix && (
                    <span className="font-mono bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-md text-[var(--text-secondary)]">
                      {emailPrefix}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Follow & Notification Bell Action Buttons */}
            {!isSelf && (
              <div className="flex items-center gap-2 mb-1">
                {isFollowing && (
                  <button
                    type="button"
                    onClick={handleToggleBell}
                    disabled={followLoading}
                    title={notifyEnabled ? 'Post notifications ON (Click to Mute)' : 'Post notifications OFF (Click to Notify)'}
                    className={clsx(
                      'h-9 px-3.5 rounded-[var(--radius-md)] border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md',
                      notifyEnabled
                        ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                        : 'bg-[var(--surface-card)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
                    )}
                  >
                    {notifyEnabled ? <Bell size={15} className="fill-current" /> : <BellOff size={15} />}
                    <span>{notifyEnabled ? 'Notifying' : 'Muted'}</span>
                  </button>
                )}

                <Button
                  variant={isFollowing ? 'secondary' : 'primary'}
                  onClick={handleToggleFollow}
                  loading={followLoading}
                  iconLeft={isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  className="h-9 px-4 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            )}
          </div>

          {/* User Details / Meta + Connections stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-secondary)] border-t border-[var(--border-secondary)] pt-4 mt-2">
            <div className="flex flex-wrap items-center gap-4">
              {user.college && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-[var(--color-primary-500)]" />
                  {user.college}
                </span>
              )}
              {(user.city || user.state || user.country) && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[var(--color-primary-500)]" />
                  {[user.city, user.state, user.country].filter(Boolean).join(', ')}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--color-primary-500)]" />
                Member since {memberSince(user.createdAt)}
              </span>
            </div>

            {/* Followers & Following Counts */}
            <div className="flex items-center gap-3 font-semibold text-xs">
              <button
                type="button"
                onClick={() => { setModalTab('followers'); setIsModalOpen(true) }}
                className="hover:text-[var(--color-primary-500)] transition-colors cursor-pointer bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border-secondary)]"
              >
                <span className="text-[var(--text-primary)] font-bold mr-1">{followersCount}</span> Followers
              </button>

              <button
                type="button"
                onClick={() => { setModalTab('following'); setIsModalOpen(true) }}
                className="hover:text-[var(--color-primary-500)] transition-colors cursor-pointer bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border-secondary)]"
              >
                <span className="text-[var(--text-primary)] font-bold mr-1">{followingCount}</span> Following
              </button>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 bg-[var(--bg-tertiary)]/50 p-3 rounded-[var(--radius-md)] border border-[var(--border-secondary)]">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* User Active Listings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-3">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Active Listings by {user.name}
          </h3>
          <Badge variant="primary" size="sm">
            {listings.length} Active Item{listings.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--border-secondary)] pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={clsx(
                'px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all cursor-pointer',
                activeTab === t.id
                  ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <ProductGrid
          items={filteredListings}
          type="sell"
          tabLabel={activeTab}
          loading={false}
          emptyTitle={`No active ${activeTab !== 'All' ? activeTab : ''} listings`}
          emptyDescription={`${user.name} does not have any active listings under this section currently.`}
        />
      </div>

      {/* Followers & Following Connections Modal */}
      <FollowersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user._id}
        userName={user.name}
        initialTab={modalTab}
      />
    </div>
  )
}
