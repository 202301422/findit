import { useState, useEffect } from 'react';
import type { ProfileData, UpdateProfileData } from '../../types/profile.types';
import ProfileAvatar from './ProfileAvatar';

interface EditProfileModalProps {
  profile: ProfileData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateProfileData) => Promise<boolean>;
  loading: boolean;
}

export default function EditProfileModal({ profile, isOpen, onClose, onSave, loading }: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: profile?.name || '',
    username: profile?.username || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    college: profile?.college || '',
    city: profile?.city || '',
    state: profile?.state || '',
    country: profile?.country || ''
  });

  // Update local state when profile changes
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        college: profile.college || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || ''
      });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>&times;</button>
        </div>
        
        <ProfileAvatar avatar={profile?.avatar} name={profile?.name || ''} />

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Full Name *</span>
              <span className="field__shell">
                <input type="text" name="name" value={formData.name} onChange={handleChange} required minLength={2} maxLength={50} />
              </span>
            </label>
            <label className="field">
              <span className="field__label">Username</span>
              <span className="field__shell">
                <input type="text" name="username" value={formData.username} onChange={handleChange} minLength={3} maxLength={30} pattern="^[a-zA-Z0-9_]*$" title="Only letters, numbers and underscores allowed" />
              </span>
            </label>
            <label className="field">
              <span className="field__label">Email Address (Read Only)</span>
              <span className="field__shell">
                <input type="email" value={profile?.email || ''} disabled style={{ backgroundColor: '#f5f5f5', color: '#888' }} />
              </span>
            </label>
            <label className="field">
              <span className="field__label">Phone Number</span>
              <span className="field__shell">
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </span>
            </label>
          </div>

          <label className="field">
            <span className="field__label">Bio</span>
            <span className="field__shell" style={{ height: 'auto' }}>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} maxLength={500} style={{ width: '100%', border: 'none', padding: '0.6rem 0', resize: 'vertical', outline: 'none', background: 'transparent' }} placeholder="Tell us about yourself..."></textarea>
            </span>
          </label>

          <h3 className="form-section-title">Location & Education</h3>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">College</span>
              <span className="field__shell">
                <input type="text" name="college" value={formData.college} onChange={handleChange} maxLength={100} />
              </span>
            </label>
            <label className="field">
              <span className="field__label">City</span>
              <span className="field__shell">
                <input type="text" name="city" value={formData.city} onChange={handleChange} maxLength={100} />
              </span>
            </label>
            <label className="field">
              <span className="field__label">State</span>
              <span className="field__shell">
                <input type="text" name="state" value={formData.state} onChange={handleChange} maxLength={100} />
              </span>
            </label>
            <label className="field">
              <span className="field__label">Country</span>
              <span className="field__shell">
                <input type="text" name="country" value={formData.country} onChange={handleChange} maxLength={100} />
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
