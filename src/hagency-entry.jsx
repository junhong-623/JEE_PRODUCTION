import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import HAgencyPublic from './h-agency/HAgencyPublic'
import HAgencyAdmin from './h-agency/HAgencyAdmin'
import HAgencyLogin from './h-agency/HAgencyLogin'
import './index.css'

function HAgencyRoutes() {
  const { admin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#120c10] text-[#e8bdc8]">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em]">ℋ Agency</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/admin/login" element={admin ? <Navigate to="/admin" replace /> : <HAgencyLogin />} />
      <Route path="/admin" element={admin ? <HAgencyAdmin /> : <Navigate to="/admin/login" replace />} />
      <Route path="/h-agency/admin" element={<Navigate to={admin ? '/admin' : '/admin/login'} replace />} />
      <Route path="/h-agency/admin/login" element={<Navigate to={admin ? '/admin' : '/admin/login'} replace />} />
      <Route path="/*" element={<HAgencyPublic />} />
    </Routes>
  )
}

window.addEventListener('vite:preloadError', () => window.location.reload())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <HAgencyRoutes />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
