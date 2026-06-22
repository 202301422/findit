import { useState } from 'react'

type TopbarProps = {
  catsOpen: boolean
  priceOpen: boolean
  setCatsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setPriceOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleAddItem: () => void
  handleNotif: () => void
  handleProfile: () => void
}

export default function Topbar({
  catsOpen,
  priceOpen,
  setCatsOpen,
  setPriceOpen,
  handleAddItem,
  handleNotif,
  handleProfile,
}: TopbarProps) {
  const [selectedCategory, setSelectedCategory] = useState('Any Categories')
  const [selectedPrice, setSelectedPrice] = useState('Any Price')

  function handleCategorySelect(category: string) {
    setSelectedCategory(category)
    setCatsOpen(false)
  }

  function handlePriceSelect(price: string) {
    setSelectedPrice(price)
    setPriceOpen(false)
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
              <div className="dropdown">
                <button className="pill" onClick={() => setCatsOpen((s) => !s)} aria-expanded={catsOpen}>{selectedCategory} ▾</button>
                {catsOpen && (
                  <ul className="menu">
                    <li onClick={() => handleCategorySelect('Electronics')}>Electronics</li>
                    <li onClick={() => handleCategorySelect('Fashion')}>Fashion</li>
                    <li onClick={() => handleCategorySelect('Books')}>Books</li>
                  </ul>
                )}
              </div>
              <div className="dropdown">
                <button className="pill" onClick={() => setPriceOpen((s) => !s)} aria-expanded={priceOpen}>{selectedPrice} ▾</button>
                {priceOpen && (
                  <ul className="menu">
                    <li onClick={() => handlePriceSelect('Any')}>Any</li>
                    <li onClick={() => handlePriceSelect('0 - 50')}>0 - 50</li>
                    <li onClick={() => handlePriceSelect('50 - 200')}>50 - 200</li>
                  </ul>
                )}
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