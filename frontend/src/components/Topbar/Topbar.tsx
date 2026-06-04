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
                <button className="pill" onClick={() => setCatsOpen((s) => !s)} aria-expanded={catsOpen}>Any Categories ▾</button>
                {catsOpen && (
                  <ul className="menu">
                    <li onClick={() => { setCatsOpen(false); alert('Category: Electronics') }}>Electronics</li>
                    <li onClick={() => { setCatsOpen(false); alert('Category: Fashion') }}>Fashion</li>
                    <li onClick={() => { setCatsOpen(false); alert('Category: Books') }}>Books</li>
                  </ul>
                )}
              </div>
              <div className="dropdown">
                <button className="pill" onClick={() => setPriceOpen((s) => !s)} aria-expanded={priceOpen}>Any Price ▾</button>
                {priceOpen && (
                  <ul className="menu">
                    <li onClick={() => { setPriceOpen(false); alert('Price: Any') }}>Any</li>
                    <li onClick={() => { setPriceOpen(false); alert('Price: 0-50') }}>0 - 50</li>
                    <li onClick={() => { setPriceOpen(false); alert('Price: 50-200') }}>50 - 200</li>
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