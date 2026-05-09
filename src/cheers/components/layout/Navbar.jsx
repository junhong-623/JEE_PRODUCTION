import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import LanguageToggle from '../ui/LanguageToggle'
import SearchOverlay from '../ui/SearchOverlay'

const db = getFirestore(app)

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
  const [mobileCatOpen, setMobileCatOpen] = useState(null)
  const [categories, setCategories] = useState([])
  const [hidden, setHidden] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Load categories for active trip
  useEffect(() => {
    async function loadCats() {
      try {
        const settingsSnap = await getDoc(doc(db, 'cheers_settings', 'global'))
        const activeTripId = settingsSnap.data()?.activeTripId
        if (!activeTripId) return
        const catsSnap = await getDocs(query(collection(db, 'cheers_categories'), orderBy('order')))
        setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.tripId === activeTripId))
      } catch {}
    }
    loadCats()
  }, [])

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY
    function onScroll() {
      const y = window.scrollY
      if (y < 10) setHidden(false)
      else if (y > lastY + 4) setHidden(true)
      else if (y < lastY - 4) setHidden(false)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change (via menuOpen toggling)
  function closeMenu() { setMenuOpen(false); setMobileCatOpen(null) }

  async function handleLogout() {
    await logout()
    navigate('/')
    closeMenu()
  }

  const rootCats = categories.filter(c => !c.parentId)
  function getChildren(parentId) { return categories.filter(c => c.parentId === parentId) }
  function catName(cat) { return cat.name?.[lang] || cat.name?.zh || cat.name?.en || '' }

  return (
    <>
      <nav className={`sticky top-0 z-40 bg-cheers-light-cream/95 backdrop-blur-md border-b border-cheers-cream shadow-sm transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center relative">

          {/* Left: Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="text-cheers-brown hover:text-cheers-dark-brown transition-colors flex-shrink-0"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>

          {/* Center: Brand name (absolutely centered) */}
          <Link
            to="/"
            onClick={closeMenu}
            className="absolute left-1/2 -translate-x-1/2 font-serif text-xl text-cheers-dark-brown tracking-wide hover:text-cheers-brown transition-colors whitespace-nowrap"
          >
            Cheers.co
          </Link>

          {/* Right: Search + Cart */}
          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-cheers-brown hover:text-cheers-dark-brown transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </button>

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
          </div>
        </div>

        {/* Drawer menu */}
        {menuOpen && (
          <div className="border-t border-cheers-cream bg-cheers-light-cream px-5 py-4 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">

            {/* Categories */}
            {rootCats.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-widest text-cheers-brown/40 mb-1.5">
                  {lang === 'zh' ? '商品分类' : 'Categories'}
                </p>
                {rootCats.map(cat => {
                  const children = getChildren(cat.id)
                  const isOpen = mobileCatOpen === cat.id
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center">
                        <Link to={`/products?category=${cat.id}`} onClick={closeMenu}
                          className="flex-1 text-sm py-1 text-cheers-dark-brown/80 hover:text-cheers-brown font-medium">
                          {catName(cat)}
                        </Link>
                        {children.length > 0 && (
                          <button onClick={() => setMobileCatOpen(o => o === cat.id ? null : cat.id)}
                            className="px-2 py-1 text-cheers-brown/40 hover:text-cheers-brown text-[10px]">
                            {isOpen ? '▲' : '▼'}
                          </button>
                        )}
                      </div>
                      {isOpen && (
                        <div className="ml-3 border-l border-cheers-cream pl-3 mb-1 space-y-0.5">
                          {children.map(child => (
                            <Link key={child.id} to={`/products?category=${child.id}`}
                              onClick={closeMenu}
                              className="block text-xs py-0.5 text-cheers-dark-brown/60 hover:text-cheers-brown">
                              {catName(child)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                <div className="border-t border-cheers-cream mt-2 mb-2" />
              </div>
            )}

            <NavLink to="/products" onClick={closeMenu}
              className={({ isActive }) => `block text-sm py-1 transition-colors ${isActive ? 'text-cheers-brown font-semibold' : 'text-cheers-dark-brown/70 hover:text-cheers-brown'}`}>
              {t('nav.products')}
            </NavLink>

            {isAdmin && (
              <NavLink to="/admin" onClick={closeMenu}
                className={({ isActive }) => `block text-sm py-1 transition-colors ${isActive ? 'text-cheers-brown font-semibold' : 'text-cheers-dark-brown/70 hover:text-cheers-brown'}`}>
                {t('nav.admin')}
              </NavLink>
            )}

            {/* Account */}
            {user ? (
              <div className="pt-2 border-t border-cheers-cream flex flex-col gap-0.5 mt-1">
                <p className="text-[10px] uppercase tracking-widest text-cheers-brown/40 mb-1">{t('nav.account')}</p>
                {ACCOUNT_ITEMS.map(item => (
                  <Link key={item.tab} to={`/account?tab=${item.tab}`} onClick={closeMenu}
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
                <Link to="/login" onClick={closeMenu} className="btn-secondary text-sm text-center">{t('nav.login')}</Link>
                <Link to="/register" onClick={closeMenu} className="btn-primary text-sm text-center">{t('nav.register')}</Link>
              </div>
            )}

            {/* Language toggle */}
            <div className="pt-3 border-t border-cheers-cream mt-2 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-cheers-brown/40">
                {lang === 'zh' ? '语言' : 'Language'}
              </span>
              <LanguageToggle />
            </div>
          </div>
        )}
      </nav>

      {/* Search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}
