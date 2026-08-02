import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  MapPin,
  Ticket,
  Calendar,
  MessageSquare,
  ShieldCheck,
  LayoutDashboard,
  Megaphone,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Users,
  Sparkles,
  Zap,
  RefreshCw,
  Recycle,
  Heart,
  ExternalLink,
  Flame
} from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

/* ── Animation Variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as any } }
}

/* ── Developer Data ── */
const DEVELOPERS = [
  {
    name: 'Dwarkesh Vaghasiya',
    enrollment: '202301225',
    role: 'Full Stack & Lead Architect',
    initials: 'DV',
    gradient: 'from-amber-500 to-orange-600',
    bio: 'Specializes in full-stack architecture, system integration, and campus marketplace performance.'
  },
  {
    name: 'Jay Balar',
    enrollment: '202301422',
    role: 'Full Stack Developer',
    initials: 'JB',
    gradient: 'from-blue-500 to-indigo-600',
    bio: 'Passionate about real-time socket communications, database schemas, and scalable web infrastructure.'
  },
  {
    name: 'Dip Zadafiya',
    enrollment: '202301159',
    role: 'Frontend & UI/UX Developer',
    initials: 'DZ',
    gradient: 'from-emerald-500 to-teal-600',
    bio: 'Crafts responsive SaaS user interfaces, accessible design systems, and rich micro-interactions.'
  },
  {
    name: 'Sujal Prajapati',
    enrollment: '202301478',
    role: 'Backend & Security Specialist',
    initials: 'SP',
    gradient: 'from-purple-500 to-violet-600',
    bio: 'Focuses on API authentication, image delivery pipelines, and administrative moderation tools.'
  }
]

