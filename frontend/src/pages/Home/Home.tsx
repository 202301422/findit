import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'

import '../../styles/variables.css'
import '../../styles/sidebar.css'
import '../../styles/topbar.css'
import '../../styles/home.css'

import Sidebar from '../../components/Sidebar/Sidebar'
import Topbar from '../../components/Topbar/Topbar'

export default function Home() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(
    () => sessionStorage.getItem('home_tab') || 'Buy & Sell'
  )
  const [catsOpen, setCatsOpen] = useState(false)
  
  // LIFTED FILTER STATE
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState(0)

  // DATA STATE
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { logout } = useAuth()

  const getBackendType = (tab: string) => {
    switch (tab) {
      case 'Buy & Sell': return 'sell';
      case 'Lost & Found': return 'found';
      case 'Travelling Tickets': return 'ticket';
      case 'Event Passes': return 'pass';
      default: return 'sell';
    }
  }

  // EFFECT 1: Handle Tab Switching (Reset UI & Fetch new Categories)
  useEffect(() => {
    // Forcefully reset the filters and UI states when moving to a new page
    setSelectedCategory('');
    setMaxPrice(0);
    setCatsOpen(false);
    setItems([]); 

    const fetchCategories = async () => {
      try {
        const type = getBackendType(selected);
        const response = await api.get(`/feed/categories?type=${type}`);
        if (response.data.success) {
          setCategories(response.data.data.categories);
        }
      } catch (error) {
        console.error(`Failed to fetch categories for ${selected}:`, error);
      }
    };

    fetchCategories();
  }, [selected]); 

  // EFFECT 2: Fetch the actual Feed Items (Triggers on Tab, Category, or Price change)
  useEffect(() => {
    const fetchFeedData = async () => {
      setLoading(true);
      try {
        const type = getBackendType(selected);
        
        // Build the dynamic URL query parameters
        let url = `/feed/list?type=${type}`;
        if (selectedCategory) url += `&category=${selectedCategory}`;
        if (maxPrice > 0) url += `&maxPrice=${maxPrice}`;

        const response = await api.get(url);
        
        if (response.data.success) {
          setItems(response.data.data.items);
        }
      } catch (error) {
        console.error(`Failed to fetch ${selected} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch by 300ms. This prevents the frontend from spamming 
    // the backend with 100 API calls if the user slides the price slider quickly.
    const timeoutId = setTimeout(() => {
      fetchFeedData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selected, selectedCategory, maxPrice]);

  function handleNav(section: string) {
    sessionStorage.setItem('home_tab', section)
    setSelected(section)
  }

  return (
    <div className="site-root">
      <Sidebar
        open={open}
        setOpen={setOpen}
        selected={selected}
        handleNav={handleNav}
        handleHelp={() => navigate('/help')}
        handleLogout={async () => {
          await logout();
          navigate('/signin');
        }}
      />

      <div className="main">
        <Topbar
          catsOpen={catsOpen}
          setCatsOpen={setCatsOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          handleAddItem={() => navigate('/add-item')}
          handleNotif={() => navigate('/notifications')}
          handleProfile={() => navigate('/profile')}
        />

        <main className="content">
          <div className="cards">
            {loading ? (
              <div className="empty-state">Loading {selected}...</div>
            ) : items.length === 0 ? (
              // Enhanced Empty State Applied Here
              <div className="empty-state">
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
                No items found for {selected}.
              </div>
            ) : (
              items.map((item) => {
                const primaryImageUrl = item.images?.[0]?.url || item.imageUrl

                // Emoji placeholder per type when no image exists
                const placeholderIcon =
                  selected === 'Travelling Tickets'
                    ? (item.ticketType === 'Bus' ? '🚌' : item.ticketType === 'Train' ? '🚆' : '✈️')
                    : selected === 'Event Passes' ? '🎟️'
                    : selected === 'Lost & Found' ? '🔍'
                    : '📦'

                return (
                <button
                  key={item._id}
                  className="product-card"
                  onClick={() => navigate(`/product/${item._id}?type=${getBackendType(selected)}`)}
                >
                  <div className="image">
                    {primaryImageUrl ? (
                      <img
                        src={primaryImageUrl}
                        alt={item.name || item.ticketType || 'Item'}
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', borderRadius:'inherit' }}
                        onError={(e) => {
                          // Hide broken image and show placeholder instead
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent && !parent.querySelector('.img-placeholder')) {
                            const ph = document.createElement('div')
                            ph.className = 'img-placeholder'
                            ph.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:linear-gradient(135deg,#fff3ee,#ffe5d5);border-radius:inherit;'
                            ph.textContent = placeholderIcon
                            parent.appendChild(ph)
                          }
                        }}
                      />
                    ) : (
                      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', background:'linear-gradient(135deg,#fff3ee,#ffe5d5)', borderRadius:'inherit' }}>
                        {placeholderIcon}
                      </div>
                    )}
                  </div>
                  <div className="meta">
                    <div className="title">
                      {item.name ||
                        (item.origin?.city && item.destination?.city
                          ? `${item.origin.city} → ${item.destination.city}`
                          : item.ticketType)}
                    </div>
                    
                    {/* Hides the price box entirely for Lost & Found items */}
                    {selected !== 'Lost & Found' && (
                      <div className="price">
                        {item.sellingPrice ? `₹${item.sellingPrice}` : item.price ? `₹${item.price}` : '—'}
                      </div>
                    )}
                  </div>
                </button>
                )
              })
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
