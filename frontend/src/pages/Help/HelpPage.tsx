import { useState } from 'react'
import { HelpCircle, Shield, AlertTriangle, MessageCircle, ChevronDown, Mail, Search, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FAQItem {
  question: string
  answer: string
  category: 'general' | 'lost-found' | 'marketplace' | 'safety'
}

const FAQS: FAQItem[] = [
  {
    category: 'general',
    question: 'What is FindIt?',
    answer: 'FindIt is the official campus marketplace and lost-and-found community platform designed specifically for university students, staff, and faculty to buy, sell, exchange tickets, and return lost belongings safely.',
  },
  {
    category: 'lost-found',
    question: 'How do I report a lost item?',
    answer: 'Click "+ Add Listing", select "Lost & Found", and describe the lost item in detail (including location last seen, date, color, and photos if available). Other students will be able to contact you if found.',
  },
  {
    category: 'lost-found',
    question: 'What should I do if I find someone\'s property?',
    answer: 'Create a "Found Item" post with clear photos and location details, or contact campus security. For security reasons, do not publish sensitive identifiers like credit card numbers or passwords.',
  },
  {
    category: 'marketplace',
    question: 'How do payments work on FindIt?',
    answer: 'FindIt enables direct student-to-student transactions. We recommend exchanging goods in-person at designated campus safe meeting zones (e.g. Student Center, Library, Security Desk) using UPI or cash upon inspection.',
  },
  {
    category: 'safety',
    question: 'How can I ensure safe transactions?',
    answer: 'Always meet in public, well-lit campus areas during daytime. Verify items before making payment. Never transfer money in advance to unverified sellers.',
  },
]

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesQuery
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 bg-[var(--surface-card)] p-8 rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-sm">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/30 text-[var(--color-primary-500)] mb-2">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">How can we help you?</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto">
          Find answers to common questions about campus lost & found, buying and selling goods, event passes, and staying safe on FindIt.
        </p>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help topics..."
            aria-label="Search help topics"
            className="w-full h-11 pl-10 pr-4 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
        </div>
      </div>

      {/* Safety & Quick Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs space-y-2">
          <Shield className="w-6 h-6 text-[var(--color-primary-500)]" />
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">Campus Safety First</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Meet buyers and sellers in public campus areas like the Student Activity Center or Library.
          </p>
        </div>

        <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs space-y-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">Reporting Misconduct</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Spotted inappropriate items or suspicious behavior? Use the report flag on any listing or user profile.
          </p>
        </div>

        <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-xs space-y-2">
          <FileText className="w-6 h-6 text-blue-500" />
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">Platform Rules & Terms</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Review our <Link to="/terms" className="text-[var(--color-primary-500)] hover:underline font-medium">Terms of Service</Link> and <Link to="/privacy" className="text-[var(--color-primary-500)] hover:underline font-medium">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-[var(--surface-card)] p-6 sm:p-8 rounded-[var(--radius-2xl)] border border-[var(--border-primary)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[var(--color-primary-500)]" />
            Frequently Asked Questions
          </h2>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: 'All' },
              { id: 'general', label: 'General' },
              { id: 'lost-found', label: 'Lost & Found' },
              { id: 'marketplace', label: 'Marketplace' },
              { id: 'safety', label: 'Safety' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all border cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[var(--border-primary)]">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left font-medium text-sm text-[var(--text-primary)] hover:text-[var(--color-primary-500)] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[var(--text-tertiary)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[var(--color-primary-500)]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed animate-fade-in">
                      {faq.answer}
                    </p>
                  )}
                </div>
              )
            })
          ) : (
            <p className="py-8 text-center text-xs text-[var(--text-tertiary)]">
              No matching help topics found.
            </p>
          )}
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-[var(--color-primary-50)] dark:bg-[var(--surface-card)] p-6 rounded-[var(--radius-xl)] border border-[var(--color-primary-200)] dark:border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2.5 rounded-full bg-[var(--color-primary-500)] text-white">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">Still need help?</h3>
            <p className="text-xs text-[var(--text-secondary)]">Reach out to our campus administration team.</p>
          </div>
        </div>
        <a
          href="mailto:support@findit-campus.org"
          className="px-4 py-2 text-xs font-semibold bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white rounded-[var(--radius-md)] transition-colors shadow-xs"
        >
          Contact Support
        </a>
      </div>
    </div>
  )
}
