import { FileText, Shield, UserCheck, AlertOctagon } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-[var(--surface-card)] p-8 rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-sm space-y-6">
        <div className="border-b border-[var(--border-primary)] pb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[var(--color-primary-500)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Terms of Service</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Last updated: July 24, 2026</p>
            </div>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-[var(--text-secondary)] space-y-4">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <UserCheck size={18} className="text-[var(--color-primary-500)]" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using FindIt (&quot;Platform&quot;), you agree to be bound by these Terms of Service.
              FindIt is restricted to university students, faculty, and authorized campus members.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Shield size={18} className="text-[var(--color-primary-500)]" />
              2. User Conduct & Listing Guidelines
            </h2>
            <p>
              Users are strictly responsible for all items posted, messages transmitted, and transactions conducted.
              You agree NOT to post:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Counterfeit, stolen, illegal, or prohibited goods</li>
              <li>Misleading, inaccurate, or deceptive descriptions</li>
              <li>Offensive, abusive, or harassing content</li>
              <li>Fake lost-and-found claims or fraudulent tickets</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AlertOctagon size={18} className="text-[var(--color-primary-500)]" />
              3. Transactions & Safety Disclaimer
            </h2>
            <p>
              FindIt acts solely as a communication platform to connect campus buyers, sellers, and property owners.
              FindIt does not inspect, guarantee, or take responsibility for goods exchanged. Always conduct transactions in person in safe campus areas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">4. Account Suspension</h2>
            <p>
              Violation of these terms may result in immediate warning, listing removal, or permanent account termination by campus administrators.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
