import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useProfile } from '@/hooks/useProfile'
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

const CATEGORIES: ListingCategory[] = ['Lost & Found', 'Event Passes', 'Travelling Tickets', 'Buy & Sell']

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ListingCategory>('Lost & Found')
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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
    loadingUpdate,
    fetchProfile, 
    fetchListings, 
    fetchStats,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
  } = useProfile()

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [fetchProfile, fetchStats])

  useEffect(() => {
    let apiCategory = ''
    if (activeTab === 'Lost & Found') apiCategory = 'lost-found'
    if (activeTab === 'Event Passes') apiCategory = 'event-passes'
    if (activeTab === 'Buy & Sell') apiCategory = 'buy-sell'
    if (activeTab === 'Travelling Tickets') apiCategory = 'travelling-tickets'
    
    fetchListings(apiCategory)
  }, [activeTab, fetchListings])

  // Filter listings by the active category tab
  const filteredListings = listings.filter(listing => listing.category === activeTab)

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
                <div key={idx} className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] overflow-hidden h-60 animate-shimmer" />
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🔍"
              title={`No ${activeTab} listings`}
              description="You have not posted any listings under this tab yet."
              action={
                <Button variant="primary" onClick={() => navigate('/add-item')}>
                  Post an Item
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
