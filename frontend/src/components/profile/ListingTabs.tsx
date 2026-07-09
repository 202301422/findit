import type { ListingCategory } from '../../types/profile.types';

interface ListingTabsProps {
  categories: ListingCategory[];
  activeCategory: ListingCategory;
  onTabChange: (category: ListingCategory) => void;
}

export default function ListingTabs({ categories, activeCategory, onTabChange }: ListingTabsProps) {
  return (
    <div className="listing-tabs">
      {categories.map((category) => (
        <button
          key={category}
          className={`tab-btn ${activeCategory === category ? 'active' : ''}`}
          onClick={() => onTabChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
