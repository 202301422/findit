import { useState } from 'react'

type TopbarProps = {
  catsOpen: boolean
  setCatsOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleAddItem: () => void
  handleNotif: () => void
  handleProfile: () => void
}

export default function Topbar({
  catsOpen,
  setCatsOpen,
  handleAddItem,
  handleNotif,
  handleProfile,
}: TopbarProps) {
  const [selectedCategory, setSelectedCategory] = useState('Any Categories')
  const [maxPrice, setMaxPrice] = useState(0)

  function handleCategorySelect(category: string) {
    setSelectedCategory(category)
    setCatsOpen(false)
  }

  function handleMaxPriceChange(value: number) {
    setMaxPrice(value)
  }

  function formatMaxPriceLabel(value: number) {
    if (value === 0) return 'Any'
    return `≤ $${value}`
  }

  return (
    <header className="topbar">
          <div className="brand">Findit</div>
          <div className="search-row">
            <div className="search">
              <span className="magnifier">🔎</span>
              <input placeholder="Search Products . . ." />
            </div>
            <div className="filters">
              <div className="dropdown dropdown--category">
                <button className="pill pill--fixed" onClick={() => setCatsOpen((s) => !s)} aria-expanded={catsOpen}>{selectedCategory} ▾</button>
                {catsOpen && (
                  <ul className="menu">
                    <li onClick={() => handleCategorySelect('Electronics')}>Electronics</li>
                    <li onClick={() => handleCategorySelect('Fashion')}>Fashion</li>
                    <li onClick={() => handleCategorySelect('Books')}>Books</li>
                  </ul>
                )}
              </div>
              <div className="price-shell" aria-label="Maximum price filter">
                <input
                  className="price-slider"
                  type="range"
                  min="0"
                  max="500"
                  step="25"
                  value={maxPrice}
                  onChange={(event) => handleMaxPriceChange(Number(event.target.value))}
                  aria-label="Maximum price"
                  aria-valuemin={0}
                  aria-valuemax={500}
                  aria-valuenow={maxPrice}
                  aria-valuetext={formatMaxPriceLabel(maxPrice)}
                />
                <strong className="price-shell__value">{formatMaxPriceLabel(maxPrice)}</strong>
              </div>
            </div>
          </div>
          <div className="top-actions">
            <button className="add" onClick={handleAddItem}><span className="add-icon">＋</span> Add Item</button>
            <div className="notif">
              <button className="notif-btn" aria-label="Notifications" onClick={handleNotif}>🔔</button>
              <span className="badge">3</span>
            </div>
            <button className="avatar" aria-label="Account" onClick={handleProfile}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#ff7f3f"/>
                <path d="M4 20c0-3.313 2.687-6 6-6h4c3.313 0 6 2.687 6 6v1H4v-1z" fill="#ff9b5c"/>
              </svg>
            </button>
          </div>
        </header>
  )
}