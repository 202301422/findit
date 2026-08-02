import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Sparkles, X, Send, Trash2, ArrowRight, Layers, GripHorizontal, Eye, ImagePlus } from 'lucide-react'
import { clsx } from 'clsx'
import type {
  AssistantMessage as AssistantMessageType,
  AssistantListing,
  ContextListingRef,
  ActivePageContext,
  ListingType,
} from '@/types/assistant.types'
import { assistantService } from '@/services/assistantService'
import AssistantMessage from './AssistantMessage'
import AssistantSuggestions from './AssistantSuggestions'
import AssistantTypingIndicator from './AssistantTypingIndicator'

interface AssistantPanelProps {
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = 'findit_assistant_messages_v1'

const INITIAL_GREETING_MESSAGE: AssistantMessageType = {
  id: 'init-greeting',
  role: 'assistant',
  content: 'Hi! I’m GetIt, your FindIt Assistant.\nI can help you discover marketplace items, lost property, tickets and passes.',
  timestamp: Date.now(),
}

export default function AssistantPanel({ isOpen, onClose }: AssistantPanelProps) {
  const location = useLocation()
  const [messages, setMessages] = useState<AssistantMessageType[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // ignore parsing error
    }
    return [INITIAL_GREETING_MESSAGE]
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedListingsForCompare, setSelectedListingsForCompare] = useState<AssistantListing[]>([])

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return (
      document.documentElement.getAttribute('data-theme-category') ||
      sessionStorage.getItem('home_tab') ||
      'Buy & Sell'
    )
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragControls = useDragControls()

  // Detect Focused Product ID & Page Context
  const getActivePageContext = useCallback((): ActivePageContext => {
    const ctx: ActivePageContext = {
      pathname: location.pathname,
      currentTab: activeCategory,
    }

    if (location.pathname.startsWith('/product/')) {
      const parts = location.pathname.split('/')
      const possibleId = parts[2]
      if (possibleId && possibleId.length === 24) {
        ctx.currentProductId = possibleId
        const searchParams = new URLSearchParams(location.search)
        const typeParam = searchParams.get('type') as ListingType
        ctx.currentProductType = typeParam || 'sell'
      }
    }

    return ctx
  }, [location.pathname, location.search, activeCategory])

