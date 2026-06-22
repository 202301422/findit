import { useLocation } from 'react-router-dom'
import './Login.css'

import SignInForm from '../../components/auth/SignInForm'
import SignUpForm from '../../components/auth/SignUpForm'
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'
import VerifyEmailForm from '../../components/auth/VerifyEmailForm'
import ResetSent from '../../components/auth/ResetSent'

export default function Login() {
  const location = useLocation()
  const path = location.pathname

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="Findit Authentication">
        {(path === '/' || path === '/signin') && <SignInForm />}
        {path === '/signup' && <SignUpForm />}
        {path === '/forgot-password' && <ForgotPasswordForm />}
        {path === '/verify-email' && <VerifyEmailForm />}
        {path === '/reset-sent' && <ResetSent />}
      </section>
    </main>
  )
}