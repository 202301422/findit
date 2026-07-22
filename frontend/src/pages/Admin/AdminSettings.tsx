import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Settings, Save, ShieldCheck, Lock } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'FindIt Campus Marketplace',
    supportEmail: 'support@findit.edu',
    allowRegistrations: true,
    requireEmailVerification: true,
    maxListingImages: 5,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success && res.data.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        toast.success('System settings saved successfully');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--color-primary-500)]" /> System & Platform Settings
        </h2>
        <p className="text-xs text-[var(--text-tertiary)]">Configure global platform behavior, policies, and limits.</p>
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-xs text-[var(--text-tertiary)]">Loading system settings...</p>
      ) : (
        <form onSubmit={(e) => void handleSave(e)} className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)] space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-secondary)] pb-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary-500)]" /> General Platform Configuration
            </h3>

            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] text-sm"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-1">Official Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] text-sm"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--border-secondary)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-secondary)] pb-2 uppercase tracking-wider">
              <Lock className="w-4 h-4 text-[var(--color-success-500)]" /> Access & Policy Rules
            </h3>

            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
              <div>
                <span className="font-semibold text-[var(--text-primary)] block">Allow New User Registrations</span>
                <span className="text-[11px] text-[var(--text-tertiary)]">Permit students to register new accounts.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
                className="w-4 h-4 rounded text-[var(--color-primary-500)] bg-[var(--bg-secondary)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
              <div>
                <span className="font-semibold text-[var(--text-primary)] block">Require Email Verification</span>
                <span className="text-[11px] text-[var(--text-tertiary)]">Force OTP verification before listing items.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                className="w-4 h-4 rounded text-[var(--color-primary-500)] bg-[var(--bg-secondary)] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--border-secondary)]">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-semibold transition-all shadow-[var(--shadow-xs)] cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