  // Dynamic Theme Synchronization
  useEffect(() => {
    const syncCategoryTheme = () => {
      const cat =
        document.documentElement.getAttribute('data-theme-category') ||
        sessionStorage.getItem('home_tab') ||
        'Buy & Sell'
      setActiveCategory(cat)
    }

    syncCategoryTheme()
    window.addEventListener('storage', syncCategoryTheme)

    const observer = new MutationObserver(syncCategoryTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-category'],
    })

    return () => {
      window.removeEventListener('storage', syncCategoryTheme)
      observer.disconnect()
    }
  }, [])

  // Persist messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore quota storage error
    }
  }, [messages])

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, scrollToBottom])

  // Cancel in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setLoading(false)
    setSelectedListingsForCompare([])
    setMessages([INITIAL_GREETING_MESSAGE])
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const handleToggleCompareListing = (listing: AssistantListing) => {
    setSelectedListingsForCompare((prev) => {
      const exists = prev.some((l) => l._id === listing._id)
      if (exists) {
        return prev.filter((l) => l._id !== listing._id)
      } else {
        if (prev.length >= 4) {
          return [...prev.slice(1), listing]
        }
        return [...prev, listing]
      }
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be less than 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1024
        const MAX_HEIGHT = 1024
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85)
          setSelectedImage(compressedBase64)
        } else if (typeof event.target?.result === 'string') {
          setSelectedImage(event.target.result)
        }
      }
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim()
    const imageToSend = selectedImage

    if ((!messageText && !imageToSend) || loading) return

    setInput('')
    setSelectedImage(null)
    setSelectedListingsForCompare([])

    const userMessage: AssistantMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      imageBase64: imageToSend || undefined,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    const contextListings: ContextListingRef[] = selectedListingsForCompare.map((l) => ({
      id: l._id,
      type: l.type,
    }))

    const historyForApi = messages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }))

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const activePageContext = getActivePageContext()
      const response = await assistantService.sendMessage({
        message: messageText,
        imageBase64: imageToSend || undefined,
        history: historyForApi,
        contextListings,
        activePageContext,
        signal: controller.signal,
      })

      const assistantMessage: AssistantMessageType = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
        listings: response.listings,
        appliedFilters: response.appliedFilters,
        comparison: response.comparison,
        clarificationQuestion: response.clarificationQuestion,
        suggestedPrompts: response.suggestedPrompts,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string }
      if (errorObj?.name === 'CanceledError' || errorObj?.name === 'AbortError') {
        return
      }

      const errorMessage: AssistantMessageType = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorObj?.message || 'Sorry, I ran into an error processing your request. Please try again.',
        timestamp: Date.now(),
        isError: true,
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const handleTriggerCompareSelected = () => {
    if (selectedListingsForCompare.length < 2) return
    const compareNames = selectedListingsForCompare
      .map((l) => l.name || l.ticketType || 'Listing')
      .join(' vs ')
    void handleSendMessage(`Compare selected listings: ${compareNames}`)
  }

  const isProductPage = location.pathname.startsWith('/product/')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Assistant Floating Movable Container */}
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.05}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={clsx(
              'fixed z-50 flex flex-col overflow-hidden shadow-2xl border border-[var(--border-primary)]',
              'bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300',
              // Desktop positioning & dimensions
              'lg:bottom-6 lg:right-6 lg:w-[420px] lg:h-[620px] lg:max-h-[calc(100vh-6rem)] lg:rounded-[var(--radius-2xl)]',
              // Mobile positioning & dimensions (bottom sheet)
              'bottom-0 left-0 right-0 h-[85vh] max-h-[85dvh] rounded-t-[var(--radius-2xl)] lg:rounded-b-[var(--radius-2xl)]',
            )}
          >
            {/* Draggable Header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between px-4 py-3.5 bg-[var(--surface-card)] border-b border-[var(--border-primary)] shrink-0 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2" title="Drag to move panel">
                <GripHorizontal size={16} className="text-[var(--text-tertiary)] shrink-0" />
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--color-primary-600)] to-[var(--color-primary-400)] flex items-center justify-center text-white shadow-xs shrink-0 transition-colors duration-300">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>GetIt Assistant</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/30 uppercase tracking-wide transition-colors duration-300">
                      AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-tertiary)] font-medium flex items-center gap-1">
                    {isProductPage ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Eye size={11} /> Page Sensing Active
                      </span>
                    ) : (
                      <span>Campus discovery • <span className="text-[var(--color-primary-500)] font-semibold">{activeCategory}</span></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--color-error-500)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close assistant"
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin">
              {messages.map((msg) => (
                <AssistantMessage
                  key={msg.id}
                  message={msg}
                  selectedCompareIds={selectedListingsForCompare.map((l) => l._id)}
                  onToggleCompareListing={handleToggleCompareListing}
                  onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
                  onClosePanel={onClose}
                />
              ))}

              {messages.length === 1 && (
                <AssistantSuggestions
                  onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
                />
              )}

              {loading && <AssistantTypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Floating Compare Selection Banner */}
            {selectedListingsForCompare.length > 0 && (
              <div className="px-4 py-2 bg-[var(--color-primary-50)] dark:bg-[var(--surface-elevated)] border-t border-[var(--border-primary)] flex items-center justify-between gap-2 shrink-0 animate-fade-in transition-colors duration-300">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                  <Layers size={15} className="text-[var(--color-primary-500)]" />
                  <span>
                    Selected for compare ({selectedListingsForCompare.length}/4)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedListingsForCompare([])}
                    className="text-xs text-[var(--text-tertiary)] hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={selectedListingsForCompare.length < 2 || loading}
                    onClick={handleTriggerCompareSelected}
                    className="px-3 py-1 rounded-[var(--radius-md)] text-xs font-bold bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] disabled:opacity-50 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                  >
                    <span>Compare ({selectedListingsForCompare.length})</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Input Region */}
            <div className="p-3 bg-[var(--surface-card)] border-t border-[var(--border-primary)] shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              {/* Image Preview Thumbnail */}
              {selectedImage && (
                <div className="relative inline-block mb-2 group">
                  <img
                    src={selectedImage}
                    alt="Upload preview"
                    className="w-14 h-14 object-cover rounded-[var(--radius-md)] border border-[var(--color-primary-500)]/40 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    title="Remove photo"
                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="relative flex items-end gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-2 focus-within:ring-2 focus-within:ring-[var(--color-primary-500)]/30 focus-within:border-[var(--color-primary-500)] transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 1000))}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedImage
                      ? 'Add an optional query or press send...'
                      : isProductPage
                        ? 'Ask about this product (e.g. Is it negotiable?)...'
                        : `Ask GetIt in ${activeCategory}...`
                  }
                  rows={1}
                  maxLength={1000}
                  className="w-full bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 max-h-24 px-1 py-1 scrollbar-none"
                  style={{ outline: 'none' }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload photo for Reverse Image Search"
                  className="p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--color-primary-500)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  <ImagePlus size={16} />
                </button>

                <button
                  type="button"
                  disabled={(!input.trim() && !selectedImage) || loading}
                  onClick={() => handleSendMessage()}
                  aria-label="Send message"
                  className={clsx(
                    'p-2 rounded-full text-white transition-all cursor-pointer shrink-0 shadow-xs',
                    (input.trim() || selectedImage) && !loading
                      ? 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] scale-100'
                      : 'bg-gray-400/40 text-gray-200 cursor-not-allowed scale-95',
                  )}
                >
                  <Send size={15} />
                </button>
              </div>

              <div className="flex items-center justify-between px-1 mt-1 text-[10px] text-[var(--text-tertiary)]">
                <span>Shift+Enter for line break</span>
                <span>{input.length}/1000</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
