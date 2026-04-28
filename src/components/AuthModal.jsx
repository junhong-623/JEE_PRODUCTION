import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { login, loginWithGoogle, register } from '../lib/auth'

export default function AuthModal({ open, onClose }) {
  const { t } = useLang()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  if (!open) return null

  const reset = (nextMode) => {
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setMode(nextMode)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, name.trim() || undefined)
      } else {
        await login(email, password)
      }
      onClose()
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      onClose()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-[2rem] border border-ink/8 bg-paper shadow-[0_32px_80px_rgba(13,13,13,0.2)] dark:border-paper/8 dark:bg-ink-soft">

        {/* Header */}
        <div className="px-8 pb-5 pt-8 text-center">
          <img src="/logo.svg" alt="Jee Production" className="mx-auto mb-5 w-10 opacity-75" />
          <h2 className="font-display text-2xl">{isLogin ? t('login') : t('register')}</h2>
          <p className="mt-1.5 text-sm leading-6 text-ink/45 dark:text-paper/45">
            {isLogin ? t('loginHint') : t('registerHint')}
          </p>
        </div>

        <div className="px-8 pb-8 space-y-3">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-ink/12 bg-paper px-4 py-3 text-sm font-medium text-ink transition-all hover:bg-paper-soft hover:border-ink/20 disabled:opacity-50 dark:border-paper/12 dark:bg-ink dark:text-paper dark:hover:bg-ink-muted dark:hover:border-paper/20"
          >
            {googleLoading
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink dark:border-paper/20 dark:border-t-paper" />
              : <GoogleIcon />}
            {t('loginWithGoogle')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/8 dark:bg-paper/8" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/28 dark:text-paper/28">
              {t('orContinueWith')}
            </span>
            <div className="h-px flex-1 bg-ink/8 dark:bg-paper/8" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {!isLogin && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('name')}
                className={inputCls}
                autoFocus
              />
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('email')}
              required
              autoFocus={isLogin}
              className={inputCls}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('password')}
              required
              className={inputCls}
            />

            {error && (
              <p className="rounded-xl bg-accent/8 px-4 py-2.5 text-xs leading-5 text-accent">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-50 dark:bg-paper dark:text-ink dark:hover:bg-accent dark:hover:text-paper"
            >
              {loading ? t('loading') : (isLogin ? t('login') : t('register'))}
            </button>
          </form>

          {/* Switch mode */}
          <p className="pt-1 text-center text-xs text-ink/38 dark:text-paper/38">
            {isLogin ? t('noAccount') : t('alreadyHaveAccount')}{' '}
            <button
              onClick={() => reset(isLogin ? 'register' : 'login')}
              className="font-medium text-ink/70 underline-offset-2 hover:underline dark:text-paper/70"
            >
              {isLogin ? t('register') : t('signIn')}
            </button>
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-ink/28 transition-colors hover:bg-ink/6 hover:text-ink dark:text-paper/28 dark:hover:bg-paper/6 dark:hover:text-paper"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-2xl border border-ink/12 bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/28 focus:border-ink/38 dark:border-paper/12 dark:bg-ink dark:placeholder:text-paper/28 dark:focus:border-paper/38'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
