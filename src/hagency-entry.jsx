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
      <div className="flex min-h-screen items-center justify-center bg-[#120c10] px-6 text-[#e8bdc8]">
        <div className="text-center">
          <p className="font-display text-5xl italic leading-none tracking-[-0.03em] text-[#efd3da] sm:text-6xl">ℋ Agency</p>
          <p className="mt-4 font-mono text-[10px] tracking-[0.42em] text-[#b98595]">希望公会</p>
          <span className="mx-auto mt-7 block h-px w-14 overflow-hidden bg-white/10"><span className="block h-full w-full animate-pulse bg-[#c47a90]" /></span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/admin/login" element={admin ? <Navigate to={`/admin${window.location.search}`} replace /> : <HAgencyLogin />} />
      <Route path="/admin" element={admin ? <HAgencyAdmin /> : <Navigate to={`/admin/login${window.location.search}`} replace />} />
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
