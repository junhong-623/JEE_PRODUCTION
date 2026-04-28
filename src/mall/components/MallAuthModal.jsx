import { useState } from 'react'
import { login, loginWithGoogle, register, logout } from '../../lib/auth'
import { useMallLang } from '../hooks/useMallLang'

const T = {
  en: {
    signIn: 'Sign In', register: 'Create Account',
    signInHint: 'Sign in to track your orders and check out faster.',
    registerHint: 'Create an account to track orders and manage your profile.',
    continueGoogle: 'Continue with Google',
    orEmail: 'or continue with email',
    name: 'Display name', email: 'Email', password: 'Password',
    namePh: 'Your name', emailPh: 'you@example.com', passwordPh: '••••••••',
    submit: 'Sign In', submitRegister: 'Create Account',
    loading: 'Please wait...',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
    signUp: 'Sign up', signInLink: 'Sign in',
    close: 'Close',
    guestNote: 'You can also continue as guest — just fill in your contact details at checkout.',
  },
  zh: {
    signIn: '登录', register: '注册账号',
    signInHint: '登录后可以追踪订单，结账更方便。',
    registerHint: '注册账号，轻松追踪订单和管理个人资料。',
    continueGoogle: '使用 Google 登录',
    orEmail: '或使用邮箱登录',
    name: '显示名称', email: '邮箱', password: '密码',
    namePh: '你的名字', emailPh: 'you@example.com', passwordPh: '••••••••',
    submit: '登录', submitRegister: '注册',
    loading: '请稍候...',
    noAccount: '还没有账号？', hasAccount: '已有账号？',
    signUp: '立即注册', signInLink: '去登录',
    close: '关闭',
    guestNote: '你也可以作为访客继续结账，在购物车页面填写联系方式即可。',
  },
}