/* ── Features List ── */
const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy and sell books, electronics, gadgets, and everyday essentials directly with DAU peers.',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  },
  {
    icon: MapPin,
    title: 'Lost & Found',
    description: 'Report lost belongings or return found items with venue locations and instant notifications.',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    icon: Calendar,
    title: 'Event Passes',
    description: 'Exchange concert, fest, movie, and campus event passes securely within the student body.',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  },
  {
    icon: Ticket,
    title: 'Travel Passes',
    description: 'Share bus, train, or flight tickets with verified students when travel plans change.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Instant student-to-student messaging powered by Socket.io for negotiations & safe meetings.',
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20'
  },
  {
    icon: ShieldCheck,
    title: 'Secure Authentication',
    description: 'Firebase authentication with email verification to ensure only genuine university members participate.',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
  },
  {
    icon: LayoutDashboard,
    title: 'Admin Dashboard',
    description: 'Comprehensive moderation center for listing verification, user reports, and category controls.',
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
  },
  {
    icon: Megaphone,
    title: 'Broadcast Notifications',
    description: 'Instant campus-wide alerts and updates delivered directly to active students.',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Alerts',
    description: 'High-priority urgency banners for critical campus announcements and lost valuables.',
    color: 'text-red-500 bg-red-500/10 border-red-500/20'
  },
  {
    icon: Smartphone,
    title: 'Responsive Design',
    description: 'Fluid, dark-mode compatible interface tailored for desktops, tablets, and smartphones.',
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20'
  }
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-16 lg:space-y-24 py-4 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ── Top Header Navigation ── */}
      <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--surface-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/home"
            className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-500)] text-white text-xs font-semibold hover:bg-[var(--color-primary-600)] transition-colors shadow-xs"
          >
            Explore Marketplace
          </Link>
        </div>
      </div>

      {/* ── SECTION 1: HERO ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-gradient-to-br from-[var(--surface-card)] via-[var(--bg-primary)] to-[var(--surface-card)] border border-[var(--border-primary)] p-8 sm:p-12 lg:p-16 shadow-lg text-center"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--color-primary-500)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary-500)]/10 border border-[var(--color-primary-500)]/20 text-[var(--color-primary-500)] text-xs font-bold tracking-wide uppercase">
            <Sparkles size={14} />
            <span>Exclusively for Dhirubhai Ambani University (DAU)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Find<span className="text-[var(--color-primary-500)]">It</span>
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-[var(--text-secondary)]">
            Campus Marketplace &amp; Lost-and-Found Platform
          </p>

          <p className="text-sm sm:text-base text-[var(--text-tertiary)] leading-relaxed max-w-2xl mx-auto">
            FindIt is a trusted community platform built for students of Dhirubhai Ambani University to buy and sell products, recover lost belongings, exchange event or travel tickets, and connect securely within the campus ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/home"
              className="w-full sm:w-auto px-6 py-3 rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag size={18} />
              <span>Explore Marketplace</span>
            </Link>

            <Link
              to="/home"
              className="w-full sm:w-auto px-6 py-3 rounded-[var(--radius-lg)] border border-[var(--border-primary)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go Home</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 2: OUR MISSION ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-8"
      >
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
            <Heart className="text-[var(--color-primary-500)] fill-[var(--color-primary-500)]/20" size={24} />
            <span>Our Mission</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
            Empowering students with a safe, convenient, and eco-friendly digital campus network.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: 'Safe Campus Transactions',
              desc: 'Promote secure peer-to-peer exchanges by limiting access to verified DAU campus members.',
              color: 'text-indigo-500'
            },
            {
              icon: MapPin,
              title: 'Lost Item Recovery',
              desc: 'Help students quickly reunite with lost keys, IDs, gadgets, and personal belongings.',
              color: 'text-emerald-500'
            },
            {
              icon: Recycle,
              title: 'Reduce Waste & Reuse',
              desc: 'Encourage sustainability by giving textbooks, lab gear, and dorm equipment a second life.',
              color: 'text-green-500'
            },
            {
              icon: Users,
              title: 'Trusted Student Community',
              desc: 'Build strong relationships and helpful connections across different academic branches.',
              color: 'text-blue-500'
            },
            {
              icon: Zap,
              title: 'Simplify Buying & Selling',
              desc: 'Remove middleman fees and complex setups with direct, instant campus trading.',
              color: 'text-amber-500'
            },
            {
              icon: Sparkles,
              title: 'Peer Convenience',
              desc: 'Exchange event passes or travel tickets smoothly when schedules or plans change.',
              color: 'text-purple-500'
            }
          ].map((mission, idx) => {
            const Icon = mission.icon
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 space-y-3"
              >
                <div className={`p-3 rounded-full w-fit bg-[var(--bg-secondary)] border border-[var(--border-secondary)] ${mission.color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{mission.title}</h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{mission.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ── SECTION 3: FEATURES ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-8"
      >
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
            <Flame className="text-amber-500" size={24} />
            <span>Platform Features</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
            Everything you need for seamless university trading and property recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs hover:border-[var(--color-primary-500)]/40 hover:shadow-md transition-all duration-300 space-y-3 group"
              >
                <div className={`p-3 rounded-xl w-fit border ${feat.color} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary-500)] transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ── SECTION 4: HOW IT WORKS ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
            <RefreshCw className="text-[var(--color-primary-500)]" size={24} />
            <span>How It Works</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
            Four simple steps to buy, sell, or recover items on campus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Register', desc: 'Sign up using your university email credentials.' },
            { step: '02', title: 'Create Listing', desc: 'Post products, lost items, or tickets with photos & prices.' },
            { step: '03', title: 'Connect with Students', desc: 'Chat directly in real-time to negotiate or coordinate.' },
            { step: '04', title: 'Complete Exchange', desc: 'Meet safely at campus spots to inspect and finalize.' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs space-y-3 overflow-hidden"
            >
              <span className="text-4xl font-extrabold text-[var(--color-primary-500)]/20 select-none block">
                {item.step}
              </span>
              <h3 className="text-base font-bold text-[var(--text-primary)]">{item.title}</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 5: WHY FINDIT ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="p-8 sm:p-10 rounded-[var(--radius-2xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-sm space-y-8"
      >
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Why FindIt?</h2>
          <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
            Designed from the ground up for Dhirubhai Ambani University students.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            'Campus-only platform',
            'Trusted student community',
            'Verified users',
            'Real-time communication',
            'Easy image uploads',
            'Responsive design',
            'Secure authentication',
            'Admin moderation'
          ].map((highlight, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3.5 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)]"
            >
              <CheckCircle2 size={18} className="text-[var(--color-primary-500)] shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">{highlight}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 7: DEVELOPMENT TEAM ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-8"
      >
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
            <Users className="text-[var(--color-primary-500)]" size={24} />
            <span>Development Team</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
            Project Developed By Students of Dhirubhai Ambani University.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEVELOPERS.map((dev, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between space-y-4 text-center group"
            >
              <div className="space-y-4">
                {/* Avatar Placeholder */}
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-tr ${dev.gradient} flex items-center justify-center text-white text-xl font-black shadow-md group-hover:scale-105 transition-transform duration-300 ring-4 ring-[var(--surface-card)]`}>
                  {dev.initials}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary-500)] transition-colors">
                    {dev.name}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--color-primary-500)]">{dev.role}</p>
                  <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                    Enrollment No: <span className="font-bold text-[var(--text-secondary)]">{dev.enrollment}</span>
                  </p>
                </div>

                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                  {dev.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 8: CONTACT & FEEDBACK ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="p-8 sm:p-12 rounded-[var(--radius-2xl)] bg-gradient-to-r from-[var(--color-primary-500)]/10 via-[var(--surface-card)] to-[var(--color-primary-500)]/10 border border-[var(--color-primary-500)]/20 shadow-md text-center space-y-6"
      >
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center shadow-md">
            <Mail size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Get in Touch</h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Have questions, feedback, or suggestions for improving FindIt? Reach out directly to the team or check out our codebase.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href="mailto:findit245@gmail.com"
            className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            <span>Email: findit245@gmail.com</span>
          </a>

          <a
            href="https://github.com/jaybalar/findit"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border-primary)] bg-[var(--surface-card)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
          >
            <FaGithub size={16} />
            <span>GitHub Repository</span>
            <ExternalLink size={14} className="text-[var(--text-tertiary)]" />
          </a>
        </div>
      </motion.section>
    </div>
  )
}
