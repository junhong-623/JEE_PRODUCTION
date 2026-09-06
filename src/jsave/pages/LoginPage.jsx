import { useState } from 'react'
import { GoogleAuthProvider, getAdditionalUserInfo, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { JSAVE_BASE } from '../utils/basePath'

export default function LoginPage({ onBack, onAuthenticated }) {
  const { t, lang, setLanguage } = useLang()
  const [showEmail, setShowEmail] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function loginGoogle() {
    setLoading(true); setError('')
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider())
      onAuthenticated?.({
        user: credential.user,
        isNewUser: Boolean(getAdditionalUserInfo(credential)?.isNewUser),
      })
    }
    catch { setError(t('loginError')) }
    finally { setLoading(false) }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        onAuthenticated?.({ user: credential.user, isNewUser: true })
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        onAuthenticated?.({ user: credential.user, isNewUser: false })
      }
    } catch {
      setError(isSignUp ? t('loginSignUpError') : t('loginError'))
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setIsSignUp(v => !v)
    setError('')
  }

  function openEmail() {
    setShowEmail(true)
    setIsSignUp(false)
    setError('')
  }

  return (
    <div className="jsave-login">
      <div className="jsave-login-bg" />
      {onBack && (
        <button onClick={onBack} style={{ position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, fontFamily: 'var(--font-mono)', letterSpacing: 0.5, padding: '6px 10px', borderRadius: 8 }}>
          ← {lang === 'zh' ? '返回' : 'Back'}
        </button>
      )}

      <div className="jsave-login-card glass-card">
        <img src={`${JSAVE_BASE}/icons/icon-192.png`} alt="JSave" className="jsave-login-icon" />
        <h1 className="jsave-login-title">{t('loginTitle')}</h1>
        <p className="jsave-login-slogan">{t('loginSubtitle')}</p>

        <button className="jsave-btn-google" onClick={loginGoogle} disabled={loading}>
          <GoogleIcon />
          {t('loginGoogle')}
        </button>

        {!showEmail ? (
          <button className="jsave-btn-ghost jsave-btn-full" onClick={openEmail}>
            {t('loginEmail')}
          </button>
        ) : (
          <>
            <form onSubmit={handleEmailSubmit} className="jsave-form">
              <input
                className="jsave-input" type="email" placeholder={t('loginEmailLabel')}
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <input
                className="jsave-input" type="password" placeholder={t('loginPasswordLabel')}
                value={password} onChange={e => setPassword(e.target.value)} required
                minLength={isSignUp ? 6 : undefined}
              />
              <button type="submit" className="jsave-btn-primary jsave-btn-full" disabled={loading}>
                {isSignUp ? t('loginSignUpBtn') : t('loginBtn')}
              </button>
            </form>

            <button className="jsave-btn-link" onClick={switchMode}>
              {isSignUp ? t('loginSignInSwitch') : t('loginSignUpSwitch')}
            </button>
          </>
        )}

        {error && <p className="jsave-error">{error}</p>}

        <div className="jsave-lang-toggle">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
          <span>/</span>
          <button className={lang === 'zh' ? 'active' : ''} onClick={() => setLanguage('zh')}>中文</button>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
