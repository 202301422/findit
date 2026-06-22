import { Link } from 'react-router-dom'

export default function ResetSent() {
  return (
    <>
      <div className="brand-mark" aria-hidden="true">
        <MailCheckIcon />
      </div>

      <h1>Check your email</h1>
      <p className="subtitle">
        We&apos;ve sent a password reset link to your email.
      </p>

      <div className="auth-form" style={{ gap: 12 }}>
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="primary-btn"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        >
          Open Gmail
        </a>

        <Link
          to="/signin"
          className="primary-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            background: 'transparent',
            color: 'var(--accent)',
            border: '1.5px solid var(--line)',
            boxShadow: 'none',
          }}
        >
          Back to Sign In
        </Link>
      </div>
    </>
  )
}

/* ── Icon ── */

function MailCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" style={{ stroke: '#ff7a2f', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2 8 5 8-5" />
      <path d="M22 7l-5 5-2-2" />
    </svg>
  )
}
