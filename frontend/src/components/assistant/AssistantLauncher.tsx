import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import AssistantPanel from './AssistantPanel'

export default function AssistantLauncher() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open FindIt Assistant"
        title="Open FindIt Assistant"
        className="fixed z-40 bottom-20 right-4 lg:bottom-6 lg:right-6 w-13 h-13 rounded-full bg-gradient-to-tr from-[var(--color-primary-600)] via-[var(--color-primary-500)] to-[var(--color-primary-400)] text-white shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer transition-all duration-300 border-2 border-white/20"
      >
        <Sparkles size={24} className="animate-pulse" />
        <span className="sr-only">Open FindIt Assistant</span>
      </motion.button>

      <AssistantPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
