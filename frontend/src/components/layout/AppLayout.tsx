import { type ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileNav from './MobileNav'
import AssistantLauncher from '../assistant/AssistantLauncher'
import EmergencyBanner from '../notifications/EmergencyBanner'
import EmergencyModal from '../notifications/EmergencyModal'
import ErrorBoundary from '../ErrorBoundary'

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
    <div className="min-h-screen min-h-[100dvh] bg-[var(--bg-secondary)] flex flex-col justify-between">
      {/* Accessible skip link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <EmergencyBanner />
      <EmergencyModal />
      <Navbar />

      {/* Main content area — below navbar, above footer & mobile nav */}
      <main id="main-content" tabIndex={-1} className="pt-16 pb-20 lg:pb-0 focus:outline-none flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      <Footer />
      <MobileNav />
      <AssistantLauncher />
    </div>
  )
}
