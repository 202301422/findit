import { type ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import MobileNav from './MobileNav'
import EmergencyBanner from '../notifications/EmergencyBanner'
import EmergencyModal from '../notifications/EmergencyModal'

interface AppLayoutProps {
  children: ReactNode
}

function getActiveCategory(pathname: string, search: string): string {
  // If we are on Home page, fetch the selected tab category
  if (pathname === '/home') {
    return sessionStorage.getItem('home_tab') || 'Buy & Sell'
  }
  
  // If we are on Product Detail page, check the URL query type parameter
  if (pathname.startsWith('/product/')) {
    const params = new URLSearchParams(search)
    const type = params.get('type')
    if (type === 'found') return 'Lost & Found'
    if (type === 'pass') return 'Event Passes'
    if (type === 'ticket') return 'Travelling Tickets'
    if (type === 'sell') return 'Buy & Sell'
  }
  
  // Default fallback to session storage tab
  return sessionStorage.getItem('home_tab') || 'Buy & Sell'
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  useEffect(() => {
    const updateThemeAttr = () => {
      const category = getActiveCategory(location.pathname, location.search)
      document.documentElement.setAttribute('data-theme-category', category)
    }

    // Set theme attribute on mount and on route changes
    updateThemeAttr()

    // Listen to local storage / session storage change events to update color instantly
    window.addEventListener('storage', updateThemeAttr)

    return () => {
      window.removeEventListener('storage', updateThemeAttr)
    }
  }, [location.pathname, location.search])

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--bg-secondary)]">
      <EmergencyBanner />
      <EmergencyModal />
      <Navbar />

      {/* Main content area — below navbar, above mobile nav */}
      <main className="pt-16 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
