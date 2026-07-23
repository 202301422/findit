import { type ReactNode, type RefObject } from 'react'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

interface ProductGridProps {
  items: any[]
  type: string
  tabLabel: string
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  sentinelRef?: RefObject<HTMLDivElement | null>
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
}

export default function ProductGrid({
  items,
  type,
  tabLabel,
  loading,
  loadingMore = false,
  hasMore = false,
  sentinelRef,
  emptyIcon,
  emptyTitle = 'No items found',
  emptyDescription = 'Try adjusting your filters or check back later.',
  emptyAction,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon || '📦'}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {items.map((item) => (
          <motion.div key={item._id} variants={itemVariants}>
            <ProductCard item={item} type={type} tabLabel={tabLabel} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Infinite Scroll Sentinel + Loading More ── */}
      {sentinelRef && (
        <div ref={sentinelRef} className="mt-4" />
      )}

      {loadingMore && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`more-${i}`} />
          ))}
        </div>
      )}

      {!hasMore && !loading && items.length > 0 && sentinelRef && (
        <p className="text-center text-xs text-[var(--text-tertiary)] font-medium mt-6 pb-2">
          ✓ All items loaded
        </p>
      )}
    </div>
  )
}
