import Tabs from '@/components/ui/Tabs'
import type { ListingCategory } from '../../types/profile.types'

interface ListingTabsProps {
  categories: ListingCategory[]
  activeCategory: ListingCategory
  onTabChange: (category: ListingCategory) => void
}

export default function ListingTabs({ categories, activeCategory, onTabChange }: ListingTabsProps) {
  const tabs = categories.map((cat) => ({ id: cat, label: cat }))

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeCategory}
      onChange={(id) => onTabChange(id as ListingCategory)}
      className="mb-4"
    />
  )
}
