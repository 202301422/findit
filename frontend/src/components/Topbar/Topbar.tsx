type TopbarProps = {
  catsOpen: boolean
  setCatsOpen: React.Dispatch<React.SetStateAction<boolean>>
  
  // NEW PROPS: Received from Home.tsx
  categories: string[]
  selectedCategory: string
  setSelectedCategory: (val: string) => void
  maxPrice: number
  setMaxPrice: (val: number) => void

  handleAddItem: () => void
  handleNotif: () => void
  handleProfile: () => void
}

export default function Topbar({
  catsOpen,
  setCatsOpen,
  categories,
  selectedCategory,
  setSelectedCategory,
  maxPrice,
  setMaxPrice,
  handleAddItem,
  handleNotif,
  handleProfile,
}: TopbarProps) {
  
  function handleCategorySelect(category: string) {
    setSelectedCategory(category)
    setCatsOpen(false)
  }

  function formatMaxPriceLabel(value: number) {
    if (value === 0) return 'Any'
    // Updated to use Rupees
    return `≤ ₹${value}`
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
            <button className="pill pill--fixed" onClick={() => setCatsOpen((s) => !s)} aria-expanded={catsOpen}>
              {selectedCategory || 'Any Category'} ▾
            </button>
            {catsOpen && (
              <ul className="menu">
                {/* Always provide an option to clear the category filter */}
                <li onClick={() => handleCategorySelect('')}>Any Category</li>
                
                {/* Dynamically render categories fetched from MongoDB */}
                {categories.map((cat) => (
                  <li key={cat} onClick={() => handleCategorySelect(cat)}>
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="price-shell" aria-label="Maximum price filter">
            <input
              className="price-slider"
              type="range"
              min="0"
              max="100000" /* Increased max range for high-value items like iPhones */
              step="1000"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              aria-label="Maximum price"
              aria-valuemin={0}
              aria-valuemax={100000}
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