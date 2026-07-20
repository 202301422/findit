import { useState, useEffect } from 'react'
import { getTotalUnread } from '../../services/chatService'

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
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchUnread = async () => {
      try {
        const count = await getTotalUnread()
        if (!cancelled) setUnreadCount(count)
      } catch {
        // silently ignore — not critical
      }
    }

    fetchUnread()

    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnread, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <aside className={`sidebar ${open ? 'expanded' : 'collapsed'}`}>
        <button className="sb-btn" onClick={() => setOpen((s) => !s)} aria-label="Toggle sidebar">☰</button>
        <nav className="nav-list">
          <button
            className={`nav-item ${selected === 'Buy & Sell' ? 'active' : ''}`}
            onClick={() => handleNav('Buy & Sell')}
            aria-current={selected === 'Buy & Sell' ? 'page' : undefined}
          >
            <span className="nav-icon">👜</span>
            <span className="label">Buy & Sell</span>
          </button>
          <button
            className={`nav-item ${selected === 'Lost & Found' ? 'active' : ''}`}
            onClick={() => handleNav('Lost & Found')}
            aria-current={selected === 'Lost & Found' ? 'page' : undefined}
          >
            <span className="nav-icon">🔍</span>
            <span className="label">Lost & Found</span>
          </button>
          <button
            className={`nav-item ${selected === 'Travelling Tickets' ? 'active' : ''}`}
            onClick={() => handleNav('Travelling Tickets')}
            aria-current={selected === 'Travelling Tickets' ? 'page' : undefined}
          >
            <span className="nav-icon">🏠</span>
            <span className="label">Travelling Tickets</span>
          </button>
          <button
            className={`nav-item ${selected === 'Event Passes' ? 'active' : ''}`}
            onClick={() => handleNav('Event Passes')}
            aria-current={selected === 'Event Passes' ? 'page' : undefined}
          >
            <span className="nav-icon">🎟️</span>
            <span className="label">Event Passes</span>
          </button>

          {/* Messages nav item */}
          <button
            className={`nav-item ${selected === 'Messages' ? 'active' : ''} ${unreadCount > 0 ? 'has-unread-messages' : ''}`}
            onClick={() => handleNav('Messages')}
            aria-current={selected === 'Messages' ? 'page' : undefined}
            style={{ position: 'relative' }}
          >
            <span className={`nav-icon ${unreadCount > 0 ? 'jiggle' : ''}`} style={{ position: 'relative' }}>
              💬
              {unreadCount > 0 && (
                <span
                  className="sb-unread-dot pulse-animation"
                  aria-label={`${unreadCount} unread messages`}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span className="label">Messages</span>
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
      <path d="M10 17l-1.5-1.5L11.17 13H4v-2h7.17L8.5 7.5 10 6l6 6-6 5z" fill="currentColor" />
      <path d="M20 4H13v2h5v12h-5v2h7V4z" fill="currentColor" opacity="0.45" />
    </svg>
  )
}