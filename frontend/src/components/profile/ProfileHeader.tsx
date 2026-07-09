export default function ProfileHeader({ profile, onEdit }: { profile: any, onEdit: () => void }) {
  return (
    <div className="profile-header">
      <div className="profile-header-content">
        <div className="profile-header-info">
          <div className="profile-header-avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              <div className="avatar-placeholder">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-header-details">
            <h2>{profile?.name}</h2>
            <p className="username">@{profile?.username || 'user'}</p>
            <p className="email">{profile?.email}</p>
            <div className="badges">
               {profile?.isVerified && <span className="badge verified">✓ Verified Email</span>}
               <span className="badge member-since">
                 Member since {new Date(profile?.createdAt || Date.now()).getFullYear()}
               </span>
            </div>
          </div>
        </div>
        <div className="profile-header-actions">
          <button className="primary-btn" onClick={onEdit}>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
