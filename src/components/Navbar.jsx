import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { logout } from '../lib/auth'
import AuthModal from './AuthModal'
import AdminPanel from './AdminPanel'

export default function Navbar() {
  const { dark, toggleDark } = useTheme()
  const { lang, toggleLang, t } = useLang()
  const { user, admin } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminDropOpen, setAdminDropOpen] = useState(false)

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
          <Link
            to="/"
            className="font-mono text-xs uppercase tracking-[0.3em] text-ink/45 transition-colors hover:text-ink dark:text-paper/45 dark:hover:text-paper"
          >
            jeeprod
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper/75 px-2 py-2 shadow-sm backdrop-blur dark:border-paper/10 dark:bg-ink/75">
            <button
              onClick={toggleLang}
              className="w-16 rounded-full px-3 py-1 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink/55 transition-colors hover:bg-ink/6 hover:text-ink dark:text-paper/55 dark:hover:bg-paper/8 dark:hover:text-paper"
              title={t('toggleLanguage')}
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            <button
              onClick={toggleDark}
              className="w-16 rounded-full px-3 py-1 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink/55 transition-colors hover:bg-ink/6 hover:text-ink dark:text-paper/55 dark:hover:bg-paper/8 dark:hover:text-paper"
              title={t('toggleTheme')}
            >
              {dark ? t('lightMode') : t('darkMode')}
            </button>
            {admin && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setAdminDropOpen(v => !v)}
                  className="flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-ink/55 transition-colors hover:bg-ink/6 hover:text-ink dark:text-paper/55 dark:hover:bg-paper/8 dark:hover:text-paper"
                >
                  {t('admin')}
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="currentColor" style={{ opacity: 0.5, marginLeft: 1 }}>
                    <path d="M4 6L0 0h8z"/>
                  </svg>
                </button>
                {adminDropOpen && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      onClick={() => setAdminDropOpen(false)}
                    />
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, minWidth: 156 }}
                      className="overflow-hidden rounded-2xl border border-ink/10 bg-paper/95 py-1 shadow-xl backdrop-blur dark:border-paper/10 dark:bg-ink/95"
                    >
                      <button
                        onClick={() => { setAdminDropOpen(false); setAdminOpen(true) }}
                        className="block w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink dark:text-paper/60 dark:hover:bg-paper/8 dark:hover:text-paper"
                      >
                        Portfolio
                      </button>
                      <button
                        onClick={() => { setAdminDropOpen(false); navigate('/matetrip-admin') }}
                        className="block w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] text-sky-500/75 transition-colors hover:bg-sky-50/60 hover:text-sky-600 dark:text-sky-400/65 dark:hover:bg-sky-950/20 dark:hover:text-sky-400"
                      >
                        MateTrip
                      </button>
                      <button
                        onClick={() => { setAdminDropOpen(false); navigate('/mall/admin') }}
                        className="block w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600/75 transition-colors hover:bg-emerald-50/60 hover:text-emerald-600 dark:text-emerald-400/65 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400"
                      >
                        Mall
                      </button>
                      <button
                        onClick={() => { setAdminDropOpen(false); navigate('/h-agency/admin') }}
                        className="block w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] text-pink-500/75 transition-colors hover:bg-pink-50/60 hover:text-pink-600 dark:text-pink-400/65 dark:hover:bg-pink-950/20 dark:hover:text-pink-400"
                      >
                        ℋ Agency
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {user ? (
              <button
                onClick={logout}
                className="w-20 rounded-full bg-ink px-4 py-1 text-center font-mono text-xs uppercase tracking-[0.2em] text-paper transition-colors hover:bg-accent dark:bg-paper dark:text-ink dark:hover:bg-accent dark:hover:text-paper"
              >
                {t('logout')}
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="w-20 rounded-full bg-ink px-4 py-1 text-center font-mono text-xs uppercase tracking-[0.2em] text-paper transition-colors hover:bg-accent dark:bg-paper dark:text-ink dark:hover:bg-accent dark:hover:text-paper"
              >
                {t('login')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      {admin && <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />}
    </>
  )
}
