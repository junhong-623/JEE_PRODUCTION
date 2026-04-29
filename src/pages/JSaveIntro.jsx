import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { RELEASE_NOTES } from '../jsave/data/releaseNotes'
import './JSaveIntro.css'

const FEATURES = [
  {
    icon: '💰',
    title: 'Track Every Transaction',
    titleZh: '记录每一笔交易',
    desc: 'Log income, expenses, and transfers across multiple accounts. See monthly summaries and exactly where your money goes.',
    descZh: '轻松记录多账户的收入、支出和转账，随时掌握每月收支状况。',
  },
  {
    icon: '📦',
    title: 'Cost Per Day',
    titleZh: '物品日均成本',
    desc: 'Add items you own and track cost-per-day. Find out which purchases were truly worth it.',
    descZh: '追踪你买过的物品，计算每日成本，了解哪些东西真的超值。',
  },
  {
    icon: '📊',
    title: 'Smart Reports',
    titleZh: '智能报表',
    desc: 'Visualise spending trends, category breakdowns, and balance growth over time with beautiful charts.',
    descZh: '通过精美图表直观呈现支出趋势、类别分布与余额增长。',
  },
  {
    icon: '🔔',
    title: 'Daily Reminders',
    titleZh: '每日提醒',
    desc: 'Get notified at 1PM & 8PM if you have not logged anything today — even when the app is fully closed.',
    descZh: '若今日未记账，将在下午1点和晚8点推送通知提醒，即使应用已关闭。',
  },
  {
    icon: '💾',
    title: 'Offline First',
    titleZh: '离线优先',
    desc: 'All data is saved locally first. Changes sync to the cloud automatically when you are back online.',
    descZh: '所有数据优先存储在本地，联网后自动同步到云端，随时可用。',
  },
  {
    icon: '🤖',
    title: 'Auto Salary',
    titleZh: '自动薪资',
    desc: 'Set your salary day and monthly income once. JSave adds it automatically every month.',
    descZh: '设置发薪日与月收入，J省每月自动帮你记录薪资入账。',
  },
]

const PWA_STEPS = {
  en: [
    { platform: 'Android (Chrome)', icon: '🤖', steps: ['Tap the ⋮ menu (top-right of Chrome)', 'Tap "Add to Home screen" or "Install app"', 'Tap "Add" to confirm'] },
    { platform: 'iPhone / iPad (Safari)', icon: '🍎', steps: ['Tap the Share button (□↑) at the bottom of Safari', 'Scroll and tap "Add to Home Screen"', 'Tap "Add" to finish'] },
    { platform: 'Desktop (Chrome / Edge)', icon: '💻', steps: ['Click the install icon (⊕) in the address bar', 'Click "Install"'] },
  ],
  zh: [
    { platform: 'Android（Chrome）', icon: '🤖', steps: ['点击右上角 ⋮ 菜单', '选择「添加到主屏幕」或「安装应用」', '点击「添加」确认'] },
    { platform: 'iPhone / iPad（Safari）', icon: '🍎', steps: ['点击 Safari 底栏的分享按钮（□↑）', '向下滑动，点击「添加到主屏幕」', '点击「添加」完成'] },
    { platform: '桌面端（Chrome / Edge）', icon: '💻', steps: ['点击地址栏右侧的安装图标（⊕）', '点击「安装」即可'] },
  ],
}

