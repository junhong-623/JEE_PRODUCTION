import { useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { JSAVE_BASE } from '../utils/basePath'
import { useJSave } from '../hooks/useJSave'
import { useAuth } from '../../contexts/AuthContext'
import GlassCard from '../components/GlassCard'
import { JSAVE_VERSION } from '../version'
import { subscribePush, unsubscribePush, updatePushLanguage, isPushSupported } from '../services/pushService'
import { RELEASE_NOTES } from '../data/releaseNotes'
import { isStandalone, doInstall } from '../installPrompt'
import { createCoffeeBill } from '../services/toyyibpay'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { db } from '../../lib/firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { toLocalDateString } from '../utils/date'
import { downloadTransactionsCsv } from '../services/export'

const CURRENCIES = ['MYR', 'USD', 'SGD', 'CNY', 'EUR', 'GBP']
const ACC_TYPES  = ['accCash', 'accBank', 'accEwallet', 'accCredit']
const ACC_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

// ── Accordion ─────────────────────────────────────────────────────────────────
function Accordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <GlassCard className="jsave-settings-card jsave-accordion-card">
      <button className="jsave-accordion-btn" onClick={() => setOpen(v => !v)}>
        <h2 className="jsave-settings-section" style={{ margin: 0 }}>{title}</h2>
        <svg className={`jsave-chevron${open ? ' open' : ''}`} width={16} height={16} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="jsave-accordion-body">{children}</div>}
    </GlassCard>
  )
}

