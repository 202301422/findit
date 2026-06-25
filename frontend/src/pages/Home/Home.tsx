import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

import '../../styles/variables.css'
import '../../styles/sidebar.css'
import '../../styles/topbar.css'
import '../../styles/home.css'

import Sidebar from '../../components/Sidebar/Sidebar'
import Topbar from '../../components/Topbar/Topbar'

export default function Home() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('Buy & Sell')
  const [catsOpen, setCatsOpen] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleNav(section: string) {
    setSelected(section)
    // TODO: navigate to section-specific route when implemented
  }

  function handleAddItem() {
    // TODO: navigate to add-item page when implemented
    navigate('/add-item')
  }

  function handleNotif() {
    // TODO: navigate to notifications page when implemented
    navigate('/notifications')
  }

  function handleProfile() {
    // TODO: navigate to profile page when implemented
    navigate('/profile')
  }

  function handleHelp() {
    // TODO: navigate to help/FAQ page when implemented
    navigate('/help')
  }

  async function handleLogout() {
    await logout()
    navigate('/signin')
  }

  return (
    <div className="site-root">
      <Sidebar
        open={open}
        setOpen={setOpen}
        selected={selected}
        handleNav={handleNav}
        handleHelp={handleHelp}
        handleLogout={handleLogout}
      />

      <div className="main">
        <Topbar
          catsOpen={catsOpen}
          setCatsOpen={setCatsOpen}
          handleAddItem={handleAddItem}
          handleNotif={handleNotif}
          handleProfile={handleProfile}
        />

        <main className="content">
          <div className="cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <button
                key={i}
                className="product-card"
                onClick={() => navigate(`/product/${i + 1}`)}
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