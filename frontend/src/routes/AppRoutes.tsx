import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import AuthRoute from '../components/AuthRoute'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminRoute from '../components/AdminRoute'
import AppLayout from '../components/layout/AppLayout'
import AdminLayout from '../components/admin/AdminLayout'

/* ── Lazy-loaded App pages ── */
const Login = lazy(() => import('../pages/Login/Login'))
const Home = lazy(() => import('../pages/Home/Home'))
const AddItem = lazy(() => import('../pages/AddItem/AddItem'))
const Profile = lazy(() => import('../pages/Profile/Profile'))
const UserProfile = lazy(() => import('../pages/Profile/UserProfile'))
const ProductDetail = lazy(() => import('../pages/ProductDetail/ProductDetail'))
const Messages = lazy(() => import('../pages/Messages/Messages'))
const ChatDetail = lazy(() => import('../pages/Messages/ChatDetail'))
const Notifications = lazy(() => import('../pages/Notifications/Notifications'))

/* ── Lazy-loaded Admin pages ── */
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'))
const AdminAnalytics = lazy(() => import('../pages/Admin/AdminAnalytics'))
const AdminUsers = lazy(() => import('../pages/Admin/AdminUsers'))
const AdminMarketplace = lazy(() => import('../pages/Admin/AdminMarketplace'))
const AdminLostFound = lazy(() => import('../pages/Admin/AdminLostFound'))
const AdminPassesTickets = lazy(() => import('../pages/Admin/AdminPassesTickets'))
const AdminReports = lazy(() => import('../pages/Admin/AdminReports'))
const AdminChats = lazy(() => import('../pages/Admin/AdminChats'))
const AdminCategories = lazy(() => import('../pages/Admin/AdminCategories'))
const AdminNotifications = lazy(() => import('../pages/Admin/AdminNotifications'))
const AdminBroadcasts = lazy(() => import('../pages/Admin/AdminBroadcasts'))
const AdminEmergencyAlerts = lazy(() => import('../pages/Admin/AdminEmergencyAlerts'))
const AdminSettings = lazy(() => import('../pages/Admin/AdminSettings'))
const AdminProfile = lazy(() => import('../pages/Admin/AdminProfile'))

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

/* ── Wrap admin page with AdminLayout and AdminRoute guard ── */
function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <AdminLayout>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </AdminLayout>
    </AdminRoute>
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
        <Route path="/user/:id" element={<AppPage><UserProfile /></AppPage>} />
        <Route path="/product/:id" element={<AppPage><ProductDetail /></AppPage>} />
        <Route path="/messages" element={<AppPage><Messages /></AppPage>} />
        <Route path="/messages/:id" element={<AppPage><ChatDetail /></AppPage>} />
        <Route path="/notifications" element={<AppPage><Notifications /></AppPage>} />

        {/* Admin Dashboard routes — Protected by AdminRoute & AdminLayout */}
        <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />
        <Route path="/admin/analytics" element={<AdminPage><AdminAnalytics /></AdminPage>} />
        <Route path="/admin/users" element={<AdminPage><AdminUsers /></AdminPage>} />
        <Route path="/admin/marketplace" element={<AdminPage><AdminMarketplace /></AdminPage>} />
        <Route path="/admin/lost-found" element={<AdminPage><AdminLostFound /></AdminPage>} />
        <Route path="/admin/passes-tickets" element={<AdminPage><AdminPassesTickets /></AdminPage>} />
        <Route path="/admin/reports" element={<AdminPage><AdminReports /></AdminPage>} />
        <Route path="/admin/chats" element={<AdminPage><AdminChats /></AdminPage>} />
        <Route path="/admin/categories" element={<AdminPage><AdminCategories /></AdminPage>} />
        <Route path="/admin/broadcasts" element={<AdminPage><AdminBroadcasts /></AdminPage>} />
        <Route path="/admin/emergency-alerts" element={<AdminPage><AdminEmergencyAlerts /></AdminPage>} />
        <Route path="/admin/notifications" element={<AdminPage><AdminNotifications /></AdminPage>} />
        <Route path="/admin/settings" element={<AdminPage><AdminSettings /></AdminPage>} />
        <Route path="/admin/profile" element={<AdminPage><AdminProfile /></AdminPage>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}