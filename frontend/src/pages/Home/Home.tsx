import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api' // Imports your Axios interceptor setup

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
  
  // NEW: State to hold the dynamic data from MongoDB
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { logout } = useAuth()

  // NEW: Helper function to translate UI tab names into the 'type' our backend expects
  const getBackendType = (tab: string) => {
    switch (tab) {
      case 'Buy & Sell': return 'sell';
      case 'Lost & Found': return 'found';
      case 'Travelling Tickets': return 'ticket';
      case 'Event Passes': return 'pass';
      default: return 'sell';
    }
  }

  // NEW: Fetch data whenever the component loads or the 'selected' tab changes
  // NEW: Fetch data whenever the component loads or the 'selected' tab changes
  useEffect(() => {
    const fetchFeedData = async () => {
      // FIX: Empty the array immediately so previous tab data disappears
      setItems([]); 
      setLoading(true);
      
      try {
        const type = getBackendType(selected);
        const response = await api.get(`/feed/list?type=${type}`);
        
        if (response.data.success) {
          setItems(response.data.data.items);
        }
      } catch (error) {
        // Now if it fails, it will just show an empty page instead of wrong items
        console.error(`Failed to fetch ${selected} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, [selected]);

  function handleNav(section: string) {
    setSelected(section)
  }

  function handleAddItem() {
    navigate('/add-item')
  }

  function handleNotif() {
    navigate('/notifications')
  }

  function handleProfile() {
    navigate('/profile')
  }

  function handleHelp() {
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
            {/* NEW: Dynamic rendering based on loading state and fetched items */}
            {loading ? (
              <div style={{ padding: '2rem', color: '#666' }}>Loading {selected}...</div>
            ) : items.length === 0 ? (
              <div style={{ padding: '2rem', color: '#666' }}>No items found for {selected}.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  className="product-card"
                  // Passes the backend type to the details page URL so it knows what to query later
                  onClick={() => navigate(`/product/${item._id}?type=${getBackendType(selected)}`)}
                  aria-label={`Open ${item.name || item.ticketType}`}
                >
                  <div 
                    className="image" 
                    // Safely handles images, using inline styles for dynamic URL injection
                    style={item.imageUrl ? { 
                      backgroundImage: `url(${item.imageUrl})`, 
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center' 
                    } : {}}
                  />
                  <div className="meta">
                    {/* Handles the difference in schema naming (name vs ticketType) */}
                    <div className="title">{item.name || item.ticketType}</div>
                    
                    {/* Handles the difference in pricing fields (sellingPrice vs price vs None for Lost&Found) */}
                    <div className="price">
                      {item.sellingPrice ? `₹${item.sellingPrice}` : item.price ? `₹${item.price}` : '—'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}