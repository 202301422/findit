import { useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X, ImageOff } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

interface ProductImage {
  url: string
  publicId: string
}

interface ImageGalleryProps {
  images?: ProductImage[]
  isSold?: boolean
  soldLabel?: string
  singleUrl?: string
}

export default function ImageGallery({ images, isSold, soldLabel = 'Sold', singleUrl }: ImageGalleryProps) {
  const allImages: ProductImage[] =
    images && images.length > 0
      ? images
      : singleUrl
      ? [{ url: singleUrl, publicId: 'single' }]
      : []

  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIdx((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  if (allImages.length === 0) {
    return (
      <div className="w-full aspect-[4/3] sm:aspect-[16/10] rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] flex flex-col items-center justify-center text-[var(--text-tertiary)] gap-2">
        <ImageOff className="w-10 h-10 stroke-[1.5]" />
        <span className="text-xs font-medium">No images uploaded</span>
      </div>
    )
  }

  const activeImage = allImages[activeIdx]

  return (
    <div className="space-y-3">
      {/* Main Image View */}
      <div className="relative aspect-[4/3] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] overflow-hidden bg-[var(--bg-tertiary)] group">
        <img
          src={activeImage.url}
          alt={`Product image ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {isSold && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
            <span className="px-5 py-2 rounded-full text-sm font-bold text-white bg-[var(--color-error-500)] tracking-widest uppercase">
              {soldLabel}
            </span>
          </div>
        )}

        {/* Carousel arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-primary)] shadow-md text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-primary)] shadow-md text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Zoom Lightbox Trigger */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--bg-primary)]/80 hover:bg-[var(--bg-primary)] backdrop-blur-md text-[var(--text-primary)] shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Maximize2 size={12} />
          Full View
        </button>

        {/* Bullet Indicator */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all cursor-pointer',
                  idx === activeIdx ? 'bg-[var(--color-primary-500)] w-4' : 'bg-white/60'
                )}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {allImages.map((img, idx) => (
            <button
              key={img.publicId || idx}
              onClick={() => setActiveIdx(idx)}
              className={clsx(
                'relative w-16 h-12 rounded-[var(--radius-sm)] overflow-hidden border shrink-0 transition-all cursor-pointer',
                idx === activeIdx
                  ? 'border-[var(--color-primary-500)] ring-2 ring-[var(--color-primary-500)]/20'
                  : 'border-[var(--border-secondary)] hover:border-[var(--text-tertiary)]'
              )}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / Zoom Dialog Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-8">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              aria-label="Close fullscreen view"
            >
              <X size={24} />
            </button>

            <div className="relative w-full max-w-5xl aspect-video max-h-[85vh] flex items-center justify-center">
              <img
                src={allImages[activeIdx].url}
                alt={`Product image ${activeIdx + 1}`}
                className="max-w-full max-h-full object-contain rounded-md"
              />

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 md:left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer active:scale-95 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 md:right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer active:scale-95 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                    {activeIdx + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
