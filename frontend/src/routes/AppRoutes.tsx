import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import AuthRoute from '../components/AuthRoute'
import ProtectedRoute from '../components/ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'

/* ── Lazy-loaded pages ── */
const Login = lazy(() => import('../pages/Login/Login'))
const Home = lazy(() => import('../pages/Home/Home'))
const AddItem = lazy(() => import('../pages/AddItem/AddItem'))
const Profile = lazy(() => import('../pages/Profile/Profile'))
const ProductDetail = lazy(() => import('../pages/ProductDetail/ProductDetail'))
const Messages = lazy(() => import('../pages/Messages/Messages'))
const ChatDetail = lazy(() => import('../pages/Messages/ChatDetail'))

/* ── Loading fallback ── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
      </div>
    </div>
  )
}

/* ── Wrap page with AppLayout ── */
function AppPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </AppLayout>
    </ProtectedRoute>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signin" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/verify-email" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/reset-sent" element={<AuthRoute><Login /></AuthRoute>} />

        {/* App routes — wrapped in AppLayout */}
        <Route path="/home" element={<AppPage><Home /></AppPage>} />
        <Route path="/add-item" element={<AppPage><AddItem /></AppPage>} />
        <Route path="/profile" element={<AppPage><Profile /></AppPage>} />
        <Route path="/product/:id" element={<AppPage><ProductDetail /></AppPage>} />
        <Route path="/messages" element={<AppPage><Messages /></AppPage>} />
        <Route path="/messages/:id" element={<AppPage><ChatDetail /></AppPage>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}