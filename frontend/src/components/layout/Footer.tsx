import { Link } from 'react-router-dom'
import { Mail, ShieldCheck, Heart, ArrowUpRight, HelpCircle, Info, FileText, Lock } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import BrandLogo from '../BrandLogo'

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-primary)] text-[var(--text-secondary)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo to="/home" variant="full" />
            <p className="text-xs sm:text-sm text-[var(--text-tertiary)] max-w-sm leading-relaxed">
              FindIt is the official trusted campus marketplace &amp; lost-and-found ecosystem built exclusively for students, faculty, and staff of Dhirubhai Ambani University (DAU).
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] text-xs font-semibold border border-[var(--color-primary-500)]/20">
                <ShieldCheck size={14} /> DAU Campus Verified
              </span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Navigation</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/home" className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1 font-medium text-[var(--color-primary-500)]">
                  <Info size={13} /> About FindIt
                </Link>
              </li>
              <li>
                <Link to="/add-item" className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1">
                  Post an Item
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1">
                  Search &amp; Filter
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Resources &amp; Legal</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/help" className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1">
                  <HelpCircle size={13} /> Help &amp; FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1">
                  <FileText size={13} /> Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1">
                  <Lock size={13} /> Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Community Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Contact &amp; Code</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href="mailto:findit245@gmail.com"
                  className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail size={14} className="text-[var(--color-primary-500)]" />
                  <span>findit245@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/jaybalar/findit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-primary-500)] transition-colors inline-flex items-center gap-1.5"
                >
                  <FaGithub size={14} />
                  <span>GitHub Repository</span>
                  <ArrowUpRight size={12} className="text-[var(--text-tertiary)]" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-[var(--border-secondary)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-tertiary)]">
          <p>© {new Date().getFullYear()} FindIt. Built for Dhirubhai Ambani University (DAU).</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" />
            <span>by DAU Engineering Students</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
