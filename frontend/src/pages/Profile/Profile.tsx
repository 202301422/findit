import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import type { ListingCategory } from '../../types/profile.types';

import '../../styles/variables.css';
import '../../styles/sidebar.css';
import '../../styles/topbar.css';
import './Profile.css';

import Sidebar from '../../components/Sidebar/Sidebar';
import Topbar from '../../components/Topbar/Topbar';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileInfo from '../../components/profile/ProfileInfo';
import ProfileStats from '../../components/profile/ProfileStats';
import ListingTabs from '../../components/profile/ListingTabs';
import ListingCard from '../../components/profile/ListingCard';
import EditProfileModal from '../../components/profile/EditProfileModal';
import ChangePasswordModal from '../../components/profile/ChangePasswordModal';
import DeleteAccountModal from '../../components/profile/DeleteAccountModal';

const CATEGORIES: ListingCategory[] = ['Buy & Sell', 'Lost & Found', 'Event Passes', 'Travelling Tickets'];

export default function Profile() {
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ListingCategory>('Lost & Found');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();
  
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
    updateProfile
  } = useProfile();

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [fetchProfile, fetchStats]);

  useEffect(() => {
    let apiCategory = '';
    if (activeTab === 'Lost & Found') apiCategory = 'lost-found';
    if (activeTab === 'Event Passes') apiCategory = 'event-passes';
    // 'Buy & Sell' and 'Travelling Tickets' are not implemented in the backend yet.
    
    fetchListings(apiCategory);
  }, [activeTab, fetchListings]);

  function handleNav(_section: string) {
    // TODO: implement navigation to different sections if needed
  }

  function handleAddItem() {
    navigate('/add-item');
  }

  function handleNotif() {
    // TODO: navigate to notifications page when implemented
    navigate('/notifications');
  }

  function handleProfileClick() {
    // Already on profile page
  }

  function handleHelp() {
    // TODO: navigate to help/FAQ page when implemented
    navigate('/help');
  }

  async function handleLogout() {
    await logout();
    navigate('/signin');
  }

  // Filter listings by the active tab
  const filteredListings = listings.filter(listing => listing.category === activeTab);

  if (loadingProfile && !profile) {
    return (
      <div className="site-root">
        <Sidebar open={open} setOpen={setOpen} selected="Profile" handleNav={handleNav} handleHelp={handleHelp} handleLogout={handleLogout} />
        <div className="main">
          <Topbar catsOpen={catsOpen} setCatsOpen={setCatsOpen} handleAddItem={handleAddItem} handleNotif={handleNotif} handleProfile={handleProfileClick} />
          <main className="content profile-page">
            <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>Loading profile...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="site-root">
      <Sidebar
        open={open}
        setOpen={setOpen}
        selected="Profile"
        handleNav={handleNav}
        handleHelp={handleHelp}
        handleLogout={handleLogout}
      />

      <div className="main">
        <Topbar
          catsOpen={catsOpen}
          setCatsOpen={setCatsOpen}
          handleAddItem={handleAddItem}
          handleNotif={handleNotif}
          handleProfile={handleProfileClick}
        />

        <main className="content profile-page">
          <ProfileHeader profile={profile} onEdit={() => setIsEditModalOpen(true)} />
          
          <ProfileStats stats={stats} />

          <div className="profile-main-grid">
            <div className="profile-listings">
              <ListingTabs 
                categories={CATEGORIES} 
                activeCategory={activeTab} 
                onTabChange={setActiveTab} 
              />
              
              {loadingListings ? (
                <div className="empty-state">Loading listings...</div>
              ) : filteredListings.length > 0 ? (
                <div className="listing-grid">
                  {filteredListings.map(listing => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  No {activeTab} listings found.
                </div>
              )}
            </div>

            <div className="profile-sidebar-right">
              {profile && <ProfileInfo profile={profile} />}
              
              <div className="profile-settings" style={{ marginTop: '1.5rem' }}>
                <h3>Account Settings</h3>
                <div className="settings-list">
                  {profile?.authProvider === 'local' && (
                    <button className="settings-btn" onClick={() => setIsPasswordModalOpen(true)}>
                      Change Password
                    </button>
                  )}
                  <button className="settings-btn danger" onClick={() => setIsDeleteModalOpen(true)}>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {profile && (
        <EditProfileModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          profile={profile} 
          onSave={updateProfile}
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
  );
}
