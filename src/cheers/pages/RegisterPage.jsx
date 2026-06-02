import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import CouponTicket from '../components/ui/CouponTicket'

function CouponGrantModal({ grant, lang, onClose }) {
  // Build coupon display from actual grant data
  const displayCoupon = {
    code: grant.code,
    title: grant.title || (lang === 'zh' ? '新用户专属优惠' : 'Welcome Offer'),
    discount: grant.discount,
    discountType: grant.discountType,
    minSpend: grant.minSpend,
    used: false,
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-cheers-dark-brown/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cheers-light-cream rounded-2xl shadow-2xl max-w-sm w-full px-4 pt-6 pb-5 text-center animate-slide-up">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="font-serif text-lg text-cheers-dark-brown mb-1">
          {lang === 'zh' ? '恭喜获得优惠券！' : 'Congratulations!'}
        </h2>
        <p className="text-sm text-cheers-brown/60 mb-4">
          {lang === 'zh' ? '注册成功！专属优惠已发放到您的账号' : 'Welcome! Your exclusive coupon has been issued'}
        </p>
        <CouponTicket coupon={displayCoupon} lang={lang} />
        <p className="text-xs text-green-600 mt-3 mb-4">{lang === 'zh' ? '✓ 结账时自动提醒使用' : '✓ Auto-prompted at checkout'}</p>
        <button onClick={onClose} className="btn-primary w-full py-2.5">
          {lang === 'zh' ? '太棒了！' : 'Awesome!'}
        </button>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const { t, lang } = useLang()
  const { register, loginWithGoogle, newCouponGrant, clearNewCouponGrant } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCouponModal, setShowCouponModal] = useState(false)

  useEffect(() => {
    if (newCouponGrant) setShowCouponModal(true)
  }, [newCouponGrant])

  function handleCouponClose() {
    setShowCouponModal(false)
    clearNewCouponGrant()
    navigate('/')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError(t('auth.passwordMismatch')); return }
    setLoading(true)
    setError('')
    try {
      await register(email, password, name)
      // If coupon granted, modal will show via useEffect; otherwise navigate
      if (!newCouponGrant) navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')
    try {
      await loginWithGoogle()
      if (!newCouponGrant) navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      {showCouponModal && newCouponGrant && (
        <CouponGrantModal grant={newCouponGrant} lang={lang} onClose={handleCouponClose} />
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-cheers-dark-brown">{t('auth.register')}</h1>
        </div>
        <div className="card p-6 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-cheers-cream bg-white hover:bg-cheers-light-cream rounded-lg py-2.5 text-sm font-medium text-cheers-dark-brown transition-colors disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.loginWithGoogle')}
          </button>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cheers-cream" /></div>
            <span className="relative bg-white px-3 text-xs text-cheers-brown/50">or</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">{t('auth.name')}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="input" required autoComplete="name" />
            </div>
            <div>
              <label className="label">{t('auth.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" required autoComplete="email" />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" required minLength={6} autoComplete="new-password" />
            </div>
            <div>
              <label className="label">{t('auth.confirmPassword')}</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="input" required autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? t('auth.registering') : t('auth.register')}
            </button>
          </form>

          <p className="text-center text-sm text-cheers-brown/60">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-cheers-brown font-medium hover:underline">{t('auth.loginHere')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
