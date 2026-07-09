import type { ProfileData } from '../../types/profile.types';

export default function ProfileInfo({ profile }: { profile: ProfileData }) {
  return (
    <div className="profile-info-grid">
      <div className="info-section">
        <h3>About Me</h3>
        <p className="bio-text">{profile?.bio || 'No bio added yet.'}</p>
      </div>

      <div className="info-section">
        <h3>Contact Information</h3>
        <ul className="info-list">
           <li>
             <span className="info-label">Phone</span>
             <span className="info-value">{profile?.phone || 'Not provided'}</span>
           </li>
           <li>
             <span className="info-label">Email</span>
             <span className="info-value">{profile?.email}</span>
           </li>
        </ul>
      </div>

      <div className="info-section">
        <h3>Location & Education</h3>
        <ul className="info-list">
           <li>
             <span className="info-label">College</span>
             <span className="info-value">{profile?.college || 'Not provided'}</span>
           </li>
           <li>
             <span className="info-label">Location</span>
             <span className="info-value">
               {[profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || 'Not provided'}
             </span>
           </li>
        </ul>
      </div>

      <div className="info-section">
        <h3>Account Status</h3>
        <ul className="info-list">
           <li>
             <span className="info-label">Status</span>
             <span className={`info-value status-badge ${profile?.accountStatus}`}>{profile?.accountStatus || 'active'}</span>
           </li>
           <li>
             <span className="info-label">Verification</span>
             <span className={`info-value status-badge ${profile?.isVerified ? 'active' : 'draft'}`}>
               {profile?.isVerified ? 'Verified' : 'Unverified'}
             </span>
           </li>
        </ul>
      </div>
    </div>
  );
}
