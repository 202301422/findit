import { useState, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import VerifyEmailForm from '@/components/auth/VerifyEmailForm'
import ResetSent from '@/components/auth/ResetSent'
import BrandLogo from '@/components/BrandLogo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { 
  ShoppingBag, 
  Search, 
  Ticket, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Star, 
  Zap, 
  Lock, 
  ChevronRight,
  Laptop
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const [activeTab, setActiveTab] = useState<'marketplace' | 'lostfound' | 'passes' | 'trust'>('marketplace')
  const authSectionRef = useRef<HTMLDivElement>(null)

  const scrollToAuth = (targetPath?: string) => {
    if (targetPath && targetPath !== path) {
      navigate(targetPath)
    }
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden selection:bg-[var(--color-primary-500)] selection:text-white">
      
      {/* ── Top Glassmorphic Navigation Header ── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-primary)]/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo variant="full" showTagline />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--color-primary-500)] transition-colors">Features</a>
            <a href="#stats" className="hover:text-[var(--color-primary-500)] transition-colors">Metrics</a>
            <a href="#testimonials" className="hover:text-[var(--color-primary-500)] transition-colors">Reviews</a>
          </nav>

          {/* Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle size="md" />
            
            <button
              onClick={() => scrollToAuth('/signin')}
              className={`px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] transition-all cursor-pointer ${
                path === '/' || path === '/signin'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => scrollToAuth('/signup')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white shadow-md shadow-[var(--color-primary-500)]/20 hover:shadow-lg hover:shadow-[var(--color-primary-500)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1">

        {/* ── HERO SECTION ── */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-primary-500)]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Hero Left Column: Copy & Value Proposition */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* Live Pill Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--color-primary-500)]/10 border border-[var(--color-primary-500)]/20 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] text-xs font-semibold tracking-wide"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-500)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary-500)]"></span>
                  </span>
                  <span>Verified Campus Exchange Network</span>
                  <ChevronRight size={14} className="opacity-75" />
                </motion.div>

                {/* Main Headline */}
                <motion.h1 
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
                >
                  Connecting campus life,{' '}
                  <span className="bg-gradient-to-r from-[var(--color-primary-500)] via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    one listing at a time.
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p 
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal"
                >
                  Buy &amp; sell pre-loved goods, retrieve lost campus belongings with real-time location tags, trade event passes, and exchange tickets securely with verified peers.
                </motion.p>

                {/* CTAs */}
                <motion.div 
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
                >
                  <button
                    onClick={() => scrollToAuth(path === '/' ? '/signup' : path)}
                    className="px-6 py-3.5 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white font-semibold shadow-lg shadow-[var(--color-primary-500)]/25 hover:shadow-xl hover:shadow-[var(--color-primary-500)]/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight size={18} />
                  </button>

                  <a
                    href="#features"
                    className="px-6 py-3.5 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-semibold transition-all flex items-center gap-2"
                  >
                    <span>Explore Features</span>
                  </a>
                </motion.div>

                {/* Micro Badges */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[var(--text-tertiary)] font-medium"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>@dau.ac.in Verified Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    <span>Real-time Chat &amp; Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-blue-500" />
                    <span>Zero Markup Scalping</span>
                  </div>
                </motion.div>

                {/* Dynamic Floating Visual Preview Cards */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {[
                    { label: 'Buy & Sell', count: '1,420+ items', icon: ShoppingBag, color: 'text-orange-500 bg-orange-500/10' },
                    { label: 'Lost & Found', count: '98% recovered', icon: Search, color: 'text-emerald-500 bg-emerald-500/10' },
                    { label: 'Travelling Passes', count: 'Instant trade', icon: Ticket, color: 'text-blue-500 bg-blue-500/10' },
                    { label: 'Event Tickets', count: 'Verified seats', icon: Sparkles, color: 'text-purple-500 bg-purple-500/10' },
                  ].map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <div 
                        key={idx}
                        className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)] backdrop-blur-sm hover:border-[var(--color-primary-500)]/40 hover:shadow-md transition-all group"
                      >
                        <div className={`w-8 h-8 rounded-[var(--radius-sm)] ${item.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                          <Icon size={16} />
                        </div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{item.label}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">{item.count}</p>
                      </div>
                    )
                  })}
                </motion.div>

              </div>

              {/* Hero Right Column: Authentication Card Container */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end" ref={authSectionRef}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-full max-w-md relative"
                >
                  {/* Decorative Card Outer Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary-500)] via-orange-500 to-amber-500 rounded-[28px] blur-lg opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                  
                  <div className="relative bg-[var(--surface-card)] rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
                    
                    {/* Navigation Tabs for Sign In / Sign Up when on / or /signin or /signup */}
                    {(path === '/' || path === '/signin' || path === '/signup') && (
                      <div className="flex bg-[var(--bg-secondary)] p-1 rounded-[var(--radius-md)] border border-[var(--border-primary)] mb-6">
                        <button
                          type="button"
                          onClick={() => navigate('/signin')}
                          className={`flex-1 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                            path === '/' || path === '/signin'
                              ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/signup')}
                          className={`flex-1 py-2 text-xs font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                            path === '/signup'
                              ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Create Account
                        </button>
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={path}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                      >
                        {(path === '/' || path === '/signin') && <SignInForm />}
                        {path === '/signup' && <SignUpForm />}
                        {path === '/forgot-password' && <ForgotPasswordForm />}
                        {path === '/verify-email' && <VerifyEmailForm />}
                        {path === '/reset-sent' && <ResetSent />}
                      </motion.div>
                    </AnimatePresence>

                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* ── STATS & METRICS COUNTER BAR ── */}
        <section id="stats" className="py-12 bg-[var(--bg-secondary)] border-y border-[var(--border-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  <Users className="text-[var(--color-primary-500)]" size={24} />
                  <span>12,500+</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Verified Campus Students</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  <TrendingUp className="text-emerald-500" size={24} />
                  <span>₹8,50,000+</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Saved on Textbooks &amp; Gear</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  <Search className="text-blue-500" size={24} />
                  <span>98.4%</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Lost Item Recovery Rate</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  <Zap className="text-amber-500" size={24} />
                  <span>&lt; 5 mins</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Average Peer Response Time</p>
              </div>

            </div>
          </div>
        </section>

        {/* ── INTERACTIVE FEATURE EXPLORER ── */}
        <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold tracking-widest text-[var(--color-primary-500)] uppercase">
              Everything You Need On Campus
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Designed specifically for university students.
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              Findit combines a peer-to-peer marketplace, lost &amp; found radar, travelling tickets, and event pass exchange under one single secure platform.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] gap-1 overflow-x-auto scrollbar-hide max-w-full">
              {[
                { id: 'marketplace', label: 'Buy & Sell', icon: ShoppingBag },
                { id: 'lostfound', label: 'Lost & Found Radar', icon: Search },
                { id: 'passes', label: 'Passes & Tickets', icon: Ticket },
                { id: 'trust', label: 'Verified Campus Trust', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feature Showcase Box */}
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-xl p-6 sm:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'marketplace' && (
                <motion.div
                  key="marketplace"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-6 space-y-4">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-orange-500/10 text-[var(--color-primary-500)] flex items-center justify-center">
                      <ShoppingBag size={24} />
                    </div>
                    <h3 className="text-2xl font-extrabold">Hostel &amp; Academic Marketplace</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Sell pre-loved engineering textbooks, lab coats, MacBooks, desk lamps, and dorm furniture directly to students on your campus without commission fees.
                    </p>
                    <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Filter by course, branch, semester &amp; condition</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Direct in-app messaging &amp; campus pickup negotiation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Wishlist alerts for missing course materials</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] p-6 border border-[var(--border-primary)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Sample Listing</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">Available</span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--color-primary-500)] shrink-0">
                        <Laptop size={36} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base">Apple MacBook Air M2 (16GB RAM, 512GB)</h4>
                        <p className="text-xs text-[var(--text-secondary)]">Includes original charger &amp; box • Pristine condition</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-lg font-extrabold text-[var(--color-primary-500)]">₹52,000</span>
                          <span className="text-xs text-[var(--text-tertiary)] line-through">₹78,000</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary-500)] text-white font-bold text-[10px] flex items-center justify-center">AS</div>
                        <span>Aarav S. (CSE &apos;25)</span>
                      </div>
                      <span className="flex items-center gap-1 font-semibold text-amber-500">
                        <Star size={12} fill="currentColor" /> 4.9 (18 sales)
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'lostfound' && (
                <motion.div
                  key="lostfound"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-6 space-y-4">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Search size={24} />
                    </div>
                    <h3 className="text-2xl font-extrabold">Real-Time Campus Lost &amp; Found Radar</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Lost your water bottle, ID card, keys, or AirPods in a lecture hall? Report lost items or submit found belongings with precise location tags to reunite owners fast.
                    </p>
                    <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Interactive map pin locations (Library, Canteen, Auditorium)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Security verification checks before item handover</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Instant notification alerts when matching items are found</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] p-6 border border-[var(--border-primary)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Loss Radar</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">Claim Pending</span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-[var(--radius-md)] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <MapPin size={36} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base">AirPods Pro Gen 2 with Black Case</h4>
                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-500" />
                          <span>Found @ Central Library 2nd Floor Reading Room</span>
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)] pt-1">Reported 12 minutes ago by Security Desk</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Sparkles size={14} /> High Match Confidence
                      </span>
                      <button onClick={() => scrollToAuth()} className="text-[var(--color-primary-500)] font-bold hover:underline cursor-pointer">
                        Claim Item &rarr;
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'passes' && (
                <motion.div
                  key="passes"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-6 space-y-4">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Ticket size={24} />
                    </div>
                    <h3 className="text-2xl font-extrabold">Event Pass &amp; Travelling Ticket Trade</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Can&apos;t make it to tonight&apos;s campus concert, tech summit, or weekend shuttle bus? Trade passes directly with classmates at face value.
                    </p>
                    <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Fair-price enforcement protects students from scalping</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Digital pass QR upload &amp; instant peer transfer</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Weekend travel bus ticket exchange for home trips</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] p-6 border border-[var(--border-primary)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Pass Exchange</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">Instant QR</span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-[var(--radius-md)] bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <Ticket size={36} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base">Annual Cultural Fest — VIP Day 2 Entry</h4>
                        <p className="text-xs text-[var(--text-secondary)]">Main Arena • Gates open 6:00 PM</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-lg font-extrabold text-[var(--color-primary-500)]">₹299</span>
                          <span className="text-xs text-[var(--text-tertiary)]">Face Value Price</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="text-xs text-[var(--text-tertiary)]">Listed by Priya K. (ECE &apos;26)</span>
                      <button onClick={() => scrollToAuth()} className="text-[var(--color-primary-500)] font-bold hover:underline cursor-pointer">
                        Get Ticket &rarr;
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'trust' && (
                <motion.div
                  key="trust"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-6 space-y-4">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-2xl font-extrabold">Exclusive Verified Peer Network</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Say goodbye to anonymous scammers and suspicious online buyers. Every single account on Findit is verified through their official university student email address.
                    </p>
                    <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Strict @dau.ac.in student email OTP verification</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Peer ratings, reviews &amp; campus trust badges</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Zero anonymous accounts — 100% safe campus community</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] p-6 border border-[var(--border-primary)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Campus Security</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600">Active Guard</span>
                    </div>

                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-primary)] space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-extrabold flex items-center justify-center">
                          VK
                        </div>
                        <div>
                          <h4 className="font-bold text-sm flex items-center gap-1.5">
                            <span>Vikram Kumar</span>
                            <ShieldCheck size={14} className="text-emerald-500" />
                          </h4>
                          <p className="text-xs text-[var(--text-tertiary)]">202301422@dau.ac.in • Verified Student</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                        <div className="p-2 rounded bg-[var(--bg-secondary)]">
                          <p className="font-bold text-[var(--text-primary)]">24</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">Exchanges</p>
                        </div>
                        <div className="p-2 rounded bg-[var(--bg-secondary)]">
                          <p className="font-bold text-emerald-500">5.0 ★</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">Rating</p>
                        </div>
                        <div className="p-2 rounded bg-[var(--bg-secondary)]">
                          <p className="font-bold text-purple-500">Fast</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">Replier</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── CAMPUS REVIEWS & TESTIMONIALS ── */}
        <section id="testimonials" className="py-20 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <span className="text-xs font-extrabold tracking-widest text-[var(--color-primary-500)] uppercase">
                Loved By Students
              </span>
              <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
                Hear from your fellow peers.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Recovered my misplaced laptop bag from the library reading hall within 25 minutes using the Lost Radar. Unbelievable speed!",
                  name: "Sneha R.",
                  dept: "B.Tech CSE '26",
                  stars: 5,
                  tag: "Lost & Found"
                },
                {
                  quote: "Saved over ₹4,500 on 3rd year engineering textbooks by buying pre-loved sets from senior students directly on campus.",
                  name: "Rahul Verma",
                  dept: "Mechanical Engg '25",
                  stars: 5,
                  tag: "Textbook Deals"
                },
                {
                  quote: "Super safe and smooth experience trading cultural fest passes with classmates. Knowing everyone has a verified email gives 100% peace of mind.",
                  name: "Ananya Mehta",
                  dept: "Design & Media '27",
                  stars: 5,
                  tag: "Ticket Trade"
                }
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-[var(--surface-card)] rounded-[var(--radius-xl)] p-6 border border-[var(--border-primary)] shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 text-amber-400">
                        {[...Array(testimonial.stars)].map((_, s) => (
                          <Star key={s} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-500)]/10 text-[var(--color-primary-600)]">
                        {testimonial.tag}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{testimonial.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{testimonial.dept}</p>
                    </div>
                    <ShieldCheck size={16} className="text-emerald-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-primary)] py-10 text-xs text-[var(--text-tertiary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="compact" />
            <span>&copy; {new Date().getFullYear()} Findit Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-[var(--text-secondary)]">
            <Link to="/about" className="hover:text-[var(--color-primary-500)] transition-colors">About Us</Link>
            <Link to="/help" className="hover:text-[var(--color-primary-500)] transition-colors">Help Center</Link>
            <Link to="/terms" className="hover:text-[var(--color-primary-500)] transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-[var(--color-primary-500)] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}