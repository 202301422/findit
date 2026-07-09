import { useState } from 'react';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiresPassword: boolean;
}

export default function DeleteAccountModal({ isOpen, onClose, requiresPassword }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await profileService.deleteAccount(password);
      toast.success('Account deleted successfully');
      await logout();
      navigate('/signin');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#d32f2f' }}>Delete Account</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>&times;</button>
        </div>
        
        <p className="danger-text">
          <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account, 
          all your listings, passes, and personal data from our servers.
        </p>

        <form onSubmit={handleSubmit} className="profile-form">
          {requiresPassword && (
            <label className="field">
              <span className="field__label">Enter password to confirm</span>
              <span className="field__shell">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Your password" />
              </span>
            </label>
          )}
          
          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="primary-btn" style={{ background: '#d32f2f', color: 'white', border: 'none' }} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