export default function JSaveIntro() {
  const [lang, setLang] = useState(() => localStorage.getItem('jsave-lang') || 'en')
  const [showAllChangelog, setShowAllChangelog] = useState(false)
  const changelogRef = useRef(null)
  const pwaInstallRef = useRef(null)
  const deferredPromptRef = useRef(null)
  const [installGuide, setInstallGuide] = useState(null) // null | 'android' | 'desktop'

  const zh = lang === 'zh'

  useEffect(() => {
    const onBeforeInstall = e => { e.preventDefault(); deferredPromptRef.current = e }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // Load pwa-install for iOS dialog only
    const setup = async () => {
      if (!customElements.get('pwa-install')) {
        await new Promise(resolve => {
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/npm/@khmyznikov/pwa-install/dist/pwa-install.bundle.js'
          s.onload = resolve
          document.head.appendChild(s)
        })
        await customElements.whenDefined('pwa-install')
      }
      const el = document.createElement('pwa-install')
      el.setAttribute('manifest-url', '/jsave/manifest.json')
      el.setAttribute('name', 'JSave')
      el.setAttribute('description', zh ? 'J样省钱，J样享受！' : 'J-Save, J-Joy — personal finance PWA')
      el.setAttribute('icon', '/jsave/icons/icon-192.png')
      el.setAttribute('manual-apple', '')
      document.body.appendChild(el)
      pwaInstallRef.current = el
    }
    setup()
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      pwaInstallRef.current?.remove()
      pwaInstallRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const showInstall = () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt()
      deferredPromptRef.current = null
    } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      pwaInstallRef.current?.showDialog()
    } else if (/Android/i.test(navigator.userAgent)) {
      setInstallGuide('android')
    } else {
      setInstallGuide('desktop')
    }
  }

  useEffect(() => {
    if (pwaInstallRef.current) {
      pwaInstallRef.current.setAttribute('description', zh ? 'J样省钱，J样享受！' : 'J-Save, J-Joy — personal finance PWA')
    }
  }, [zh])

  const CHANGELOG_PREVIEW = 5
  const visibleNotes = showAllChangelog ? RELEASE_NOTES : RELEASE_NOTES.slice(0, CHANGELOG_PREVIEW)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const scrollTo = () => document.querySelector(hash)?.scrollIntoView({ behavior: 'instant' })
    requestAnimationFrame(scrollTo)
    const t = setTimeout(scrollTo, 700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.ji-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const metaTitle = zh
    ? 'J省 — J样省钱，J样享受！'
    : 'JSave — J-Save, J-Joy'
  const metaDesc = zh
    ? '个人理财 PWA — 记录收支、追踪物品日均成本、智能提醒、离线优先。免费使用，可安装到主屏幕。'
    : 'JSave — a personal finance PWA. Track income, expenses, cost-per-day, get smart reminders and work fully offline.'

  return (
    <div className="ji-root">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content="https://www.jeeprod.com/jsave-intro" />
        <meta property="og:image" content="https://www.jeeprod.com/jsave/icons/icon-512.png" />
        <link rel="canonical" href="https://www.jeeprod.com/jsave-intro" />
      </Helmet>

      {/* ── Navbar ── */}
      <header className="ji-nav">
        <div className="ji-nav-inner">
          <a href="/jsave-intro" className="ji-brand">
            <img src="/jsave/icons/icon-192.png" alt="JSave" className="ji-brand-icon" />
            <span className="ji-brand-name">JSave</span>
            <span className="ji-brand-zh">J省</span>
          </a>
          <nav className="ji-nav-links">
            <a href="#features">{zh ? '功能' : 'Features'}</a>
            <a href="#install">{zh ? '安装' : 'Install'}</a>
            <a href="#changelog">{zh ? '更新' : 'Changelog'}</a>
          </nav>
          <div className="ji-nav-actions">
            <button className="ji-lang-btn" onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')}>
              {zh ? '🇺🇸 EN' : '🇨🇳 中文'}
            </button>
            <Link to="/jsave" className="ji-cta-btn">
              {zh ? '打开应用' : 'Open App'} →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="ji-hero">
        <span className="ji-hero-deco ji-deco-1">💰</span>
        <span className="ji-hero-deco ji-deco-2">📊</span>
        <span className="ji-hero-deco ji-deco-3">💾</span>
        <span className="ji-hero-deco ji-deco-4">🔔</span>
        <span className="ji-hero-deco ji-deco-5">✨</span>

        <div className="ji-hero-inner">
          <div className="ji-hero-content">
            <div className="ji-hero-badge">{zh ? '✨ 免费 · 无需下载' : '✨ Free · No download needed'}</div>
            <h1 className="ji-hero-title">
              {zh
                ? <>
                    {'J样省钱，'.split('').map((c, i) => (
                      <span key={i} className="ji-hero-char" style={{ animationDelay: `${i * 0.08}s` }}>{c}</span>
                    ))}
                    <br />
                    {'J样享受。'.split('').map((c, i) => (
                      <span key={i + 5} className="ji-hero-char" style={{ animationDelay: `${(i + 5) * 0.08}s` }}>{c}</span>
                    ))}
                  </>
                : <>
                    {'J-Save,'.split('').map((c, i) => (
                      <span key={i} className="ji-hero-char" style={{ animationDelay: `${i * 0.07}s` }}>{c}</span>
                    ))}
                    {' '}
                    <span className="ji-hero-accent">
                      {'J-Joy.'.split('').map((c, i) => (
                        <span key={i} className="ji-hero-char" style={{ animationDelay: `${(i + 8) * 0.07}s` }}>{c}</span>
                      ))}
                    </span>
                  </>}
            </h1>
            <p className="ji-hero-sub">
              {zh
                ? 'J省 是你的个人理财助手 — 记账、追踪物品成本、智能提醒，支持离线使用。'
                : 'JSave is your personal finance companion — track expenses, monitor cost-per-day, get smart reminders and work fully offline.'}
            </p>
            <div className="ji-hero-actions">
              <Link to="/jsave" className="ji-btn-primary">
                🚀 {zh ? '免费开始使用' : 'Get Started Free'}
              </Link>
              <a href="#features" className="ji-btn-ghost">
                {zh ? '了解功能' : 'See Features'} ↓
              </a>
            </div>
            <p className="ji-hero-note">
              {zh
                ? '✓ 无需下载 · 浏览器直接使用 · 可安装到主屏幕'
                : '✓ No download · Works in any browser · Installable as PWA'}
            </p>
            <div className="ji-hero-stats">
              <div className="ji-stat">
                <span className="ji-stat-num">6</span>
                <span className="ji-stat-label">{zh ? '核心功能' : 'Core features'}</span>
              </div>
              <div className="ji-stat">
                <span className="ji-stat-num">2</span>
                <span className="ji-stat-label">{zh ? '支持语言' : 'Languages'}</span>
              </div>
              <div className="ji-stat">
                <span className="ji-stat-num">PWA</span>
                <span className="ji-stat-label">{zh ? '可安装' : 'Installable'}</span>
              </div>
            </div>
          </div>

          <div className="ji-hero-visual">
            <div className="ji-hero-icon-wrap">
              <img src="/jsave/icons/icon-192.png" alt="JSave" className="ji-hero-icon" />
              <div className="ji-hero-glow" />
            </div>
            <div className="ji-hero-chip ji-chip-1">💰 {zh ? '自动记账' : 'Auto log'}</div>
            <div className="ji-hero-chip ji-chip-2">📊 {zh ? '支出报表' : 'Reports'}</div>
            <div className="ji-hero-chip ji-chip-3">🔔 {zh ? '每日提醒' : 'Reminders'}</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="ji-section" id="features">
        <div className="ji-section-inner">
          <div className="ji-section-label ji-reveal">{zh ? '核心功能' : 'Features'}</div>
          <h2 className="ji-section-title ji-reveal ji-reveal-d1">
            {zh ? '理财所需，一应俱全' : 'Everything your wallet needs'}
          </h2>
          <p className="ji-section-sub ji-reveal ji-reveal-d2">
            {zh
              ? '从日常记账到长期资产追踪，J省 为你的每一分钱保驾护航。'
              : 'From daily tracking to long-term cost analysis — JSave covers every corner of your finances.'}
          </p>
          <div className="ji-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`ji-feature-card ji-reveal ji-reveal-d${Math.min(i + 1, 5)}`}>
                <div className="ji-feature-icon">{f.icon}</div>
                <div className="ji-feature-title">{zh ? f.titleZh : f.title}</div>
                <div className="ji-feature-desc">{zh ? f.descZh : f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install guide ── */}
      <section className="ji-section ji-section--alt" id="install">
        <div className="ji-section-inner">
          <div className="ji-section-label ji-reveal">{zh ? '安装指南' : 'Install Guide'}</div>
          <h2 className="ji-section-title ji-reveal ji-reveal-d1">
            {zh ? '添加到主屏幕' : 'Add to your Home Screen'}
          </h2>
          <p className="ji-section-sub ji-reveal ji-reveal-d2">
            {zh
              ? '将 J省 安装到主屏幕，获得原生应用般的体验，支持离线使用。'
              : 'Install JSave as a PWA for a full native-like experience — works offline too.'}
          </p>
          <button className="ji-install-btn ji-reveal ji-reveal-d3" onClick={showInstall}>
            📲 {zh ? '安装到主屏幕' : 'Install App'}
          </button>
          <div className="ji-install-grid ji-reveal ji-reveal-d4">
            {PWA_STEPS[zh ? 'zh' : 'en'].map(s => (
              <div key={s.platform} className="ji-install-card">
                <div className="ji-install-platform">{s.icon} {s.platform}</div>
                <ol className="ji-install-steps">
                  {s.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Changelog ── */}
      <section className="ji-section" id="changelog">
        <div className="ji-section-inner">
          <div className="ji-section-label ji-reveal">{zh ? '更新日志' : 'Changelog'}</div>
          <h2 className="ji-section-title ji-reveal ji-reveal-d1">
            {zh ? '持续更新，不断进步' : "What's New"}
          </h2>
          <div className="ji-changelog ji-reveal ji-reveal-d2" ref={changelogRef}>
            {visibleNotes.map(r => (
              <div key={r.version} className="ji-changelog-entry">
                <div className="ji-changelog-meta">
                  <span className="ji-changelog-version">v{r.version}</span>
                  {r.isLatest && <span className="ji-changelog-badge">{zh ? '最新' : 'latest'}</span>}
                  <span className="ji-changelog-date">{r.date}</span>
                </div>
                <ul className="ji-changelog-items">
                  {(zh && r.itemsZh ? r.itemsZh : r.items).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
            {!showAllChangelog && RELEASE_NOTES.length > CHANGELOG_PREVIEW && (
              <button className="ji-changelog-more" onClick={() => setShowAllChangelog(true)}>
                {zh ? `查看全部 ${RELEASE_NOTES.length} 个版本 ↓` : `Show all ${RELEASE_NOTES.length} versions ↓`}
              </button>
            )}
            {showAllChangelog && (
              <button className="ji-changelog-more" onClick={() => {
                setShowAllChangelog(false)
                changelogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}>
                {zh ? '收起 ↑' : 'Show less ↑'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ji-cta-section">
        <span className="ji-cta-deco ji-cta-d1">💰</span>
        <span className="ji-cta-deco ji-cta-d2">📊</span>
        <span className="ji-cta-deco ji-cta-d3">✨</span>
        <div className="ji-cta-inner ji-reveal">
          <img src="/jsave/icons/icon-192.png" alt="JSave" className="ji-cta-icon" />
          <h2 className="ji-cta-title">
            {zh ? '准备好开始了吗？' : 'Ready to save smarter?'}
          </h2>
          <p className="ji-cta-sub">
            {zh
              ? '免费注册，立即开始记录你的每一笔收支。'
              : 'Sign up for free and start tracking every dollar today.'}
          </p>
          <Link to="/jsave" className="ji-btn-primary" style={{ fontSize: 16, padding: '15px 40px' }}>
            🚀 {zh ? '立即开始' : 'Get Started Free'}
          </Link>
          <p style={{ marginTop: 14, fontSize: 12, opacity: 0.5 }}>
            {zh ? '免费使用 · 无需信用卡' : 'Free forever · No credit card required'}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="ji-footer">
        <div className="ji-footer-inner">
          <div className="ji-footer-brand">
            <img src="/jsave/icons/icon-192.png" alt="JSave" style={{ width: 26, height: 26, borderRadius: 7 }} />
            <span>JSave <span style={{ color: 'var(--ji-primary)' }}>J省</span></span>
          </div>
          <div className="ji-footer-links">
            <Link to="/jsave">{zh ? '打开应用' : 'Open App'}</Link>
            <a href="https://www.jeeprod.com" target="_blank" rel="noopener noreferrer">jeeprod.com</a>
          </div>
          <p className="ji-footer-copy">
            © {new Date().getFullYear()} JSave · Built by{' '}
            <a href="https://www.jeeprod.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Jee Production
            </a>
          </p>
        </div>
      </footer>

      {/* ── Install guide modal (Android / Desktop) ── */}
      {installGuide && (() => {
        const langKey = zh ? 'zh' : 'en'
        const step = installGuide === 'android' ? PWA_STEPS[langKey][0] : PWA_STEPS[langKey][2]
        return (
          <div className="ji-overlay" onClick={() => setInstallGuide(null)}>
            <div className="ji-install-modal" onClick={e => e.stopPropagation()}>
              <button className="ji-install-modal-close" onClick={() => setInstallGuide(null)}>✕</button>
              <div className="ji-install-modal-icon">{step.icon}</div>
              <h3 className="ji-install-modal-title">{step.platform}</h3>
              <ol className="ji-install-modal-steps">
                {step.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <p className="ji-install-modal-hint">
                {zh ? '📌 如未看到安装图标，请先访问应用页面再尝试。' : '📌 No install icon? Visit the app page first.'}
                {' '}<Link to="/jsave" style={{ color: 'var(--ji-primary)' }}>jeeprod.com/jsave</Link>
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
