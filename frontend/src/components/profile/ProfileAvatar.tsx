import { useState, useRef } from 'react';
import { useProfile } from '../../hooks/useProfile';

export default function ProfileAvatar({ avatar, name }: { avatar?: string, name: string }) {
  const { uploadAvatar, deleteAvatar } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      await uploadAvatar(file);
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    await deleteAvatar();
    setLoading(false);
  };

  return (
    <div className="profile-avatar-edit">
      <div className="avatar-preview">
        {avatar ? (
          <img src={avatar} alt={name} />
        ) : (
          <div className="avatar-placeholder-large">
            {name?.charAt(0).toUpperCase()}
          </div>
        )}
        {loading && <div className="avatar-loading">Uploading...</div>}
      </div>
      <div className="avatar-actions">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
        />
        <button type="button" className="secondary-btn" onClick={() => fileInputRef.current?.click()} disabled={loading}>
          {avatar ? 'Replace' : 'Upload Image'}
        </button>
        {avatar && (
          <button type="button" className="danger-btn outline" onClick={handleRemove} disabled={loading}>
            Remove
          </button>
        )}
      </div>
      <p className="avatar-help">JPG, PNG or WEBP. Max 5MB.</p>
    </div>
  );
}
