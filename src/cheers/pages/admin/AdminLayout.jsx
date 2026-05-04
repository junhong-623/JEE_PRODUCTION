import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { to: '/admin', label: 'admin.dashboard', icon: '📊', end: true },
  { to: '/admin/trips', label: 'admin.trips', icon: '✈️' },
  { to: '/admin/products', label: 'admin.products', icon: '🛍️' },
  { to: '/admin/categories', label: 'admin.categories', icon: '📂' },
  { to: '/admin/orders', label: 'admin.orders', icon: '📦' },
  { to: '/admin/admins', label: 'admin.admins', icon: '👥' },
  null,
  { to: '/admin/settings/payment', label: 'admin.payment', icon: '💳' },
  { to: '/admin/settings/delivery', label: 'admin.delivery', icon: '🚚' },
  { to: '/admin/settings/contact', label: 'admin.contact', icon: '💬' },
  { to: '/admin/settings/policies', label: 'admin.policies', icon: '📄' },
  { to: '/admin/settings/activity', label: 'admin.activity', icon: '⚡' },
]

export default function AdminLayout() {
  const { t } = useLang()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-cheers-cream text-cheers-brown font-medium'
        : 'text-cheers-cream/70 hover:text-cheers-cream hover:bg-white/10'
    }`

  const Sidebar = () => (
    <aside className="w-56 bg-cheers-dark-brown flex flex-col min-h-full">
      <div className="px-4 py-4 border-b border-white/10">
        <p className="font-serif text-cheers-cream text-base font-medium">Cheers.co</p>
        <p className="text-cheers-cream/40 text-xs mt-0.5">Admin</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item, i) =>
          item === null
            ? <div key={i} className="border-t border-white/10 my-2" />
            : (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setSidebarOpen(false)}>
                <span className="text-sm">{item.icon}</span>
                <span>{t(item.label)}</span>
              </NavLink>
            )
        )}
      </nav>
      <div className="px-3 py-3 border-t border-white/10">
        <button onClick={handleLogout}
          className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-cheers-cream/60 hover:text-cheers-cream rounded-lg hover:bg-white/10 transition-colors">
          <span>🚪</span> {t('nav.logout')}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-cheers-light-cream">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="flex-1 max-w-[224px]"><Sidebar /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-cheers-dark-brown border-b border-white/10">
          <button onClick={() => setSidebarOpen(true)} className="text-cheers-cream">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-serif text-cheers-cream text-sm">Cheers.co Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
