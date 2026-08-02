import { Lock, Eye, Server, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-3">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--surface-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="bg-[var(--surface-card)] p-8 rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-sm space-y-6">
        <div className="border-b border-[var(--border-primary)] pb-4">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-[var(--color-primary-500)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Last updated: July 24, 2026</p>
            </div>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-[var(--text-secondary)] space-y-4">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Eye size={18} className="text-[var(--color-primary-500)]" />
              1. Information We Collect
            </h2>
            <p>
              FindIt respects your privacy. We collect minimal information required to verify campus identity and operate our marketplace:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Institutional email address & student ID prefix</li>
              <li>Name, profile avatar, and optional contact phone number</li>
              <li>Postings, messages, and saved item preferences</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Server size={18} className="text-[var(--color-primary-500)]" />
              2. How We Use Your Data
            </h2>
            <p>
              Your data is strictly used to display listings, deliver in-app notifications, verify campus user status, and enable chat communication between buyers and sellers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[var(--color-primary-500)]" />
              3. Data Protection & Sharing
            </h2>
            <p>
              We do NOT sell or monetise personal data. Your contact details are shared with another user ONLY when you initiate or accept a transaction/message.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
