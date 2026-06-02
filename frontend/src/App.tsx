import { useState } from 'react'
import './App.css'

function App() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('Buy & Sell')
  const [catsOpen, setCatsOpen] = useState(false)
  const [priceOpen, setPriceOpen] = useState(false)

  function handleNav(section: string) {
    setSelected(section)
    // placeholder: navigate or filter
    // eslint-disable-next-line no-console
    console.log('navigate to', section)
  }

  function handleAddItem() {
    alert('Add item clicked')
  }

  function handleNotif() {
    alert('Notifications clicked')
  }

  function handleProfile() {
    alert('Profile clicked')
  }

  function handleHelp() {
    alert('Help / FAQs')
  }

  return (
    <div className="site-root">
      <aside className={`sidebar ${open ? 'expanded' : 'collapsed'}`}>
        <button className="sb-btn" onClick={() => setOpen((s) => !s)} aria-label="Toggle sidebar">☰</button>
        <nav className="nav-list">
          <button className={`nav-item ${selected === 'Buy & Sell' ? 'active' : ''}`} onClick={() => handleNav('Buy & Sell')}>
            <span className="nav-icon">👜</span>
            <span className="label">Buy & Sell</span>
          </button>
          <button className={`nav-item ${selected === 'Lost & Found' ? 'active' : ''}`} onClick={() => handleNav('Lost & Found')}>
            <span className="nav-icon">🔍</span>
            <span className="label">Lost & Found</span>
          </button>
          <button className={`nav-item ${selected === 'Travelling Tickets' ? 'active' : ''}`} onClick={() => handleNav('Travelling Tickets')}>
            <span className="nav-icon">🏠</span>
            <span className="label">Travelling Tickets</span>
          </button>
          <button className={`nav-item ${selected === 'Event Passes' ? 'active' : ''}`} onClick={() => handleNav('Event Passes')}>
            <span className="nav-icon">🎟️</span>
            <span className="label">Event Passes</span>
          </button>
        </nav>
        <button className="nav-item help" onClick={handleHelp}>
           <span className="nav-icon" >❓</span>
           <span className="label">Help / FAQs</span>
        </button>
      </aside>

      <div className="main">
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

        <main className="content">
          <div className="cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <button
                key={i}
                className="product-card"
                onClick={() => openProduct(i)}
                aria-label={`Open product ${i + 1}`}
              >
                <div className="image" />
                <div className="meta">
                  <div className="title">Product {i + 1}</div>
                  <div className="price">$—</div>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

function openProduct(index: number) {
  // Placeholder behavior: replace with navigation or modal later
  // eslint-disable-next-line no-alert
  alert(`Open product ${index + 1}`)
}
