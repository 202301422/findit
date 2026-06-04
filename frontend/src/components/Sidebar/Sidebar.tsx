type SidebarProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  selected: string
  handleNav: (section: string) => void
  handleHelp: () => void
}

export default function Sidebar({
  open,
  setOpen,
  selected,
  handleNav,
  handleHelp,
}: SidebarProps) {
  return (
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
  )
}