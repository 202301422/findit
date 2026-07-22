import { useLocation } from 'react-router-dom'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import VerifyEmailForm from '@/components/auth/VerifyEmailForm'
import ResetSent from '@/components/auth/ResetSent'
import { ShoppingBag, Search, Ticket, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Login() {
  const location = useLocation()
  const path = location.pathname

  return (
    <main className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left Column - Design/Promo (Desktop Only) */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[var(--color-primary-500)] via-[var(--color-primary-600)] to-[var(--color-primary-700)] p-12 overflow-hidden flex-col justify-between">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-2xl -translate-x-12 translate-y-12" />
        
        {/* Top Header */}
        <div className="relative z-10">
          <span className="text-white/90 text-sm font-bold tracking-[0.2em] uppercase">
            FindIt Platform
          </span>
        </div>

        {/* Center Content with glassmorphic cards */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Connecting university students, one listing at a time.
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Buy and sell pre-loved goods, retrieve lost campus belongings, trade event passes, and exchange tickets instantly in real-time.
            </p>
          </motion.div>

          {/* Grid of features */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Buy & Sell', icon: ShoppingBag },
              { label: 'Lost & Found', icon: Search },
              { label: 'Exchanges', icon: Ticket },
              { label: 'Event Passes', icon: CalendarDays }
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 text-white">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-semibold text-white">{feature.label}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Right Column - Authentication forms */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md flex flex-col items-center"
        >
          {(path === '/' || path === '/signin') && <SignInForm />}
          {path === '/signup' && <SignUpForm />}
          {path === '/forgot-password' && <ForgotPasswordForm />}
          {path === '/verify-email' && <VerifyEmailForm />}
          {path === '/reset-sent' && <ResetSent />}
        </motion.div>
      </section>
    </main>
  )
}