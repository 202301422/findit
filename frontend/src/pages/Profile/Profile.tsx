import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useProfile } from '@/hooks/useProfile'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { ListingCategory } from '@/types/profile.types'

import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileInfo from '@/components/profile/ProfileInfo'
import ProfileStats from '@/components/profile/ProfileStats'
import ListingTabs from '@/components/profile/ListingTabs'
import ListingCard from '@/components/profile/ListingCard'
import EditProfileModal from '@/components/profile/EditProfileModal'
import ChangePasswordModal from '@/components/profile/ChangePasswordModal'
import DeleteAccountModal from '@/components/profile/DeleteAccountModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

const CATEGORIES: ListingCategory[] = ['Lost & Found', 'Event Passes', 'Travelling Tickets', 'Buy & Sell', 'Saved Posts']

function getApiCategory(tab: ListingCategory): string {
  if (tab === 'Lost & Found') return 'lost-found'
  if (tab === 'Event Passes') return 'event-passes'
  if (tab === 'Buy & Sell') return 'buy-sell'
  if (tab === 'Travelling Tickets') return 'travelling-tickets'
  if (tab === 'Saved Posts') return 'saved-posts'
  return ''
}

export default function Profile() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<ListingCategory>(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab')
    if (tabParam === 'saved' || tabParam === 'saved-posts') return 'Saved Posts'
    if (tabParam === 'buy-sell') return 'Buy & Sell'
    if (tabParam === 'event-passes') return 'Event Passes'
    if (tabParam === 'travelling-tickets') return 'Travelling Tickets'
    return 'Lost & Found'
  })

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'saved' || tabParam === 'saved-posts') {
      setActiveTab('Saved Posts')
    } else if (tabParam === 'buy-sell') {
      setActiveTab('Buy & Sell')
    } else if (tabParam === 'event-passes') {
      setActiveTab('Event Passes')
    } else if (tabParam === 'travelling-tickets') {
      setActiveTab('Travelling Tickets')
    } else if (tabParam === 'lost-found') {
      setActiveTab('Lost & Found')
    }
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('edit') === 'true' || searchParams.get('settings') === 'true') {
      setIsEditModalOpen(true)
      setSearchParams((params) => {
        const next = new URLSearchParams(params)
        next.delete('edit')
        next.delete('settings')
        return next
      }, { replace: true })
    }
  }, [searchParams, setSearchParams])
  
  const { 
    profile, 
    listings, 
    stats, 
    loadingProfile, 
    loadingListings,
    loadingMoreListings,
    loadingUpdate,
    hasMoreListings,
    fetchProfile, 
    fetchListings,
    fetchMoreListings,
    fetchStats,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
  } = useProfile()

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [fetchProfile, fetchStats])

  // Reset + fetch first page on tab change
  useEffect(() => {
    fetchListings(getApiCategory(activeTab))
  }, [activeTab, fetchListings])

  // Load more when sentinel is reached
  const handleLoadMore = useCallback(() => {
    fetchMoreListings(getApiCategory(activeTab))
  }, [activeTab, fetchMoreListings])

  const sentinelRef = useInfiniteScroll({
    hasMore: hasMoreListings,
    loading: loadingMoreListings,
    onLoadMore: handleLoadMore,
  })

  // Filter listings by the active category tab
  const filteredListings = activeTab === 'Saved Posts'
    ? listings
    : listings.filter(listing => listing.category === activeTab)

  if (loadingProfile && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-tertiary)]">Loading profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in py-2">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="p-1.5 rounded-full border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">My Profile</h1>
      </div>

      {profile && (
        <ProfileHeader
          profile={profile}
        />
      )}
      
      <ProfileStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Listings Section */}
        <div className="lg:col-span-8 space-y-4">
          <ListingTabs 
            categories={CATEGORIES} 
            activeCategory={activeTab} 
            onTabChange={setActiveTab} 
          />
          
          {loadingListings ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} />

              {/* Loading more skeletons */}
              {loadingMoreListings && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] overflow-hidden h-60 animate-shimmer" />
                  ))}
                </div>
              )}

              {/* All loaded indicator */}
              {!hasMoreListings && !loadingMoreListings && filteredListings.length > 0 && (
                <p className="text-center text-xs text-[var(--text-tertiary)] font-medium pt-2">
                  ✓ All listings loaded
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon={activeTab === 'Saved Posts' ? '🔖' : '🔍'}
              title={activeTab === 'Saved Posts' ? 'No saved posts yet' : `No ${activeTab} listings`}
              description={
                activeTab === 'Saved Posts'
                  ? 'Bookmark items while browsing to save them for later.'
                  : 'You have not posted any listings under this tab yet.'
              }
              action={
                <Button variant="primary" onClick={() => navigate(activeTab === 'Saved Posts' ? '/home' : '/add-item')}>
                  {activeTab === 'Saved Posts' ? 'Browse Marketplace' : 'Post an Item'}
                </Button>
              }
              className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] shadow-sm"
            />
          )}
        </div>

        {/* Sidebar Info Section */}
        <div className="lg:col-span-4 space-y-6">
          {profile && <ProfileInfo profile={profile} />}
          
          <Card padding="md" className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-secondary)] pb-2">
              Account Settings
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-semibold"
              >
                Edit Profile Details
              </Button>
              {profile?.authProvider === 'local' && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  Change Password
                </Button>
              )}
              <Button
                type="button"
                variant="danger"
                fullWidth
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs font-semibold !bg-[var(--color-error-50)] !text-[var(--color-error-600)] !border-[var(--color-error-500)]/20 hover:!bg-[var(--color-error-500)]/10"
              >
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {profile && (
        <EditProfileModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          profile={profile} 
          onSave={updateProfile}
          uploadAvatar={uploadAvatar}
          deleteAvatar={deleteAvatar}
          loading={loadingUpdate}
        />
      )}

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        requiresPassword={profile?.authProvider === 'local'}
      />
    </div>
  )
}
