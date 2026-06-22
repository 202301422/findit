import { Routes, Route, Navigate } from 'react-router-dom'

import Login from '../pages/Login/Login'
import Home from '../pages/Home/Home'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Login />} />
      <Route path="/forgot-password" element={<Login />} />
      <Route path="/verify-email" element={<Login />} />
      <Route path="/reset-sent" element={<Login />} />

      {/* App routes */}
      <Route path="/home" element={<Home />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}