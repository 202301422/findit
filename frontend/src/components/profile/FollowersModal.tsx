import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Search, UserCheck, UserPlus, UserX, Bell, BellOff, GraduationCap } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { profileService } from '@/services/profileService'
import { useAuth, isFollowingUser, isNotifyOnPostEnabled } from '@/contexts/AuthContext'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  initialTab?: 'followers' | 'following'
}

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  userName,
  initialTab = 'followers',
}: FollowersModalProps) {
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const { user: currentUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  const isViewingOwnProfile = Boolean(currentUser && userId && currentUser._id === userId)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab, isOpen])

  useEffect(() => {
    if (!isOpen || !userId) return
    let cancelled = false

    const loadUsers = async () => {
      setLoading(true)
      try {
        const list = tab === 'followers'
          ? await profileService.getUserFollowers(userId)
          : await profileService.getUserFollowing(userId)
        if (!cancelled) setUsers(list)
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || 'Failed to fetch user list')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUsers()
    return () => { cancelled = true }
  }, [isOpen, userId, tab])

  if (!isOpen) return null

  const handleRemoveFollower = async (targetId: string, targetName: string) => {
    if (actionLoadingId) return
    setActionLoadingId(targetId)
    try {
      await profileService.removeFollower(targetId)
      await refreshUser()
      setUsers((prev: any[]) => prev.filter((u: any) => u._id !== targetId))
      toast.success(`Removed ${targetName} from your followers`)
    } catch {
      toast.error('Failed to remove follower')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleFollow = async (targetId: string, currentIsFollowing: boolean) => {
    if (actionLoadingId) return
    setActionLoadingId(targetId)
    try {
      await profileService.toggleFollowUser(targetId, true)
      await refreshUser()

      // Local state update
      setUsers((prev: any[]) =>
        prev.map((u: any) => {
          if (u._id === targetId) {
            return { ...u, isFollowing: !currentIsFollowing }
          }
          return u
        })
      )
      toast.success(currentIsFollowing ? 'Unfollowed user' : 'Following user')
    } catch {
      toast.error('Failed to update follow status')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleBell = async (targetId: string, currentNotify: boolean) => {
    if (actionLoadingId) return
    setActionLoadingId(targetId)
    try {
      const nextNotify = !currentNotify
      await profileService.toggleFollowNotifications(targetId, nextNotify)
      await refreshUser()

      setUsers((prev: any[]) =>
        prev.map((u: any) => {
          if (u._id === targetId) {
            return { ...u, notifyOnPost: nextNotify }
          }
          return u
        })
      )
      toast.success(nextNotify ? 'Notifications enabled for user posts 🔔' : 'Notifications muted for user posts 🔕')
    } catch {
      toast.error('Failed to update notification settings')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filtered = users.filter((u: any) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--border-secondary)] flex items-center justify-between bg-[var(--surface-elevated)]">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            {userName}&apos;s Connections
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-secondary)]">
          <button
            type="button"
            onClick={() => setTab('followers')}
            className={clsx(
              'py-2 text-xs font-bold rounded-[var(--radius-md)] transition-all cursor-pointer text-center',
              tab === 'followers'
                ? 'bg-[var(--surface-card)] text-[var(--color-primary-500)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            Followers ({users.length && tab === 'followers' ? users.length : ''})
          </button>
          <button
            type="button"
            onClick={() => setTab('following')}
            className={clsx(
              'py-2 text-xs font-bold rounded-[var(--radius-md)] transition-all cursor-pointer text-center',
              tab === 'following'
                ? 'bg-[var(--surface-card)] text-[var(--color-primary-500)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            Following ({users.length && tab === 'following' ? users.length : ''})
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[var(--border-secondary)]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter users..."
              className="w-full h-8 pl-9 pr-3 rounded-[var(--radius-md)] text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-secondary)] focus:outline-none focus:border-[var(--color-primary-500)]/60"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-secondary)] p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2 text-xs text-[var(--text-tertiary)]">
              <div className="w-5 h-5 border-2 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
              <span>Loading users...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
              No users found.
            </div>
          ) : (
            filtered.map((u: any) => {
              const isSelf = currentUser?._id === u._id
              const followingTarget = isFollowingUser(currentUser, u._id)
              const notifyEnabled = isNotifyOnPostEnabled(currentUser, u._id)

              return (
                <div key={u._id} className="flex items-center justify-between gap-3 p-2.5 hover:bg-[var(--bg-tertiary)]/50 rounded-[var(--radius-md)] transition-colors">
                  <div
                    onClick={() => {
                      onClose()
                      navigate(`/user/${u._id}`)
                    }}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  >
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate hover:text-[var(--color-primary-500)] transition-colors">
                        {u.name}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] truncate">
                        {u.username && <span className="text-[var(--color-primary-500)] font-medium">@{u.username}</span>}
                        {u.college && (
                          <span className="flex items-center gap-0.5 truncate">
                            • <GraduationCap size={10} /> {u.college}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for other users */}
                  {!isSelf && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isViewingOwnProfile && tab === 'followers' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRemoveFollower(u._id, u.name)}
                          loading={actionLoadingId === u._id}
                          className="!h-7 !px-2.5 !text-[11px] hover:!bg-red-500/15 hover:!text-red-500 hover:!border-red-500/30"
                          iconLeft={<UserX size={12} />}
                        >
                          Remove
                        </Button>
                      )}

                      {followingTarget && (
                        <button
                          type="button"
                          onClick={() => handleToggleBell(u._id, notifyEnabled)}
                          disabled={actionLoadingId === u._id}
                          title={notifyEnabled ? 'Notifications ON for new posts (Click to Mute)' : 'Notifications OFF (Click to Enable)'}
                          className={clsx(
                            'p-1.5 rounded-full border transition-all cursor-pointer shadow-xs',
                            notifyEnabled
                              ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                              : 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
                          )}
                        >
                          {notifyEnabled ? <Bell size={13} className="fill-current" /> : <BellOff size={13} />}
                        </button>
                      )}

                      <Button
                        size="sm"
                        variant={followingTarget ? 'secondary' : 'primary'}
                        onClick={() => handleToggleFollow(u._id, followingTarget)}
                        loading={actionLoadingId === u._id}
                        className="!h-7 !px-2.5 !text-[11px]"
                        iconLeft={followingTarget ? <UserCheck size={12} /> : <UserPlus size={12} />}
                      >
                        {followingTarget ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
