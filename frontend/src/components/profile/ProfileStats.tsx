import type { ProfileStats as StatsType } from '../../types/profile.types'
import Card from '@/components/ui/Card'
import { FileText, Eye, CheckCircle2, RotateCcw } from 'lucide-react'

export default function ProfileStats({ stats }: { stats: StatsType | null }) {
  const statItems = [
    {
      label: 'Total Listings',
      value: stats?.totalListings || 0,
      icon: FileText,
      color: 'text-[var(--color-primary-500)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-500)]/10',
    },
    {
      label: 'Active Listings',
      value: stats?.activeListings || 0,
      icon: Eye,
      color: 'text-[var(--color-info-600)] bg-[var(--color-info-50)] dark:bg-[var(--color-info-500)]/10',
    },
    {
      label: 'Items Sold',
      value: stats?.soldItems || 0,
      icon: CheckCircle2,
      color: 'text-[var(--color-success-600)] bg-[var(--color-success-50)] dark:bg-[var(--color-success-500)]/10',
    },
    {
      label: 'Lost & Found Claims',
      value: stats?.lostItemsReturned || 0,
      icon: RotateCcw,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} padding="sm" className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 ${item.color}`}>
              <Icon size={18} />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] block leading-none">
                {item.value}
              </span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)] mt-1 block">
                {item.label}
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
