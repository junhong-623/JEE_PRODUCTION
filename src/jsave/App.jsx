import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LangProvider, languageFromPath } from './contexts/LangContext'
import { JSaveProvider } from './contexts/JSaveContext'
import { useLang } from './contexts/LangContext'
import BottomNav from './components/BottomNav'
import OfflineBanner from './components/OfflineBanner'
import LoadingScreen from './components/LoadingScreen'
import { installState, isStandalone, setupPwaInstall, doInstall } from './installPrompt'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { toLocalDateString } from './utils/date'
import { articleRoute, guidesRoute } from './data/articleRoutes'
import { useJSave } from './hooks/useJSave'
import { SUPPORTED_CURRENCIES, currencyName, currencySymbol } from './utils/currency'
import { needsCurrencyOnboarding } from './utils/onboarding'
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
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const GuidesPage = lazy(() => import('./pages/GuidesPage'))

function PageFallback() {
  return <LoadingScreen />
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

function OnboardingDialog({ onComplete }) {
  const { lang, setLanguage } = useLang()
  const { settings, updateSettings } = useJSave()
  const [currency, setCurrency] = useState(settings?.currency || 'MYR')
  const [dailyBudget, setDailyBudget] = useState(
    Number(settings?.dailyBudget) > 0 ? String(settings.dailyBudget) : '',
  )
  const [saving, setSaving] = useState(false)
  const zh = lang === 'zh'

  async function finishSetup(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await updateSettings({
        currency,
        dailyBudget: Math.max(0, Number(dailyBudget) || 0),
        language: lang,
        onboardingCompleted: true,
      })
      onComplete?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="jsave-modal-overlay centered jsave-onboarding-overlay">
      <div className="jsave-modal glass-card jsave-onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="jsave-onboarding-title">
        <div className="jsave-onboarding-mark" aria-hidden="true">JS <span>/ 01</span></div>
        <p className="jsave-onboarding-eyebrow">{zh ? '开始之前' : 'Before you begin'}</p>
        <h2 id="jsave-onboarding-title">{zh ? '让 JSave 符合你的生活。' : 'Make JSave feel like yours.'}</h2>
        <p className="jsave-onboarding-copy">
          {zh
            ? '先选择主要货币。之后所有预算、目标、分账和报告都会使用同一套金额格式。'
            : 'Choose your main currency first. Budgets, goals, splits and reports will use the same money format.'}
        </p>

        <form onSubmit={finishSetup} className="jsave-onboarding-form">
          <fieldset className="jsave-onboarding-fieldset">
            <legend>{zh ? '界面语言' : 'Interface language'}</legend>
            <div className="jsave-lang-toggle jsave-onboarding-language">
              <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button>
              <button type="button" className={lang === 'zh' ? 'active' : ''} onClick={() => setLanguage('zh')}>中文</button>
            </div>
          </fieldset>

          <label className="jsave-onboarding-field">
            <span>{zh ? '主要货币' : 'Main currency'}</span>
            <div className="jsave-onboarding-select-wrap">
              <b>{currencySymbol(currency, lang)}</b>
              <select value={currency} onChange={event => setCurrency(event.target.value)}>
                {SUPPORTED_CURRENCIES.map(code => (
                  <option key={code} value={code}>{code} — {currencyName(code, lang)}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="jsave-onboarding-field">
            <span>{zh ? '每日预算' : 'Daily budget'} <small>{zh ? '选填' : 'Optional'}</small></span>
            <div className="jsave-onboarding-budget-wrap">
              <b>{currencySymbol(currency, lang)}</b>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={dailyBudget}
                onChange={event => setDailyBudget(event.target.value)}
              />
            </div>
            <small>{zh ? '留空也可以，之后能在设置中修改。' : 'You can leave this blank and change it later in Settings.'}</small>
          </label>

          <button type="submit" className="jsave-btn-primary jsave-btn-full" disabled={saving}>
            {saving ? (zh ? '正在保存…' : 'Saving…') : (zh ? '开始使用 JSave →' : 'Start using JSave →')}
          </button>
          <p className="jsave-onboarding-footnote">
            {zh ? '更换货币只会改变显示方式，不会自动换算金额。' : 'Changing currency affects display only; amounts are not converted.'}
          </p>
        </form>
      </div>
    </div>
  )
}

function JSaveShell() {
  const { user, loading, admin } = useAuth()
  const { lang } = useLang()
  const { settings, preferencesReady } = useJSave()
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
  const [newUserUid, setNewUserUid] = useState(null)
  const onboardingWasShown = useRef(false)
  const needsOnboarding = needsCurrencyOnboarding({
    uid: user?.uid,
    newUserUid,
    preferencesReady,
    onboardingCompleted: settings?.onboardingCompleted,
  })

  useEffect(() => {
    if (!needsOnboarding) return
    onboardingWasShown.current = true
    setShowInstallDialog(false)
  }, [needsOnboarding])

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

  const navigatePage = (nextPage, options = {}) => {
    if (!APP_PAGES.has(nextPage)) return
    window.history.pushState({ jsavePage: nextPage, ...options }, '', `${window.location.pathname}${window.location.search}#${nextPage}`)
    setPage(nextPage)
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    if (showLogin) {
      return (
        <div className="jsave-root">
          <Suspense fallback={<PageFallback />}>
            <LoginPage
              onBack={() => setShowLogin(false)}
              onAuthenticated={({ user: authenticatedUser, isNewUser }) => {
                if (isNewUser) setNewUserUid(authenticatedUser.uid)
              }}
            />
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
    goals:     <GoalsPage onOpenSettings={() => navigatePage('settings')} initialItemId={window.history.state?.itemId || null} />,
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
      {showInstallDialog && user && !needsOnboarding && !onboardingWasShown.current && <InstallDialog onClose={closeInstallDialog} />}
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
      {needsOnboarding && <OnboardingDialog onComplete={() => setNewUserUid(null)} />}
    </div>
  )
}

export default function JSaveApp() {
  return (
    <LangProvider>
      <JSaveRoute />
    </LangProvider>
  )
}

function JSaveRoute() {
  const article = articleRoute()
  const guides = guidesRoute()
  if (article) {
    return (
      <Suspense fallback={<PageFallback />}>
        <ArticlePage slug={article.slug} language={article.language} />
      </Suspense>
    )
  }
  if (guides) {
    return (
      <Suspense fallback={<PageFallback />}>
        <GuidesPage language={guides.language} />
      </Suspense>
    )
  }
  return <JSaveDataProvider />
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
