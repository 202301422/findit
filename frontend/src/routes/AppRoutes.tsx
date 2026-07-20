import { Routes, Route, Navigate } from 'react-router-dom'

import Login from '../pages/Login/Login'
import Home from '../pages/Home/Home'
import AddItem from '../pages/AddItem/AddItem'
import Profile from '../pages/Profile/Profile'
import ProductDetail from '../pages/ProductDetail/ProductDetail'
import Messages from '../pages/Messages/Messages'
import ChatDetail from '../pages/Messages/ChatDetail'
import AuthRoute from '../components/AuthRoute'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signin" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/verify-email" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/reset-sent" element={<AuthRoute><Login /></AuthRoute>} />

      {/* App routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/add-item" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/messages/:id" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}