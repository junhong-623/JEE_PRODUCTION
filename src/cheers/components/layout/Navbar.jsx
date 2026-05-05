import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import LanguageToggle from '../ui/LanguageToggle'

const ACCOUNT_ITEMS = [
  { tab: 'profile',  zh: '个人资料', en: 'Profile',   icon: '👤' },
  { tab: 'address',  zh: '收货地址', en: 'Address',   icon: '📍' },
  { tab: 'orders',   zh: '我的订单', en: 'My Orders', icon: '📦' },
  { tab: 'coupons',  zh: '优惠券',   en: 'Coupons',  icon: '🎫' },
  { tab: 'wishlist', zh: '收藏清单', en: 'Wishlist',  icon: '♡' },
]

export default function Navbar() {
  const { t, lang } = useLang()
  const { user, isAdmin, logout } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    if (!accountOpen) return
    function handleClick(e) {
      if (!accountRef.current?.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [accountOpen])

  async function handleLogout() {
    await logout()
    navigate('/')
    setMenuOpen(false)
    setAccountOpen(false)
  }

  const navLinkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? 'text-cheers-brown font-semibold' : 'text-cheers-dark-brown/70 hover:text-cheers-brown'}`

  const mobileNavLinkClass = ({ isActive }) =>
    `block text-sm py-1 transition-colors ${isActive ? 'text-cheers-brown font-semibold' : 'text-cheers-dark-brown/70 hover:text-cheers-brown'}`

  return (
    <nav className="sticky top-0 z-40 bg-cheers-light-cream/95 backdrop-blur-md border-b border-cheers-cream shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMenuOpen(false)}>
          <img src="/logo-300.png" alt="Cheers.co" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-xs text-cheers-brown/50 hidden sm:block">🇯🇵</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/products" className={navLinkClass}>{t('nav.products')}</NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) =>
              `text-sm px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown text-cheers-brown hover:bg-cheers-brown hover:text-cheers-cream'}`
            }>{t('nav.admin')}</NavLink>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <LanguageToggle />

          <Link to="/cart" className="relative text-cheers-brown hover:text-cheers-dark-brown transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3a1 1 0 00.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cheers-brown text-cheers-cream text-[10px] rounded-full flex items-center justify-center font-medium">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {user ? (
            /* Account dropdown */
            <div className="hidden md:block relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(o => !o)}
                className="flex items-center gap-1 text-sm text-cheers-brown/70 hover:text-cheers-brown transition-colors"
              >
                {t('nav.account')}
                <svg className={`w-3.5 h-3.5 transition-transform ${accountOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-cheers-cream/60 py-1 z-50">
                  {ACCOUNT_ITEMS.map(item => (
                    <Link key={item.tab}
                      to={`/account?tab=${item.tab}`}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-cheers-dark-brown/70 hover:bg-cheers-cream/30 hover:text-cheers-brown transition-colors">
                      <span className="text-base">{item.icon}</span>
                      {lang === 'zh' ? item.zh : item.en}
                    </Link>
                  ))}
                  <div className="border-t border-cheers-cream my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-50 transition-colors">
                    <span className="text-base">🚪</span>
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm py-1">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary text-sm py-1">{t('nav.register')}</Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button className="md:hidden text-cheers-brown" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-cheers-cream bg-cheers-light-cream px-4 py-4 flex flex-col gap-1">
          <NavLink to="/products" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>{t('nav.products')}</NavLink>
          {isAdmin && <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>{t('nav.admin')}</NavLink>}

          {user ? (
            <div className="pt-2 border-t border-cheers-cream flex flex-col gap-0.5 mt-1">
              <p className="text-[10px] uppercase tracking-widest text-cheers-brown/40 mb-1">{t('nav.account')}</p>
              {ACCOUNT_ITEMS.map(item => (
                <Link key={item.tab} to={`/account?tab=${item.tab}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm py-1 text-cheers-dark-brown/70 hover:text-cheers-brown">
                  <span>{item.icon}</span>
                  {lang === 'zh' ? item.zh : item.en}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm py-1 text-red-400 mt-1">
                <span>🚪</span>{t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-cheers-cream flex flex-col gap-2 mt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm text-center">{t('nav.login')}</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">{t('nav.register')}</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
