import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMall } from '../contexts/MallContext'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../lib/auth'
import { useMallLang } from '../hooks/useMallLang'
import MallAuthModal from './MallAuthModal'

export default function MallNav({ search, onSearch }) {
  const { config, itemCount, setCartOpen } = useMall()
  const { user } = useAuth()
  const { lang, toggleLang, mt } = useMallLang()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'
  const avatar = user?.photoURL

  async function handleLogout() {
    setUserMenuOpen(false)
    await logout()
  }

  return (
    <>
      <nav className="mall-nav">
        <div className="mall-nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/mall')}>
          <img src="/logo.svg" alt="JeeProd" className="mall-nav-logo" />
          <div>
            <div className="mall-nav-brand-name">{config.storeName || mt('storeName')}</div>
            <div className="mall-nav-brand-sub">{config.tagline || 'jeeprod.com'}</div>
          </div>
        </div>

        {/* Desktop search */}
        {onSearch && (
          <div className="mall-nav-search">
            <span className="mall-nav-search-icon">🔍</span>
            <input
              placeholder={mt('searchPlaceholder')}
              value={search || ''}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        )}

        <div className="mall-nav-spacer" />

        <div className="mall-nav-actions">
          {/* Language toggle */}
          <button
            className="mall-nav-lang-btn"
            onClick={toggleLang}
            title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
          >
            {lang === 'zh' ? 'EN' : '中文'}
          </button>

          {user ? (
            /* Logged-in user menu */
            <div style={{ position:'relative' }}>
              <button
                className="mall-nav-user-btn"
                onClick={() => setUserMenuOpen(o => !o)}
                title={displayName}
              >
                {avatar
                  ? <img src={avatar} alt={displayName} className="mall-nav-avatar" />
                  : <span className="mall-nav-avatar-placeholder">{displayName[0]?.toUpperCase()}</span>}
                <span className="mall-nav-user-name">{displayName}</span>
                <span style={{ fontSize:10,opacity:0.7 }}>▾</span>
              </button>

              {userMenuOpen && (
                <>
                  <div style={{ position:'fixed',inset:0,zIndex:300 }} onClick={() => setUserMenuOpen(false)} />
                  <div className="mall-user-dropdown">
                    <div className="mall-user-dropdown-header">
                      <div style={{ fontWeight:700,fontSize:13,color:'#0d0d0d' }}>{displayName}</div>
                      <div style={{ fontSize:11,color:'#6b6b6b',marginTop:1 }}>{user.email}</div>
                    </div>
                    <button className="mall-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/mall/orders') }}>
                      📦 {mt('myOrders')}
                    </button>
                    <div className="mall-dropdown-divider" />
                    <button className="mall-dropdown-item mall-dropdown-item--danger" onClick={handleLogout}>
                      {lang === 'zh' ? '退出登录' : 'Sign Out'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Sign in button */
            <button className="mall-nav-signin-btn" onClick={() => setAuthOpen(true)}>
              {lang === 'zh' ? '登录' : 'Sign In'}
            </button>
          )}

          {/* Cart */}
          <button className="mall-nav-icon-btn" onClick={() => setCartOpen(true)}>
            🛒
            {itemCount > 0 && <span className="mall-cart-badge">{itemCount}</span>}
          </button>
        </div>
      </nav>

      <MallAuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
