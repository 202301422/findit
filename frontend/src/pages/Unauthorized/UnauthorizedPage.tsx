import { useNavigate, Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-[var(--surface-card)] p-8 rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-md">
        
        {/* Visual Icon Badge */}
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-red-500/10 text-red-500 mb-2">
          <ShieldAlert size={48} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Access Denied</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            You do not have permission or administrative privileges to view this page. If you believe this is an error, please log in with an authorized account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-[var(--radius-lg)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>

          <Link
            to="/home"
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Home size={14} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