// ── Activity card (always visible, top of settings) ───────────────────────────
function ActivityCard({ transactions, t }) {
  const today = new Date()
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (13 - i))
    return { date: toLocalDateString(d), day: d.getDate(), isToday: i === 13 }
  }), [])

  const txDates = useMemo(() => new Set(
    transactions.filter(tx => tx.type !== 'transfer').map(tx => tx.date)
  ), [transactions])

  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (txDates.has(days[i].date)) streak++
    else break
  }

  return (
    <GlassCard className="jsave-settings-card">
      <div className="jsave-activity-header">
        <h2 className="jsave-settings-section">{t('activitySection')}</h2>
        {streak > 0 && (
          <span className="jsave-streak-badge">{t('streakDays').replace('{n}', streak)}</span>
        )}
      </div>
      <div className="jsave-activity-strip">
        {days.map(({ date, day, isToday }) => (
          <div key={date} className="jsave-activity-col">
            <div className={`jsave-activity-dot${txDates.has(date) ? ' recorded' : ''}${isToday ? ' today' : ''}`} />
            <span className={`jsave-activity-day-num${isToday ? ' today' : ''}`}>{day}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// ── Cache size display ─────────────────────────────────────────────────────────
function CacheSize({ t }) {
  const [size, setSize] = useState(null)

  useEffect(() => {
    async function calc() {
      try {
        if (navigator.storage?.estimate) {
          const { usage } = await navigator.storage.estimate()
          setSize(usage ?? 0)
        }
      } catch {}
    }
    calc()
  }, [])

  if (size === null) return null
  const fmt = size < 1024 * 1024
    ? `${Math.round(size / 1024)} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`
  return <span className="jsave-section-sub">{fmt}</span>
}

// ── Clear cache countdown ──────────────────────────────────────────────────────
const CLEAR_DURATION = 3000
const CLEAR_R = 18
const CLEAR_CIRC = 2 * Math.PI * CLEAR_R

function ClearCacheButton({ t, online }) {
  const [phase, setPhase] = useState('idle') // idle | checking | uptodate | counting | clearing
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(null)

  async function handleClick() {
    setPhase('checking')
    try {
      const res = await fetch(`${JSAVE_BASE}/version.json?_=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) { startCountdown(); return }
      const { version: remote } = await res.json()
      if (remote === JSAVE_VERSION) { setPhase('uptodate'); return }
    } catch {}
    startCountdown()
  }

  function startCountdown() {
    setPhase('counting'); setProgress(0)
    const t0 = performance.now()
    cancelAnimationFrame(rafRef.current)
    function step(now) {
      const p = Math.min((now - t0) / CLEAR_DURATION, 1)
      setProgress(p)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
      else executeClear()
    }
    rafRef.current = requestAnimationFrame(step)
  }

  async function executeClear() {
    setPhase('clearing')
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
    window.location.reload()
  }

  function cancel() {
    cancelAnimationFrame(rafRef.current)
    setPhase('idle'); setProgress(0)
  }

  useEffect(() => {
    if (phase === 'clearing') {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [phase])

  if (phase === 'clearing') {
    return createPortal(
      <div className="jsave-clearing-overlay">
        <div className="jsave-clearing-box">
          <div className="jsave-clearing-spinner" />
          <p style={{ margin: 0, fontWeight: 500 }}>{t('clearCacheWaiting')}</p>
        </div>
      </div>,
      document.body
    )
  }

  if (phase === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="jsave-btn-ghost jsave-btn-full" onClick={handleClick}>
          {t('clearCacheBtn')}
        </button>
        {!online && (
          <p className="jsave-section-sub" style={{ margin: 0, fontSize: 12, color: '#f59e0b' }}>
            ⚠️ {t('clearCacheOfflineWarn')}
          </p>
        )}
      </div>
    )
  }

  if (phase === 'checking') {
    return (
      <button className="jsave-btn-ghost jsave-btn-full" disabled style={{ opacity: 0.6 }}>
        {t('checkingUpdate')}
      </button>
    )
  }

  if (phase === 'uptodate') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="jsave-section-sub" style={{ textAlign: 'center', margin: 0 }}>{t('upToDateMsg')}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="jsave-btn-ghost" style={{ flex: 1 }} onClick={cancel}>{t('cancel')}</button>
          <button className="jsave-btn-ghost" style={{ flex: 1 }} onClick={startCountdown}>{t('clearAnywayBtn')}</button>
        </div>
      </div>
    )
  }

  // counting
  return (
    <div className="jsave-cache-countdown">
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx={26} cy={26} r={CLEAR_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <circle cx={26} cy={26} r={CLEAR_R} fill="none" stroke="#10b981" strokeWidth={3}
          strokeDasharray={CLEAR_CIRC} strokeDashoffset={CLEAR_CIRC * (1 - progress)}
          strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px' }} />
        <text x={26} y={30} textAnchor="middle" fill="#f1f5f9" fontSize={11} fontWeight={600}>
          {Math.round(progress * 100)}%
        </text>
      </svg>
      <div className="jsave-cache-countdown-info">
        <span className="jsave-section-sub">{t('clearCacheDesc')}</span>
        <button className="jsave-btn-ghost" style={{ padding: '2px 10px', fontSize: 12 }} onClick={cancel}>
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}

// ── Release Notes Modal ───────────────────────────────────────────────────────
function ReleaseNotesModal({ lang, t, onClose }) {
  const zh = lang === 'zh'
  const [showAll, setShowAll] = useState(false)
  const PREVIEW = 5
  const visible = showAll ? RELEASE_NOTES : RELEASE_NOTES.slice(0, PREVIEW)
  return (
    <div className="jsave-modal-overlay centered" onClick={onClose}>
      <div className="jsave-modal" role="dialog" aria-modal="true" style={{ maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="jsave-modal-title">
          <span>🚀 {t('whatsNewTitle')}</span>
          <button className="jsave-modal-close" aria-label={t('close')} onClick={onClose}>✕</button>
        </div>
        <div className="jsave-release-list">
          {visible.map(r => (
            <div key={r.version} className="jsave-release-entry">
              <div className="jsave-release-header">
                <span className="jsave-release-version">v{r.version}</span>
                {r.isLatest && <span className="jsave-release-badge">{zh ? '最新' : 'latest'}</span>}
                <span className="jsave-release-date">{r.date}</span>
              </div>
              <ul className="jsave-release-items">
                {(zh && r.itemsZh ? r.itemsZh : r.items).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
          {!showAll && RELEASE_NOTES.length > PREVIEW && (
            <button className="jsave-btn-ghost jsave-btn-full" style={{ marginTop: 4 }} onClick={() => setShowAll(true)}>
              {zh ? `查看全部 ${RELEASE_NOTES.length} 个版本 ↓` : `Show all ${RELEASE_NOTES.length} versions ↓`}
            </button>
          )}
          {showAll && (
            <button className="jsave-btn-ghost jsave-btn-full" style={{ marginTop: 4 }} onClick={() => setShowAll(false)}>
              {zh ? '收起 ↑' : 'Show less ↑'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Treat me a Coffee ────────────────────────────────────────────────────────
const COFFEE_AMOUNTS = [5, 10, 50]
function CoffeePayModal({ zh, url, amount, onClose, onCancel }) {
  const qrData = encodeURIComponent(url)
  const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}&bgcolor=ffffff&color=1a1a2e&margin=6`

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function handleRedirect() {
    localStorage.setItem('jsave-coffee-pending', String(amount))
    window.location.href = url
  }

  return (
    <div className="jsave-modal-overlay centered" onClick={onCancel}>
      <div className="jsave-coffee-pay-modal" onClick={e => e.stopPropagation()}>
        <div className="jsave-coffee-pay-header">
          <span>☕ {zh ? '选择支付方式' : 'Choose Payment'}</span>
          <button className="jsave-modal-close" aria-label={zh ? '关闭' : 'Close'} onClick={onCancel}>✕</button>
        </div>
        <p className="jsave-section-sub" style={{ textAlign: 'center', marginBottom: 12 }}>
          RM {amount}
        </p>
        <div className="jsave-coffee-qr-wrap">
          <img src={qrSrc} alt="QR code" width={160} height={160} className="jsave-coffee-qr" />
          <p className="jsave-section-sub" style={{ textAlign: 'center', marginTop: 6, fontSize: 12 }}>
            {zh ? '用手机扫码支付（DuitNow / FPX）' : 'Scan with your phone (DuitNow / FPX)'}
          </p>
        </div>
        <div className="jsave-coffee-pay-divider"><span>{zh ? '或' : 'or'}</span></div>
        <button className="jsave-btn-primary jsave-btn-full" onClick={handleRedirect}>
          {zh ? '在此页面支付' : 'Pay in this tab'}
        </button>
        <button className="jsave-btn-ghost jsave-btn-full" style={{ marginTop: 8 }} onClick={onCancel}>
          {zh ? '返回' : 'Back'}
        </button>
      </div>
    </div>
  )
}

function CoffeeCancelledModal({ zh, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  return (
    <div className="jsave-modal-overlay centered" onClick={onClose}>
      <div className="jsave-coffee-pay-modal" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>❌</div>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
          {zh ? '支付未完成' : 'Payment not completed'}
        </h2>
        <p className="jsave-section-sub" style={{ marginBottom: 16 }}>
          {zh ? '你已取消支付，欢迎随时再试。' : 'You cancelled the payment. Feel free to try again anytime.'}
        </p>
        <button className="jsave-btn-ghost jsave-btn-full" onClick={onClose}>
          {zh ? '好的' : 'Got it'}
        </button>
      </div>
    </div>
  )
}

function TreatCoffee({ lang, user, onShowPayModal }) {
  const zh = lang === 'zh'
  const [selected, setSelected] = useState(null)
  const [custom, setCustom]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [history, setHistory]   = useState([])

  useEffect(() => {
    if (!user?.uid) return
    getDocs(query(
      collection(db, 'users', user.uid, 'jsave_donations'),
      orderBy('createdAt', 'desc')
    )).then(snap => {
      setHistory(snap.docs.map(d => d.data()))
    }).catch(() => {})
  }, [user?.uid])

  const total  = history.reduce((s, h) => s + h.amount, 0)
  const amount = selected !== null ? selected : (custom ? Number(custom) : 0)

  async function handlePay() {
    if (!amount || amount < 5) {
      setError(zh ? '最低金额为 RM 5' : 'Minimum amount is RM 5.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await createCoffeeBill(amount)
      onShowPayModal({ url: data.url, amount })
    } catch {
      setError(zh ? '支付失败，请稍后重试' : 'Payment failed, please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="jsave-section-sub" style={{ marginBottom: 14 }}>
        {zh
          ? '如果 J省 对你有帮助，可以请我喝一杯咖啡，感谢支持！☕'
          : 'Enjoying JSave? Buy me a coffee — every sip keeps the app alive! ☕'}
      </p>
      {history.length > 0 && (
        <div className="jsave-coffee-history">
          <div className="jsave-coffee-total">
            ☕ {zh ? `共请了 RM ${total} — 非常感谢！❤️` : `Total donated: RM ${total} — thank you! ❤️`}
          </div>
          <div className="jsave-coffee-entries">
            {history.slice(0, 3).map((h, i) => (
              <div key={i} className="jsave-coffee-entry">
                <span>☕ RM {h.amount}</span>
                <span className="jsave-section-sub">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {COFFEE_AMOUNTS.map(a => (
          <button
            key={a}
            className={selected === a ? 'jsave-btn-primary' : 'jsave-btn-ghost'}
            style={{ flex: 1 }}
            onClick={() => { setSelected(a); setCustom(''); setError('') }}
          >
            RM {a}
          </button>
        ))}
      </div>
      <input
        className="jsave-input"
        type="number"
        min="5"
        step="0.01"
        placeholder={zh ? '自定义金额 (最低 RM 5)' : 'Custom amount (min RM 5)'}
        value={custom}
        onChange={e => { setCustom(e.target.value); setSelected(null); setError('') }}
        style={{ marginBottom: 12 }}
      />
      {error && <p className="jsave-error" style={{ marginBottom: 8 }}>{error}</p>}
      <button
        className="jsave-btn-primary jsave-btn-full"
        disabled={!amount || amount <= 0 || loading}
        onClick={handlePay}
      >
        {loading
          ? (zh ? '处理中…' : 'Processing…')
          : `☕ ${zh ? '去支付' : 'Pay'} ${amount > 0 ? `RM ${amount}` : ''}`}
      </button>

    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage({ onOpenAdmin }) {
  const { t, lang, setLanguage } = useLang()
  const { user, admin } = useAuth()
  const online = useOnlineStatus()
  const { transactions, settings, accounts, updateSettings, addAccount, updateAccount, deleteAccount } = useJSave()

  const [saved,             setSaved]             = useState(false)
  const [showAccForm,       setShowAccForm]       = useState(false)
  const [editAcc,           setEditAcc]           = useState(null)
  const [notifBlocked,      setNotifBlocked]      = useState(false)
  const [notifSubFailed,    setNotifSubFailed]    = useState(false)
  const [showReleaseNotes,  setShowReleaseNotes]  = useState(false)
  const [installGuide,      setInstallGuide]      = useState(null)
  const [payModal,          setPayModal]          = useState(null)
  const [payCancelled,      setPayCancelled]      = useState(false)

  const [monthlyIncome,  setMonthlyIncome]  = useState(settings?.monthlyIncome?.toString() ?? '0')
  const [currency,       setCurrency]       = useState(settings?.currency ?? 'MYR')
  const [dailyBudget,    setDailyBudget]    = useState(settings?.dailyBudget?.toString() ?? '0')
  const [autoSalary,     setAutoSalary]     = useState(settings?.autoSalary ?? false)
  const [salaryAccountId,setSalaryAccountId]= useState(settings?.salaryAccountId ?? '')
  const [salaryDay,      setSalaryDay]      = useState(settings?.salaryDay?.toString() ?? '1')
  const [dailyReminder,  setDailyReminder]  = useState(false)
  const [subId,          setSubId]          = useState(null)

  // Init toggle from THIS device's actual push subscription state, not account-level settings
  useEffect(() => {
    async function checkDevicePush() {
      if (!('PushManager' in window) || Notification.permission !== 'granted') return
      try {
        const reg = await navigator.serviceWorker.getRegistration(`${JSAVE_BASE}/`)
        if (!reg) return
        const sub = await reg.pushManager.getSubscription()
        if (sub) { setDailyReminder(true); setSubId(sub.endpoint.split('/').pop().slice(0, 8)) }
      } catch {}
    }
    checkDevicePush()
  }, [])

  async function savePrefs() {
    await updateSettings({
      monthlyIncome: Number(monthlyIncome),
      currency, dailyBudget: Number(dailyBudget), language: lang,
      autoSalary, salaryAccountId, salaryDay: Number(salaryDay),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLangChange(l) {
    setLanguage(l)
    updateSettings({ language: l })
  }

  async function toggleReminder(on) {
    setNotifBlocked(false)
    setNotifSubFailed(false)
    setDailyReminder(on) // optimistic — revert below on any failure
    if (on) {
      if (typeof Notification === 'undefined') { setDailyReminder(false); return }
      const perm = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission
      if (perm !== 'granted') { setNotifBlocked(true); setDailyReminder(false); return }
      const endpoint = await subscribePush(user.uid, lang)
      if (!endpoint) { setNotifSubFailed(true); setDailyReminder(false); return }
      setSubId(endpoint.split('/').pop().slice(0, 8))
    } else {
      await unsubscribePush(user.uid)
      setSubId(null)
    }
  }

  // Keep push language in sync when user changes language
  useEffect(() => {
    if (dailyReminder && user?.uid) updatePushLanguage(user.uid, lang)
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="jsave-page">

      {/* Activity — always at top, no accordion */}
      <ActivityCard transactions={transactions} t={t} />

      {/* Preferences */}
      <Accordion title={t('prefSection')} defaultOpen>
        <div className="jsave-setting-row">
          <span className="jsave-label">{t('langLabel')}</span>
          <div className="jsave-lang-toggle">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => handleLangChange('en')}>{t('langEn')}</button>
            <button className={lang === 'zh' ? 'active' : ''} onClick={() => handleLangChange('zh')}>{t('langZh')}</button>
          </div>
        </div>
        <div className="jsave-setting-row">
          <label className="jsave-label">{t('currencyLabel')}</label>
          <select className="jsave-input jsave-input-sm" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="jsave-setting-row">
          <label className="jsave-label">{t('monthlyIncomeLabel')} ({currency})</label>
          <input className="jsave-input jsave-input-sm" type="number" min="0" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} />
        </div>
        <div className="jsave-setting-row">
          <label className="jsave-label">{t('dailyBudgetLabel')} ({currency})</label>
          <input className="jsave-input jsave-input-sm" type="number" min="0" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} />
        </div>
        <button className="jsave-btn-primary jsave-btn-full" style={{ marginTop: 8 }} onClick={savePrefs}>
          {saved ? '✓ ' + t('settingsSaved') : t('save')}
        </button>
      </Accordion>

      {/* Reminders */}
      {isPushSupported && (
        <Accordion title={t('reminderSection')}>
          <div className="jsave-setting-row">
            <div>
              <span className="jsave-label">{t('dailyReminderLabel')}</span>
              <p className="jsave-section-sub" style={{ marginTop: 2 }}>{t('reminderDesc')}</p>
            </div>
            <label className="jsave-toggle">
              <input type="checkbox" checked={dailyReminder} onChange={e => toggleReminder(e.target.checked)} />
              <span className="jsave-toggle-track" />
            </label>
          </div>
          {dailyReminder && subId && (
            <p className="jsave-section-sub" style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 11, opacity: 0.6 }}>
              {lang === 'zh' ? '订阅 ID' : 'Sub ID'}: …{subId}
            </p>
          )}
          {notifBlocked && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p className="jsave-error" style={{ margin: 0 }}>{t('reminderPermissionDenied')}</p>
              <button
                className="jsave-btn-ghost"
                style={{ alignSelf: 'flex-start', padding: '4px 12px', fontSize: 13 }}
                onClick={() => window.location.reload()}
              >
                {lang === 'zh' ? '刷新页面重试' : 'Reload page to retry'}
              </button>
            </div>
          )}
          {notifSubFailed && (
            <p className="jsave-error" style={{ marginTop: 8 }}>
              {lang === 'zh'
                ? '订阅推送通知失败，请检查浏览器设置后重试。'
                : 'Failed to register push subscription. Check your browser settings and try again.'}
            </p>
          )}
        </Accordion>
      )}

      {/* Auto Salary */}
      <Accordion title={t('salarySection')}>
        <div className="jsave-setting-row" style={{ marginBottom: autoSalary ? 14 : 0 }}>
          <div>
            <p className="jsave-section-sub">{t('autoSalaryLabel')}</p>
          </div>
          <label className="jsave-toggle">
            <input type="checkbox" checked={autoSalary} onChange={e => setAutoSalary(e.target.checked)} />
            <span className="jsave-toggle-track" />
          </label>
        </div>
        {autoSalary && (
          accounts.length === 0 ? (
            <p className="jsave-empty-msg" style={{ padding: '8px 0' }}>{t('noAccountForSalary')}</p>
          ) : (
            <>
              <div className="jsave-setting-row">
                <label className="jsave-label">{t('salaryAccountLabel')}</label>
                <select className="jsave-input jsave-input-sm" value={salaryAccountId} onChange={e => setSalaryAccountId(e.target.value)}>
                  <option value="">—</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="jsave-setting-row">
                <label className="jsave-label">{t('salaryDayLabel')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="jsave-input jsave-input-sm" type="number" min="1" max="28"
                    value={salaryDay}
                    onChange={e => setSalaryDay(Math.min(28, Math.max(1, Number(e.target.value))).toString())}
                    style={{ width: 64, textAlign: 'center' }} />
                  <span className="jsave-section-sub">{t('salaryDayHint')}</span>
                </div>
              </div>
              {salaryAccountId && monthlyIncome && (
                <p className="jsave-salary-preview">
                  {t('salaryPreview')
                    .replace('{amount}', new Intl.NumberFormat('en-MY', { style: 'currency', currency: currency || 'MYR' }).format(Number(monthlyIncome)))
                    .replace('{account}', accounts.find(a => a.id === salaryAccountId)?.name ?? '—')
                    .replace('{day}', salaryDay)}
                </p>
              )}
              <button className="jsave-btn-primary jsave-btn-full" style={{ marginTop: 14 }} onClick={savePrefs}>
                {saved ? '✓ ' + t('settingsSaved') : t('save')}
              </button>
            </>
          )
        )}
      </Accordion>

      {/* Accounts */}
      <Accordion title={t('accountsSection')}>
        <div className="jsave-section-header" style={{ marginBottom: 8 }}>
          <span />
          <button className="jsave-btn-primary" onClick={() => { setEditAcc(null); setShowAccForm(true) }}>{t('addAccount')}</button>
        </div>
        {accounts.length === 0 ? (
          <p className="jsave-empty-msg">{t('noAccounts')}</p>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="jsave-acc-row" onClick={() => { setEditAcc(acc); setShowAccForm(true) }}>
              <span className="jsave-acc-dot" style={{ background: acc.color || '#10b981' }} />
              <div className="jsave-acc-info">
                <span className="jsave-acc-name">{acc.name}</span>
                <span className="jsave-acc-type">{t(acc.type)}</span>
              </div>
            </div>
          ))
        )}
      </Accordion>

      {/* Data ownership */}
      <Accordion title={t('dataSection')}>
        <p className="jsave-section-sub" style={{ marginBottom: 12 }}>{t('exportCsvDesc')}</p>
        <button
          className="jsave-btn-ghost jsave-btn-full"
          disabled={transactions.length === 0}
          onClick={() => downloadTransactionsCsv({
            transactions,
            accounts,
            currency: settings.currency || 'MYR',
          })}
        >
          📥 {transactions.length ? t('exportCsv') : t('noTransactionsExport')}
        </button>
      </Accordion>

      {/* Treat me a Coffee */}
      <Accordion title={`☕ ${lang === 'zh' ? '请我喝杯咖啡' : 'Treat Me a Coffee'}`}>
        <TreatCoffee lang={lang} user={user} onShowPayModal={setPayModal} />
      </Accordion>

      {/* About */}
      <Accordion title={t('appSection')}>
        <div className="jsave-setting-row">
          <span className="jsave-label">{t('versionLabel')}</span>
          <span className="jsave-section-sub">v{JSAVE_VERSION}</span>
        </div>
        <div className="jsave-setting-row" style={{ marginBottom: 12 }}>
          <span className="jsave-label">{t('cacheSizeLabel')}</span>
          <CacheSize t={t} />
        </div>
        <button
          className="jsave-btn-ghost jsave-btn-full"
          style={{ marginBottom: 8 }}
          onClick={() => setShowReleaseNotes(true)}
        >
          🚀 {t('whatsNewTitle')}
        </button>
        {!isStandalone() && (
          <button
            className="jsave-btn-ghost jsave-btn-full"
            style={{ marginBottom: 8 }}
            onClick={() => doInstall(setInstallGuide)}
          >
            📲 {t('installTitle')}
          </button>
        )}
        <ClearCacheButton t={t} online={online} />
        {admin && onOpenAdmin && (
          <button
            className="jsave-btn-ghost jsave-btn-full"
            style={{ marginTop: 8 }}
            onClick={onOpenAdmin}
          >
            🔐 {lang === 'zh' ? '管理面板' : 'Admin Panel'}
          </button>
        )}
      </Accordion>

      {/* Sign out */}
      <button className="jsave-btn-ghost jsave-btn-full jsave-signout" onClick={() => signOut(auth)}>
        {t('logout')}
      </button>

      {payModal && (
        <CoffeePayModal
          zh={lang === 'zh'}
          url={payModal.url}
          amount={payModal.amount}
          onCancel={() => { setPayModal(null); setPayCancelled(true) }}
        />
      )}
      {payCancelled && (
        <CoffeeCancelledModal
          zh={lang === 'zh'}
          onClose={() => setPayCancelled(false)}
        />
      )}

      {showReleaseNotes && (
        <ReleaseNotesModal lang={lang} t={t} onClose={() => setShowReleaseNotes(false)} />
      )}

      {installGuide && (
        <div className="jsave-modal-overlay" onClick={() => setInstallGuide(null)}>
          <div className="jsave-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="jsave-modal-title">
              <span>{installGuide === 'android' ? '🤖' : '💻'} {installGuide === 'android' ? (lang === 'zh' ? 'Android 安装' : 'Install on Android') : (lang === 'zh' ? '桌面端安装' : 'Install on Desktop')}</span>
              <button className="jsave-modal-close" aria-label={t('close')} onClick={() => setInstallGuide(null)}>✕</button>
            </div>
            <ol className="jsave-install-guide-steps">
              {(installGuide === 'android'
                ? (lang === 'zh'
                    ? ['点击右上角 ⋮ 菜单', '选择「添加到主屏幕」或「安装应用」', '点击「添加」确认']
                    : ['Tap the ⋮ menu in Chrome (top-right)', 'Tap "Add to Home screen" or "Install app"', 'Tap "Add" to confirm'])
                : (lang === 'zh'
                    ? ['点击地址栏右侧的安装图标（⊕）', '点击「安装」即可']
                    : ['Click the install icon (⊕) in the address bar', 'Click "Install"'])
              ).map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        </div>
      )}

      {showAccForm && (
        <AccountForm
          initial={editAcc} t={t}
          onSave={async (data) => {
            if (editAcc?.id) await updateAccount(editAcc.id, data)
            else await addAccount(data)
            setShowAccForm(false)
          }}
          onDelete={async () => {
            if (editAcc?.id && window.confirm(t('confirmDelete'))) {
              await deleteAccount(editAcc.id)
              setShowAccForm(false)
            }
          }}
          onClose={() => setShowAccForm(false)}
        />
      )}
    </div>
  )
}

function AccountForm({ initial, t, onSave, onDelete, onClose }) {
  const [name,           setName]           = useState(initial?.name ?? '')
  const [type,           setType]           = useState(initial?.type ?? 'accBank')
  const [initialBalance, setInitialBalance] = useState(initial?.initialBalance?.toString() ?? '0')
  const [color,          setColor]          = useState(initial?.color ?? '#10b981')

  async function handleSubmit(e) {
    e.preventDefault()
    await onSave({ name, type, initialBalance: Number(initialBalance), color })
  }

  return (
    <div className="jsave-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card" role="dialog" aria-modal="true">
        <h2 className="jsave-modal-title">{initial?.id ? t('accountsSection') : t('addAccount')}</h2>
        <form onSubmit={handleSubmit} className="jsave-form">
          <label className="jsave-label">{t('accountName')}</label>
          <input className="jsave-input" placeholder={t('accountNamePh')} value={name} onChange={e => setName(e.target.value)} required />

          <label className="jsave-label">{t('accountType')}</label>
          <select className="jsave-input" value={type} onChange={e => setType(e.target.value)}>
            {ACC_TYPES.map(at => <option key={at} value={at}>{t(at)}</option>)}
          </select>

          <label className="jsave-label">Initial Balance</label>
          <input className="jsave-input" type="number" step="0.01" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />

          <label className="jsave-label">{t('accountColor')}</label>
          <div className="jsave-color-row">
            {ACC_COLORS.map(c => (
              <button key={c} type="button"
                className={`jsave-color-dot${color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)} />
            ))}
          </div>

          <div className="jsave-form-actions">
            {initial?.id && <button type="button" className="jsave-btn-danger" onClick={onDelete}>{t('delete')}</button>}
            <button type="button" className="jsave-btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="jsave-btn-primary">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
