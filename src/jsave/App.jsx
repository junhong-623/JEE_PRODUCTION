import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LangProvider, languageFromPath } from './contexts/LangContext'
import { JSaveProvider } from './contexts/JSaveContext'
import { useLang } from './contexts/LangContext'
import BottomNav from './components/BottomNav'
import OfflineBanner from './components/OfflineBanner'
import { installState, isStandalone, setupPwaInstall, doInstall } from './installPrompt'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toLocalDateString } from './utils/date'
import './design-system.css'
import './App.css'

const IntroPage = lazy(() => import('./pages/IntroPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const TransactionForm = lazy(() => import('./components/TransactionForm'))

function PageFallback() {
  const { t } = useLang()
  return <div className="jsave-center-msg">{t('loading')}</div>
}

const APP_PAGES = new Set(['dashboard', 'calendar', 'reports', 'goals', 'settings'])

function pageFromLocation() {
  const value = window.location.hash.slice(1)
  return APP_PAGES.has(value) ? value : 'dashboard'
}

function InstallDialog({ onClose }) {
  const { t, lang } = useLang()
  const zh = lang === 'zh'
  const [guide, setGuide] = useState(null)

  return (
    <div className="jsave-modal-overlay centered" onClick={onClose}>
      <div className="jsave-modal jsave-install-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        {!guide ? (
          <>
            <div className="jsave-install-dialog-icon">📲</div>
            <h2 className="jsave-modal-title" style={{ justifyContent: 'center', marginBottom: 8 }}>
              {zh ? '安装 J省' : 'Install JSave'}
            </h2>
            <p className="jsave-install-dialog-desc">
              {zh
                ? '将 J省 添加到主屏幕，获得完整离线体验，随时随地记账。'
                : 'Add JSave to your home screen for the full offline experience — no browser needed.'}
            </p>
            <button className="jsave-btn-ghost jsave-btn-full" style={{ marginBottom: 8 }}
              onClick={() => doInstall(setGuide)}>
              {t('installTitle')}
            </button>
            <button className="jsave-btn-ghost jsave-btn-full" onClick={onClose}>
              {zh ? '稍后再说' : 'Maybe later'}
            </button>
          </>
        ) : (
          <>
            <div className="jsave-install-dialog-icon">{guide === 'android' ? '🤖' : '💻'}</div>
            <h2 className="jsave-modal-title" style={{ justifyContent: 'center', marginBottom: 16 }}>
              {guide === 'android'
                ? (zh ? 'Android 安装' : 'Install on Android')
                : (zh ? '桌面端安装' : 'Install on Desktop')}
            </h2>
            <ol className="jsave-install-guide-steps">
              {(guide === 'android'
                ? (zh
                    ? ['点击右上角 ⋮ 菜单', '选择「添加到主屏幕」或「安装应用」', '点击「添加」确认']
                    : ['Tap the ⋮ menu in Chrome (top-right)', 'Tap "Add to Home screen" or "Install app"', 'Tap "Add" to confirm'])
                : (zh
                    ? ['点击地址栏右侧的安装图标（⊕）', '点击「安装」即可']
                    : ['Click the install icon (⊕) in the address bar', 'Click "Install"'])
              ).map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <button className="jsave-btn-ghost jsave-btn-full" style={{ marginTop: 8 }} onClick={onClose}>
              {zh ? '好的' : 'Got it'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function PaymentResultModal({ onClose, amount }) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const params = new URLSearchParams(window.location.search)
  const statusId = params.get('status_id')

  const isSuccess = statusId === '1'
  const isPending = statusId === '2'

  const icon  = isSuccess ? '☕' : isPending ? '⏳' : '❌'
  const title = isSuccess
    ? (zh ? '感谢你的支持！' : 'Thank you so much!')
    : isPending
      ? (zh ? '支付处理中…' : 'Payment pending…')
      : (zh ? '支付未完成' : 'Payment not completed')
  const desc = isSuccess
    ? (zh
        ? `RM ${amount} 的咖啡已送达，我会继续努力改善 J省 ❤️`
        : `RM ${amount} coffee on its way! I'll keep improving JSave ❤️`)
    : isPending
      ? (zh ? '支付正在处理中，请稍候。' : 'Your payment is being processed.')
      : (zh ? '本次支付未成功，欢迎再次尝试。' : 'Payment was not completed. Feel free to try again.')

  return (
    <div className="jsave-modal-overlay centered" onClick={onClose}>
      <div className="jsave-modal jsave-install-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="jsave-install-dialog-icon" style={{ fontSize: 48 }}>{icon}</div>
        <h2 className="jsave-modal-title" style={{ justifyContent: 'center', marginBottom: 8 }}>{title}</h2>
        <p className="jsave-install-dialog-desc">{desc}</p>
        <button className="jsave-btn-ghost jsave-btn-full" onClick={onClose}>
          {zh ? '好的' : 'Got it'}
        </button>
      </div>
    </div>
  )
}

function JSaveShell() {
  const { user, loading, admin } = useAuth()
  const { lang } = useLang()
  const [page, setPage] = useState(pageFromLocation)
  const [showLogin, setShowLogin] = useState(false)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [paymentResult, setPaymentResult] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    return p.has('status_id') ? p.get('status_id') : null
  })
  const [pendingCoffeeAmt] = useState(() => Number(localStorage.getItem('jsave-coffee-pending') || 0))

  useEffect(() => {
    if (paymentResult === '1' && pendingCoffeeAmt > 0 && user?.uid) {
      const donationData = {
        amount: pendingCoffeeAmt,
        date: toLocalDateString(),
        createdAt: serverTimestamp(),
      }
      addDoc(collection(db, 'users', user.uid, 'jsave_donations'), donationData).catch(console.error)
      addDoc(collection(db, 'jsave_donations_all'), { ...donationData, uid: user.uid }).catch(console.error)
      localStorage.removeItem('jsave-coffee-pending')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPrompt = e => { e.preventDefault(); installState.deferredPrompt = e }
    window.addEventListener('beforeinstallprompt', onPrompt)
    setupPwaInstall()
    // Show one-time install dialog if running in browser (not standalone)
    if (!isStandalone() && !localStorage.getItem('jsave-install-seen')) {
      setTimeout(() => setShowInstallDialog(true), 2000)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      installState.pwaEl?.remove()
      installState.pwaEl = null
    }
  }, [])

  useEffect(() => {
    const syncPage = () => setPage(pageFromLocation())
    window.addEventListener('popstate', syncPage)
    window.addEventListener('hashchange', syncPage)
    return () => {
      window.removeEventListener('popstate', syncPage)
      window.removeEventListener('hashchange', syncPage)
    }
  }, [])

  const navigatePage = nextPage => {
    if (!APP_PAGES.has(nextPage)) return
    window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#${nextPage}`)
    setPage(nextPage)
  }

  if (loading) {
    return (
      <div className="jsave-root jsave-center-msg">
        Loading…
      </div>
    )
  }

  if (!user) {
    if (showLogin) {
      return (
        <div className="jsave-root">
          <Suspense fallback={<PageFallback />}>
            <LoginPage onBack={() => setShowLogin(false)} />
          </Suspense>
        </div>
      )
    }
    return (
      <Suspense fallback={<PageFallback />}>
        <IntroPage onLogin={() => setShowLogin(true)} />
      </Suspense>
    )
  }

  const pages = {
    dashboard: <DashboardPage onOpenSettings={() => navigatePage('settings')} onNavigate={navigatePage} />,
    calendar:  <CalendarPage onOpenSettings={() => navigatePage('settings')} />,
    reports:   <ReportsPage onOpenSettings={() => navigatePage('settings')} />,
    goals:     <GoalsPage onOpenSettings={() => navigatePage('settings')} />,
    settings:  <SettingsPage onOpenAdmin={admin ? () => setShowAdmin(true) : null} />,
  }

  const closeInstallDialog = () => {
    localStorage.setItem('jsave-install-seen', '1')
    setShowInstallDialog(false)
  }

  const closePaymentResult = () => {
    setPaymentResult(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <div className="jsave-root jsave-shell">
      {showInstallDialog && user && <InstallDialog onClose={closeInstallDialog} />}
      {paymentResult && user && <PaymentResultModal onClose={closePaymentResult} amount={pendingCoffeeAmt} />}
      {showAdmin && admin && (
        <Suspense fallback={<PageFallback />}>
          <AdminPage zh={lang === 'zh'} onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
      <OfflineBanner />
      <Suspense fallback={<PageFallback />}>
        <div key={page} className="jsave-page-anim">
          {pages[page] ?? pages['dashboard']}
        </div>
      </Suspense>
      {showTransactionForm && (
        <Suspense fallback={null}>
          <TransactionForm initial={null} onClose={() => setShowTransactionForm(false)} />
        </Suspense>
      )}
      <BottomNav
        active={page}
        onChange={p => {
          if (p === 'add') { setShowTransactionForm(true) }
          else navigatePage(p)
        }}
      />
    </div>
  )
}

export default function JSaveApp() {
  return (
    <LangProvider>
      <JSaveDataProvider />
    </LangProvider>
  )
}

function JSaveDataProvider() {
  const { setLanguage } = useLang()
  const applySavedLanguage = useCallback(
    language => setLanguage(languageFromPath() || language),
    [setLanguage],
  )
  return (
    <JSaveProvider onLanguageChange={applySavedLanguage}>
      <JSaveShell />
    </JSaveProvider>
  )
}
