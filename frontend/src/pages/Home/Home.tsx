import { useState } from 'react'

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
  const [priceOpen, setPriceOpen] = useState(false)

  function handleNav(section: string) {
    setSelected(section)
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
      <Sidebar
        open={open}
        setOpen={setOpen}
        selected={selected}
        handleNav={handleNav}
        handleHelp={handleHelp}
      />

      <div className="main">
        <Topbar
          catsOpen={catsOpen}
          priceOpen={priceOpen}
          setCatsOpen={setCatsOpen}
          setPriceOpen={setPriceOpen}
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

function openProduct(index: number) {
  alert(`Open product ${index + 1}`)
}