export default function MallAuthModal({ open, onClose }) {
  const { lang } = useMallLang()
  const t = (k) => T[lang]?.[k] ?? T.en[k]

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  if (!open) return null

  const isLogin = mode === 'login'

  function reset(nextMode) {
    setError(''); setName(''); setEmail(''); setPassword(''); setMode(nextMode)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, name.trim() || undefined)
      } else {
        await login(email, password)
      }
      onClose()
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally { setLoading(false) }
  }

  async function handleGoogle() {
    setError(''); setGoogleLoading(true)
    try {
      await loginWithGoogle()
      onClose()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
      }
    } finally { setGoogleLoading(false) }
  }

  return (
    <>
      <div style={S.overlay} onClick={onClose} />
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <img src="/logo.svg" alt="JeeProd" style={S.logo} />
          <h2 style={S.title}>{isLogin ? t('signIn') : t('register')}</h2>
          <p style={S.subtitle}>{isLogin ? t('signInHint') : t('registerHint')}</p>
          <button onClick={onClose} style={S.closeBtn} title={t('close')}>✕</button>
        </div>

        <div style={S.body}>
          {/* Google button */}
          <button onClick={handleGoogle} disabled={googleLoading || loading} style={S.googleBtn}>
            {googleLoading
              ? <span style={S.spinner} />
              : <GoogleIcon />}
            {t('continueGoogle')}
          </button>

          {/* Divider */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>{t('orEmail')}</span>
            <div style={S.dividerLine} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {!isLogin && (
              <div style={S.group}>
                <label style={S.label}>{t('name')}</label>
                <input style={S.input} type="text" placeholder={t('namePh')} value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div style={S.group}>
              <label style={S.label}>{t('email')}</label>
              <input style={S.input} type="email" placeholder={t('emailPh')} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={S.group}>
              <label style={S.label}>{t('password')}</label>
              <input style={S.input} type="password" placeholder={t('passwordPh')} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && <div style={S.error}>{error}</div>}

            <button type="submit" disabled={loading || googleLoading} style={S.submitBtn}>
              {loading ? t('loading') : (isLogin ? t('submit') : t('submitRegister'))}
            </button>
          </form>

          {/* Switch mode */}
          <div style={S.switchRow}>
            <span style={S.switchText}>{isLogin ? t('noAccount') : t('hasAccount')}</span>
            <button style={S.switchBtn} onClick={() => reset(isLogin ? 'register' : 'login')}>
              {isLogin ? t('signUp') : t('signInLink')}
            </button>
          </div>

          {/* Guest note */}
          <p style={S.guestNote}>{t('guestNote')}</p>
        </div>
      </div>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const S = {
  overlay: {
    position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:600,
    backdropFilter:'blur(4px)',
  },
  modal: {
    position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
    background:'#fefefe',borderRadius:20,width:'min(420px,94vw)',
    zIndex:601,overflow:'hidden',
    boxShadow:'0 24px 80px rgba(13,13,13,0.25)',
    color:'#0d0d0d',
  },
  header: {
    background:'#0d0d0d',padding:'28px 28px 24px',textAlign:'center',position:'relative',
  },
  logo: {
    width:44,height:44,borderRadius:12,objectFit:'cover',marginBottom:14,display:'inline-block',
  },
  title: {
    color:'white',fontWeight:800,fontSize:20,margin:'0 0 6px',
  },
  subtitle: {
    color:'rgba(255,255,255,0.55)',fontSize:13,margin:0,lineHeight:1.5,
  },
  closeBtn: {
    position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.12)',
    border:'none',color:'white',width:30,height:30,borderRadius:'50%',
    fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
  },
  body: {
    padding:'24px 28px 28px',display:'flex',flexDirection:'column',gap:14,
  },
  googleBtn: {
    display:'flex',alignItems:'center',justifyContent:'center',gap:10,
    width:'100%',padding:'11px 16px',borderRadius:12,
    background:'white',border:'1.5px solid #e0ddd7',
    color:'#0d0d0d',fontSize:14,fontWeight:600,cursor:'pointer',
    transition:'background 0.15s',
  },
  divider: {
    display:'flex',alignItems:'center',gap:10,
  },
  dividerLine: { flex:1,height:1,background:'#e0ddd7' },
  dividerText: { fontSize:11,color:'#6b6b6b',whiteSpace:'nowrap',letterSpacing:'0.5px' },
  group: { display:'flex',flexDirection:'column',gap:5 },
  label: { fontSize:11,fontWeight:700,color:'#3a3a3a',textTransform:'uppercase',letterSpacing:'0.5px' },
  input: {
    padding:'10px 13px',border:'1.5px solid #e0ddd7',borderRadius:10,
    fontSize:14,background:'#f7f5f0',color:'#0d0d0d',outline:'none',
    fontFamily:"'DM Sans',sans-serif",
    transition:'border-color 0.15s',
  },
  error: {
    background:'#fee2e2',color:'#991b1b',borderRadius:8,
    padding:'8px 12px',fontSize:12,fontWeight:500,
  },
  submitBtn: {
    width:'100%',padding:'13px',background:'#e8440a',color:'white',
    border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',
    transition:'background 0.15s',
  },
  switchRow: { display:'flex',justifyContent:'center',alignItems:'center',gap:6 },
  switchText: { fontSize:13,color:'#6b6b6b' },
  switchBtn: {
    fontSize:13,fontWeight:700,color:'#e8440a',background:'none',
    border:'none',cursor:'pointer',padding:0,
  },
  guestNote: {
    fontSize:11,color:'#6b6b6b',textAlign:'center',lineHeight:1.6,
    borderTop:'1px solid #e0ddd7',paddingTop:12,margin:0,
  },
  spinner: {
    display:'inline-block',width:16,height:16,borderRadius:'50%',
    border:'2px solid #e0ddd7',borderTopColor:'#3a3a3a',
    animation:'spin 0.7s linear infinite',
  },
}
