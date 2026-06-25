type SidebarProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  selected: string
  handleNav: (section: string) => void
  handleHelp: () => void
  handleLogout: () => void
}

export default function Sidebar({
  open,
  setOpen,
  selected,
  handleNav,
  handleHelp,
  handleLogout,
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
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
          <button className="nav-item help" onClick={handleHelp}>
             <span className="nav-icon" >❓</span>
             <span className="label">Help / FAQs</span>
          </button>
          <button className="nav-item help nav-item--logout" onClick={handleLogout}>
             <span className="nav-icon" aria-hidden="true">
               <LogoutIcon />
             </span>
             <span className="label">Log Out</span>
          </button>
        </div>
      </aside>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}