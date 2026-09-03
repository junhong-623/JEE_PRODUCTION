import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import AnimatedJeepLogo from '../components/AnimatedJeepLogo'
import '../styles/home-hud.css'

const AuthModal = lazy(() => import('../components/AuthModal'))
const AdminPanel = lazy(() => import('../components/AdminPanel'))
const ENTRIES_UPDATED_EVENT = 'jeeprod:entries-updated'

/* ── Static data ─────────────────────────────────────────────────────────── */

const SPEC_CATEGORIES = [
  {
    cat: 'FRONTEND_RIG', id: 'F-001',
    items: [
      { name: 'React',        icon: 'react',    level: 92 },
      { name: 'JavaScript',   icon: 'js',       level: 95 },
      { name: 'HTML / CSS',   icon: 'html',     level: 96 },
      { name: 'Tailwind',     icon: 'tailwind', level: 88 },
      { name: 'jQuery',       icon: 'jquery',   level: 78 },
      { name: 'PHP',          icon: 'php',      level: 80 },
    ],
  },
  {
    cat: 'BACKEND_STACK', id: 'B-002',
    items: [
      { name: 'Firebase',     icon: 'firebase', level: 90 },
      { name: 'Node.js',      icon: 'nodejs',   level: 82 },
      { name: 'MySQL',        icon: 'mysql',    level: 76 },
      { name: 'C# / ASP',     icon: 'cs',       level: 60 },
      { name: 'REST / OAuth', icon: null,       level: 80 },
      { name: 'Payment APIs', icon: null,       level: 84 },
    ],
  },
  {
    cat: 'TOOLCHAIN', id: 'T-003',
    items: [
      { name: 'Vite',           icon: 'vite',   level: 92 },
      { name: 'Git',            icon: 'git',    level: 92 },
      { name: 'Figma',          icon: 'figma',  level: 70 },
      { name: 'Cloudflare',     icon: null,     level: 70 },
      { name: 'Puppeteer',      icon: null,     level: 76 },
      { name: 'GitHub Actions', icon: null,     level: 80 },
    ],
  },
]

const MISSIONS = [
  {
    id: 'M-001', name: 'MateTrip', zh: '伴旅',
    tagEn: '// Travel together, split with ease.',
    tagZh: '// 算清一路琐碎，存下全程风景。',
    descEn: 'All-in-one travel companion PWA — split bills, share photos, plan itineraries, stay connected with your crew.',
    descZh: '一款专为旅行设计的 PWA — 分账、相册、行程规划、旅伴留言，全在一个应用内搞定。',
    icon: '/matetrip/icons/icon-192.png',
    detailsHref: '/matetrip/intro',
    appHref: 'https://matetrip.jeeprod.com',
    color: '#c8643c', glow: 'rgba(200,100,60,0.22)',
    status: 'LIVE', kind: 'green',
    facts: [
      { k: 'TYPE', en: 'live travel PWA', zh: '已上线旅行 PWA' },
      { k: 'BUILT FOR', en: 'group trips', zh: '多人旅行' },
      { k: 'CORE', en: 'split · plan · share', zh: '分账 · 行程 · 相册' },
    ],
  },
  {
    id: 'M-002', name: 'JSave', zh: 'J省',
    tagEn: '// Personal finance, offline-first.',
    tagZh: '// J样省钱，J样享受。',
    descEn: 'Track every transaction, monitor cost-per-day for owned items, get smart daily reminders, work fully offline.',
    descZh: '离线优先的个人理财 PWA — 记录收支、追踪预算、日历热力图、物品日均成本，随时随地掌控财务。',
    icon: '/jsave/icons/icon-192.png',
    detailsHref: '/jsave-intro',
    appHref: 'https://jsave.jeeprod.com',
    color: '#10b981', glow: 'rgba(16,185,129,0.22)',
    status: 'LIVE', kind: 'green',
    facts: [
      { k: 'TYPE', en: 'offline-first PWA', zh: '离线优先 PWA' },
      { k: 'BUILT FOR', en: 'personal finance', zh: '个人财务管理' },
      { k: 'CORE', en: 'track · budget · remind', zh: '记账 · 预算 · 提醒' },
    ],
  },
  {
    id: 'M-003', name: 'JeeProd Mall',
    tagEn: '// A working commerce demo.',
    tagZh: '// 可以完整操作的商店 Demo。',
    descEn: 'A JeeProd demo storefront covering product discovery, cart, checkout, WhatsApp ordering, and order tracking.',
    descZh: 'JeeProd 的电商流程 Demo，包含商品浏览、购物车、结账、WhatsApp 下单和订单追踪。',
    icon: '/logo.svg',
    detailsHref: '/mall/intro',
    appHref: '/mall',
    color: '#3a9a3a', glow: 'rgba(58,154,58,0.22)',
    status: 'DEMO', kind: 'amber',
    facts: [
      { k: 'TYPE', en: 'e-commerce demo', zh: '电商 Demo' },
      { k: 'BUILT FOR', en: 'store workflows', zh: '商店流程展示' },
      { k: 'CORE', en: 'browse · cart · order', zh: '浏览 · 购物车 · 下单' },
    ],
  },
  {
    id: 'M-004', name: 'Cheers.co',
    tagEn: '// An independent store in production.',
    tagZh: '// 独立运营、已经上线的商店。',
    descEn: 'A separate production storefront with customer accounts, checkout, orders, coupons, analytics, and a full admin workflow.',
    descZh: '独立上线的商店产品，包含会员、结账、订单、优惠券、数据报表和完整管理后台。',
    icon: 'https://cheers-co.jeeprod.com/logo-300.png',
    appHref: 'https://cheers-co.jeeprod.com',
    color: '#b65642', glow: 'rgba(182,86,66,0.22)',
    status: 'LIVE', kind: 'green',
    facts: [
      { k: 'TYPE', en: 'production store', zh: '已上线商店' },
      { k: 'BUILT FOR', en: 'real operations', zh: '真实业务运营' },
      { k: 'CORE', en: 'orders · admin · reports', zh: '订单 · 后台 · 报表' },
    ],
  },
]

const SOCIAL = [
  {
    label: 'GitHub', href: 'https://github.com/junhong-623',
    path: 'M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z',
  },
  {
    label: 'Instagram', href: 'https://www.instagram.com/junhong623/',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
  {
    label: 'WhatsApp', href: 'https://wa.me/60126947823',
    path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z',
  },
]

const BUILD_NOTES = [
  { project: 'MateTrip', en: 'Designed one shared flow for trip planning, expenses, photos, and companions.', zh: '把行程、分账、相册和旅伴协作收进同一套旅行流程。' },
  { project: 'JSave', en: 'Built the finance workflow offline-first so daily use does not depend on a connection.', zh: '用离线优先方式做日常记账，没网络时也能继续使用。' },
  { project: 'Cheers.co', en: 'Connected the customer storefront to orders, coupons, reporting, and store operations.', zh: '把顾客下单、优惠券、订单处理和后台报表串成完整商店系统。' },
  { project: 'JeeProd Mall', en: 'Kept a public demo where the full store journey can be tested without touching production.', zh: '保留一套公开 Demo，让人可以直接走完商店流程，又不会碰到正式业务。' },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/* ── Boot sequence ───────────────────────────────────────────────────────── */

function BootSequence() {
  const [gone, setGone] = useState(() => sessionStorage.getItem('jeeprod:boot-seen') === 'true')
  const lines = [
    { t: 0,   text: '> initializing jeeprod.systems v2.0.0',  cls: 'busy' },
    { t: 120, text: '> mounting /telemetry',                   cls: 'ok' },
    { t: 240, text: '> loading react@18 · vite · firebase',   cls: 'ok' },
    { t: 360, text: '> negotiating uplink with 8.8.8.8',      cls: 'ok' },
    { t: 480, text: '> calibrating terracotta accent E8440A', cls: 'ok acc' },
    { t: 600, text: '> ready_',                               cls: 'ok' },
  ]
  useEffect(() => {
    if (gone) return undefined
    const timer = setTimeout(() => {
      sessionStorage.setItem('jeeprod:boot-seen', 'true')
      setGone(true)
    }, 700)
    return () => clearTimeout(timer)
  }, [gone])
  return (
    <div className={`boot${gone ? ' gone' : ''}`}>
      {lines.map((l, i) => (
        <div key={i} className={`boot-line${l.cls ? ' ' + l.cls : ''}`} style={{ animationDelay: `${l.t}ms` }}>
          {l.text}
        </div>
      ))}
    </div>
  )
}

/* ── Telemetry strip ─────────────────────────────────────────────────────── */

function Telemetry() {
  const now = useClock()
  const kl  = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour12: false })
  return (
    <div className="hud-telemetry">
      <div className="tele-left">
        <span className="seg ok">●<b>SYS_OK</b></span>
        <span className="seg">KL<b>{kl}</b></span>
        <span className="seg">ROLE<b>FULL-STACK ENGINEER</b></span>
      </div>
      <div className="tele-right">
        <span className="seg ok">●<b>OPEN TO WORK &amp; PROJECTS</b></span>
      </div>
    </div>
  )
}

/* ── HUD Nav (replaces Navbar, keeps auth/lang/admin) ────────────────────── */

function HudNav() {
  const { lang, toggleLang, t } = useLang()
  const { user, admin } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminDropOpen, setAdminDropOpen] = useState(false)

  return (
    <>
      <nav className="hud-nav">
        <div className="hud-nav-inner">
          {/* Brand */}
          <a className="hud-brand" href="#top">
            <span className="mark"><img src="/logo.svg" alt="" /></span>
            <span className="name">JeeProd</span>
            <span className="ver">// v2.0</span>
          </a>

          {/* Section links */}
          <div className="hud-nav-links">
            <a href="#missions"><span className="num">01</span>{lang === 'zh' ? '产品' : 'products'}</a>
            <a href="#about"><span className="num">02</span>{lang === 'zh' ? '关于' : 'about'}</a>
            <a href="#specs"><span className="num">03</span>{lang === 'zh' ? '技术' : 'specs'}</a>
            <a href="#archive"><span className="num">04</span>{lang === 'zh' ? '作品集' : 'archive'}</a>
            <a href="#transmissions"><span className="num">06</span>{lang === 'zh' ? '做法' : 'process'}</a>
          </div>

          {/* Controls */}
          <div className="hud-nav-actions">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="hud-status muted"
              style={{ cursor: 'pointer', border: 'none', background: 'none' }}
              title={t('toggleLanguage')}
            >
              <span className="dot" />
              {lang === 'en' ? '中文' : 'EN'}
            </button>

            {/* Admin dropdown */}
            {admin && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setAdminDropOpen(v => !v)}
                  className="hud-btn-ghost"
                  style={{ padding: '6px 14px', fontSize: 11, gap: 6 }}
                >
                  {t('admin')}
                  <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor" style={{ opacity: 0.5 }}>
                    <path d="M3.5 5L0 0h7z" />
                  </svg>
                </button>
                {adminDropOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setAdminDropOpen(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, minWidth: 156,
                      background: 'rgba(5,10,20,0.96)', border: '1px solid var(--hud-border)',
                      borderRadius: 4, padding: '4px 0', backdropFilter: 'blur(12px)',
                    }}>
                      {[
                        { label: 'Portfolio', action: () => { setAdminDropOpen(false); setAdminOpen(true) }, color: 'var(--hud-fg-2)' },
                        { label: 'MateTrip',  action: () => { setAdminDropOpen(false); navigate('/matetrip-admin') }, color: 'var(--hud-cyan)' },
                        { label: 'Mall',      action: () => { setAdminDropOpen(false); navigate('/mall/admin') }, color: 'var(--hud-green)' },
                        { label: 'ℋ Agency', action: () => { setAdminDropOpen(false); navigate('/h-agency/admin') }, color: 'var(--hud-amber)' },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={{
                          display: 'block', width: '100%', padding: '8px 16px',
                          fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.18em', color: item.color, background: 'none',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Auth */}
            {user ? (
              <button onClick={() => import('../lib/auth').then(({ logout }) => logout())} className="hud-btn-ghost" style={{ padding: '6px 14px', fontSize: 11 }}>
                {t('logout')}
              </button>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="hud-btn-ghost" style={{ padding: '6px 14px', fontSize: 11 }}>
                {t('login')}
              </button>
            )}

            {/* Contact shortcut */}
            <a className="hud-btn" href="#contact" style={{ padding: '6px 14px', fontSize: 11 }}>
              {lang === 'zh' ? '联系' : 'contact'}
            </a>
          </div>
        </div>
      </nav>

      {authOpen && (
        <Suspense fallback={null}>
          <AuthModal open onClose={() => setAuthOpen(false)} />
        </Suspense>
      )}
      {admin && adminOpen && (
        <Suspense fallback={null}>
          <AdminPanel open onClose={() => setAdminOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

/* ── Section eyebrow ─────────────────────────────────────────────────────── */

function SectionEyebrow({ id, num, name, title, sub, spec }) {
  return (
    <div className="hud-section-head" id={id}>
      <div>
        <div className="hud-eyebrow">
          <span className="bracket">[</span>
          <span className="id">SECTION_{num}</span>
          <span className="bracket">]</span>
          <span style={{ marginLeft: 4 }}>{name}</span>
        </div>
        <h2 className="hud-section-title">{title}</h2>
        {sub && <p className="hud-section-sub">{sub}</p>}
      </div>
      {spec && (
        <div className="hud-section-spec">
          {spec.map(s => <span key={s.k}>{s.k}<b>{s.v}</b></span>)}
          <span className="hud-status muted"><span className="dot" />READY</span>
        </div>
      )}
    </div>
  )
}

/* ── Orbital logo ────────────────────────────────────────────────────────── */

function OrbitLogo() {
  const labels = [
    { style: { top: '-8px', left: '50%', transform: 'translateX(-50%)' }, text: 'BUILD · SHIP · IMPROVE' },
    { style: { bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }, text: 'KUALA LUMPUR · GMT+8' },
  ]
  return (
    <div className="hud-orbit">
      <div className="hud-cross" />
      <div className="hud-orbit-ring r1">
        {labels.map((l, i) => (
          <span key={i} className="hud-ring-label" style={l.style}>{l.text}</span>
        ))}
      </div>
      <div className="hud-orbit-ring r2" />
      <div className="hud-orbit-ring r3" />
      <div className="hud-orbit-core">
        <AnimatedJeepLogo />
      </div>
    </div>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────── */

function Hero({ portfolioCount }) {
  const { lang } = useLang()
  return (
    <section className="hud-hero" id="top">
      <div className="hud-container">
        <div className="hud-hero-grid">
          <OrbitLogo />
          <div className="hud-hero-right">
            <div className="hud-hero-eyebrow">
              <span className="seg"><span className="bar" /> SECTION_00</span>
              <span className="seg acc">[0x00 INIT]</span>
            </div>

            <h1 className="hud-hero-title">
              Jee<br /><span className="acc">Production</span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              <span className="hud-status">
                <span className="dot" />
                {lang === 'zh' ? '操作员在线' : 'OPERATOR ONLINE'}
              </span>
              <span className="hud-status cyan">
                <span className="dot" />
                {lang === 'zh' ? '求职 · 合作 · 产品' : 'WORK · PROJECTS · PRODUCTS'}
              </span>
            </div>

            <p className="hud-hero-intro">
              {lang === 'zh'
                ? <>我是余俊宏，一名在<span>马来西亚</span>做产品的全栈软件工程师。我把想法从页面、后台一路做到上线，主要做 PWA、电商与订单流程、支付整合。</>
                : <>I&apos;m Jun Hong Jee, a full-stack software engineer in <span>Malaysia</span>. I take ideas from interface and back office through to launch, with a focus on PWAs, commerce workflows, and payments.</>
              }
            </p>

            <div className="hud-hero-readouts">
              <div className="hud-readout">
                <span className="k">ROLE</span>
                <span className="v">{lang === 'zh' ? '全栈软件工程师' : 'full-stack engineer'}</span>
              </div>
              <div className="hud-readout">
                <span className="k">BUILD</span>
                <span className="v acc">PWA · commerce · admin</span>
              </div>
              <div className="hud-readout">
                <span className="k">DELIVERY</span>
                <span className="v">{lang === 'zh' ? '从想法做到上线' : 'idea to production'}</span>
              </div>
              <div className="hud-readout">
                <span className="k">BASE</span>
                <span className="v cyan">Malaysia · remote</span>
              </div>
            </div>

            <div className="hud-hero-actions">
              <a className="hud-btn" href="#missions">
                <span className="arrow">&gt;</span>
                {lang === 'zh' ? '看重点产品' : 'view products'}
              </a>
              <a className="hud-btn-ghost" href="#contact">
                {lang === 'zh' ? '找我合作' : 'work with me'} <span>↓</span>
              </a>
            </div>

            <div className="hud-hero-stats">
              <div className="stat">
                <span className="v">{portfolioCount}<span className="small">/EA</span></span>
                <span className="l">{lang === 'zh' ? '作品' : 'projects'}</span>
              </div>
              <div className="stat">
                <span className="v">03<span className="small">/LIVE</span></span>
                <span className="l">{lang === 'zh' ? '上线产品' : 'live products'}</span>
              </div>
              <div className="stat">
                <span className="v">01<span className="small">/DEMO</span></span>
                <span className="l">{lang === 'zh' ? '可用演示' : 'working demo'}</span>
              </div>
              <div className="stat">
                <span className="v">08+<span className="small">/YR</span></span>
                <span className="l">{lang === 'zh' ? '开发经验' : 'experience'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── About ───────────────────────────────────────────────────────────────── */

function About() {
  const { lang, t } = useLang()
  return (
    <section className="hud-section">
      <div className="hud-container">
        <SectionEyebrow
          id="about" num="02" name="// ABOUT"
          title={lang === 'zh' ? '关于我' : 'About me'}
          sub={lang === 'zh' ? '$ cat ./about.md' : '$ cat ./about.md'}
          spec={[
            { k: 'TYPE:', v: 'IDENT' },
            { k: 'CLEARANCE:', v: 'PUBLIC' },
          ]}
        />
        <div className="hud-about-grid">
          <div className="hud-frame">
            <span className="br" />
            <div className="hud-terminal">
              <p className="lead">
                <span className="prompt">&gt;</span>
                {lang === 'zh'
                  ? <>我是 <span className="cyan">余俊宏（Jun Hong Jee）</span>。我喜欢做能真正拿来用的产品，不只把画面做完，也会把资料、权限、订单和后台一起顾好。</>
                  : <>I&apos;m <span className="cyan">Jun Hong Jee</span>. I like building products people can actually use, including the data, permissions, orders, and admin work behind the interface.</>
                }
              </p>
              <p>
                <span className="prompt">&gt;</span>
                {lang === 'zh'
                  ? '平时以 React、Vite、Firebase 和 Node 为主，也处理支付接口、PHP 系统整合与自动化工具。项目需要什么，我就把那一段补起来。'
                  : 'I mostly work with React, Vite, Firebase, and Node, and I also handle payment integrations, PHP systems, and automation when the product needs them.'
                }
              </p>
              <p>
                <span className="prompt">&gt;</span>
                {lang === 'zh'
                  ? <>屏幕之外 — 钓鱼、慢慢开着吉普车兜风，以及吉隆坡的安静周末。 <span className="ok">[exit 0]</span></>
                  : <>Outside the screen — fishing trips, slow drives in the Jeep, and quiet weekends in Klang Valley. <span className="ok">[exit 0]</span></>
                }
              </p>
            </div>
          </div>

          <div className="hud-frame cyan">
            <span className="br" />
            <div className="hud-neofetch">
              <div className="top">jun@jeeprod ~</div>
              <div className="sep">───────────────────────────────</div>
              <div className="row"><span className="k">os</span>        <span className="v">Earth, MY (gmt+8)</span></div>
              <div className="row"><span className="k">kernel</span>    <span className="v">{t('aboutRole')} 8.0</span></div>
              <div className="row"><span className="k">uptime</span>    <span className="v">{lang === 'zh' ? '8 年 11 月' : '8 yr, 11 mo'}</span></div>
              <div className="row"><span className="k">shell</span>     <span className="v">react / vite / php / sql</span></div>
              <div className="row"><span className="k">theme</span>     <span className="v">dark · terracotta (E8440A)</span></div>
              <div className="row"><span className="k">contact</span>   <span className="v">jeejunhong@gmail.com</span></div>
              <div className="row"><span className="k">role</span>      <span className="v">{lang === 'zh' ? '独立 · 合约 · ✶ 开放' : 'solo · contract · ✶ open'}</span></div>
              <div className="bar"><span /><span /><span /><span /><span /><span /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Skills ──────────────────────────────────────────────────────────────── */

function Skills() {
  const { lang } = useLang()
  return (
    <section className="hud-section">
      <div className="hud-container">
        <SectionEyebrow
          num="03" name="// SYSTEM_SPEC"
          title={lang === 'zh' ? '系统规格' : 'System specification'}
          sub="$ neofetch --jeeprod --json | jq ."
          spec={[{ k: 'COMPONENTS:', v: '18' }, { k: 'STATUS:', v: 'NOMINAL' }]}
        />
        <div id="specs" className="hud-spec">
          {SPEC_CATEGORIES.map(c => (
            <div key={c.cat} className="hud-frame hud-spec-card">
              <span className="br" />
              <div className="hud-spec-head">
                <span className="hud-spec-cat">{c.cat}</span>
                <span className="hud-spec-id">{c.id}</span>
              </div>
              <div className="hud-spec-list">
                {c.items.map(s => (
                  <div key={s.name} className="hud-spec-item">
                    <span className="hud-spec-name">
                      {s.icon
                        ? <img src={`https://skillicons.dev/icons?i=${s.icon}`} alt="" loading="lazy" />
                        : <span style={{ display: 'inline-block', width: 14 }} />
                      }
                      {s.name}
                    </span>
                    <span className="hud-spec-bar"><i style={{ width: `${s.level}%` }} /></span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Mission card ────────────────────────────────────────────────────────── */

function MissionCard({ m }) {
  const { lang } = useLang()
  const isExternal = (href) => href?.startsWith('http')
  return (
    <article
      className="hud-frame hud-mission"
      style={{ '--feat-color': m.color, '--feat-glow': m.glow }}
    >
      <span className="br" />
      <div className="hud-mission-head">
        <span className="hud-mission-id">{m.id} · {m.name.toUpperCase()}</span>
        <span className={`hud-status ${m.kind || 'green'}`}>
          <span className="dot" />{m.status}
        </span>
      </div>
      <div className="hud-mission-body">
        <div className="hud-mission-meta">
          <div className="hud-mission-icon" style={{ background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {m.icon ? <img src={m.icon} alt={m.name} /> : <span>{m.letter}</span>}
          </div>
          <div>
            <div className="hud-mission-name">
              {m.name}
              {m.zh && <span className="hud-mission-zh">{m.zh}</span>}
            </div>
            <p className="hud-mission-tag">{lang === 'zh' ? m.tagZh : m.tagEn}</p>
          </div>
        </div>
        <p className="hud-mission-desc">{lang === 'zh' ? m.descZh : m.descEn}</p>
        <div className="hud-mission-tele">
          {m.facts.map(fact => (
            <div key={fact.k} className="hud-readout">
              <span className="k">{fact.k}</span>
              <span className="v">{lang === 'zh' ? fact.zh : fact.en}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hud-mission-foot">
        {m.detailsHref && (
          <a className="mission-link" href={m.detailsHref}>
            {lang === 'zh' ? '了解项目' : 'project details'} <span>→</span>
          </a>
        )}
        <a
          className="mission-link launch"
          href={m.appHref}
          target={isExternal(m.appHref) ? '_blank' : undefined}
          rel={isExternal(m.appHref) ? 'noopener noreferrer' : undefined}
        >
          {lang === 'zh' ? (m.status === 'DEMO' ? '打开 Demo' : '打开产品') : (m.status === 'DEMO' ? 'open demo' : 'open product')}
          <span>{isExternal(m.appHref) ? '↗' : '→'}</span>
        </a>
      </div>
    </article>
  )
}

function Missions() {
  const { lang } = useLang()
  return (
    <section className="hud-section" id="missions">
      <div className="hud-container">
        <SectionEyebrow
          num="01" name="// PRODUCTS"
          title={lang === 'zh' ? '真正做出来的产品' : 'Products I have shipped'}
          sub={lang === 'zh' ? '上线产品、独立作品，以及一套可以直接操作的商店 Demo。' : 'Live products, independent work, and one store demo you can use end to end.'}
          spec={[{ k: 'PRODUCTS:', v: '4' }, { k: 'LIVE:', v: '3' }, { k: 'DEMO:', v: '1' }]}
        />
        <div className="hud-missions">
          {MISSIONS.map(m => <MissionCard key={m.id} m={m} />)}
        </div>
      </div>
    </section>
  )
}

/* ── HUD archive card (Firestore entry → HUD style) ─────────────────────── */

function HudEntryCard({ entry, index }) {
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const title = lang === 'zh' && entry.titleZh ? entry.titleZh : entry.title
  const description = lang === 'zh' && entry.descriptionZh ? entry.descriptionZh : entry.description
  const typePath = entry.type === 'bookmark' ? 'bookmarks' : 'portfolio'
  const openEntry = () => navigate(entry.internalPath || `/${typePath}/${entry.slug}`)

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openEntry}
      onKeyDown={e => e.key === 'Enter' && openEntry()}
      className="hud-frame hud-archive-item"
      style={{ cursor: 'pointer' }}
    >
      <span className="br" />
      <div className="hud-archive-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hud-archive-icon">
            {entry.iconUrl
              ? <img src={entry.iconUrl} alt={title} />
              : <span>{title?.[0]?.toUpperCase() ?? '?'}</span>
            }
          </div>
          <span className="hud-archive-id">
            P-{String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <span className="hud-archive-slug">/{entry.slug}</span>
      </div>
      <h3 className="hud-archive-name">{title}</h3>
      <p className="hud-archive-desc">{description || t('entryFallback')}</p>
      <div className="hud-archive-foot">
        <span className="o">{entry.type === 'bookmark' ? t('bookmarks') : t('portfolio')}</span>
        <span className="a">&gt; {entry.internalPath ? t('openApp') : t('openLink')}</span>
      </div>
    </article>
  )
}

/* ── Archive ─────────────────────────────────────────────────────────────── */

function Archive({ entries, loading }) {
  const { lang, t } = useLang()
  return (
    <section className="hud-section" id="archive">
      <div className="hud-container">
        <SectionEyebrow
          num="04" name="// ARCHIVE"
          title={lang === 'zh' ? '作品存档' : 'Project archive'}
          sub='$ git log --oneline --since="3.years.ago"'
          spec={[
            { k: 'ENTRIES:', v: loading ? '…' : entries.length },
            { k: 'INDEXED:', v: 'YES' },
          ]}
        />
        {loading ? (
          <div className="hud-archive">
            {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="hud-archive-skeleton" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="hud-frame" style={{ padding: '48px 28px', textAlign: 'center' }}>
            <span className="br" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--hud-fg-3)' }}>
              {t('portfolioEmpty')}
            </span>
          </div>
        ) : (
          <div className="hud-archive">
            {entries.map((entry, i) => (
              <HudEntryCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ── Bookmarks ───────────────────────────────────────────────────────────── */

function Bookmarks({ entries, loading }) {
  const { lang, t } = useLang()
  return (
    <section className="hud-section" id="bookmarks">
      <div className="hud-container">
        <SectionEyebrow
          num="05" name="// BOOKMARK_LOG"
          title={lang === 'zh' ? '精选书签' : 'Curated bookmarks'}
          sub={lang === 'zh' ? '$ cat ~/bookmarks.md | head -20' : '$ cat ~/bookmarks.md | head -20'}
          spec={[
            { k: 'ENTRIES:', v: loading ? '…' : entries.length },
            { k: 'CURATED:', v: 'YES' },
          ]}
        />
        {loading ? (
          <div className="hud-archive">
            {[0, 1, 2, 3].map(i => <div key={i} className="hud-archive-skeleton" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="hud-frame" style={{ padding: '48px 28px', textAlign: 'center' }}>
            <span className="br" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--hud-fg-3)' }}>
              {t('bookmarkEmpty')}
            </span>
          </div>
        ) : (
          <div className="hud-archive">
            {entries.map((entry, i) => (
              <HudEntryCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ── Transmissions ───────────────────────────────────────────────────────── */

function Transmissions() {
  const { lang } = useLang()
  return (
    <section className="hud-section" id="transmissions">
      <div className="hud-container">
        <SectionEyebrow
          num="06" name="// BUILD_NOTES"
          title={lang === 'zh' ? '我怎么把产品做完整' : 'How I build complete products'}
          sub={lang === 'zh' ? '不放虚构数字，只说每个项目实际解决了什么。' : 'No vanity metrics, just the real product work behind each build.'}
          spec={[{ k: 'NOTES:', v: BUILD_NOTES.length }, { k: 'SOURCE:', v: 'SELECTED' }]}
        />
        <div className="hud-frame hud-gh">
          <span className="br" />
          <div className="hud-gh-feed">
            {BUILD_NOTES.map((note, i) => (
              <div className="row" key={note.project}>
                <span className="ts">0{String(i + 1)}</span>
                <span className="repo">{note.project}</span>
                <span className="msg">{lang === 'zh' ? note.zh : note.en}</span>
                <span className="sha">DONE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Contact ─────────────────────────────────────────────────────────────── */

function ContactBlock() {
  const { lang, t } = useLang()
  return (
    <section className="hud-section" id="contact">
      <div className="hud-container">
        <SectionEyebrow
          num="07" name="// HANDSHAKE"
          title={lang === 'zh' ? '找我聊聊你的项目' : 'Tell me what you are building'}
          sub="$ echo $YOUR_MESSAGE | mail jeejunhong@gmail.com"
          spec={[{ k: 'INBOX:', v: lang === 'zh' ? '开放' : 'OPEN' }, { k: 'RESPONSE:', v: '< 24h' }]}
        />
        <div className="hud-frame hud-contact-frame">
          <span className="br" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="hud-terminal" style={{ fontSize: 14 }}>
              <p>
                <span className="prompt">&gt;</span>
                {lang === 'zh'
                  ? '你可以找我谈全职机会、freelance 项目，也可以聊 PWA、商店、管理后台或支付流程。把现在卡住的地方告诉我就好。'
                  : 'Reach out about full-time roles, freelance projects, PWAs, storefronts, admin systems, or payment flows. Tell me what is stuck and we can start there.'
                }
              </p>
              <p style={{ marginTop: 8 }}>
                <span className="prompt">&gt;</span>
                <a href="mailto:jeejunhong@gmail.com" style={{ color: 'var(--hud-acc)', textDecoration: 'none' }}>
                  jeejunhong@gmail.com
                </a>
                {' '}· {lang === 'zh' ? '收件箱开放' : 'open inbox'} · <span className="cyan">{lang === 'zh' ? '接受咨询中' : 'accepting'}</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a className="hud-btn" href="mailto:jeejunhong@gmail.com">
                <span className="arrow">&gt;</span>
                {lang === 'zh' ? '发送邮件' : 'compose_message'}
              </a>
              <a className="hud-btn-ghost" href="https://wa.me/60126947823" target="_blank" rel="noopener">
                WhatsApp <span>↗</span>
              </a>
              <a className="hud-btn-ghost" href="https://github.com/junhong-623" target="_blank" rel="noopener">
                GitHub <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

function HudFooter() {
  const { lang } = useLang()
  return (
    <footer className="hud-footer">
      <div className="hud-container">
        <div className="hud-footer-inner">
          <div className="foot-left">
            <img src="/logo.svg" alt="Jee Production" />
            <span className="name">JEEPROD · v2.0.dev</span>
          </div>
          <div className="links">
            {SOCIAL.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
          <div className="copy">
            © {new Date().getFullYear()} · JUN HONG JEE
            {lang === 'zh' ? ' · 系统运行正常' : ' · ALL SYSTEMS NOMINAL'}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── SEO ─────────────────────────────────────────────────────────────────── */

function HomeSEO({ lang }) {
  const titleStr = lang === 'zh'
    ? 'Jee Production — 马来西亚软件工程师 Jun Hong Jee'
    : 'Jee Production — Jun Hong Jee | Software Engineer Malaysia'
  const descStr = lang === 'zh'
    ? '马来西亚全栈软件工程师余俊宏的作品集，专注 PWA、电商与订单流程、支付整合和管理后台。'
    : 'Portfolio of Jun Hong Jee, a full-stack software engineer in Malaysia building PWAs, commerce workflows, payment integrations, and admin systems.'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person', '@id': 'https://www.jeeprod.com/#person',
        name: 'Jun Hong Jee', jobTitle: 'Software Engineer',
        url: 'https://www.jeeprod.com/', email: 'jeejunhong@gmail.com',
        sameAs: ['https://github.com/junhong-623', 'https://www.linkedin.com/in/junhong623/', 'https://www.instagram.com/junhong623/'],
        address: { '@type': 'PostalAddress', addressCountry: 'MY' },
      },
      {
        '@type': 'WebSite', '@id': 'https://www.jeeprod.com/#website',
        url: 'https://www.jeeprod.com/', name: 'Jee Production',
        description: 'Full-stack product portfolio of Jun Hong Jee, based in Malaysia.',
        author: { '@id': 'https://www.jeeprod.com/#person' },
      },
    ],
  }
  return (
    <Helmet>
      <title>{titleStr}</title>
      <meta name="description" content={descStr} />
      <meta property="og:title" content={titleStr} />
      <meta property="og:description" content={descStr} />
      <meta property="og:url" content="https://www.jeeprod.com/" />
      <meta property="og:image" content="https://www.jeeprod.com/og-image.webp" />
      <link rel="canonical" href="https://www.jeeprod.com/" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}

/* ── Home ────────────────────────────────────────────────────────────────── */

export default function Home() {
  const { lang } = useLang()
  const { admin } = useAuth()
  const [allPortfolio, setAllPortfolio] = useState([])
  const [allBookmarks, setAllBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      setLoading(true)
      return import('../lib/projects')
        .then(({ getVisibleEntriesByType }) => Promise.all([
          getVisibleEntriesByType('portfolio'),
          getVisibleEntriesByType('bookmark'),
        ]))
        .then(([portfolio, bookmarks]) => {
          setAllPortfolio(portfolio)
          setAllBookmarks(bookmarks)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
    load()
    window.addEventListener(ENTRIES_UPDATED_EVENT, load)
    return () => window.removeEventListener(ENTRIES_UPDATED_EVENT, load)
  }, [])

  const portfolioEntries = allPortfolio.filter(e => !e.adminOnly || admin)
  const bookmarkEntries  = allBookmarks.filter(e => !e.adminOnly || admin)

  return (
    <div className="hud-root">
      <HomeSEO lang={lang} />
      <BootSequence />
      <div className="hud-scan" />
      <HudNav />
      <Telemetry />
      <Hero
        portfolioCount={loading ? '…' : portfolioEntries.length}
      />
      <Missions />
      <About />
      <Skills />
      <Archive entries={portfolioEntries} loading={loading} />
      <Bookmarks entries={bookmarkEntries} loading={loading} />
      <Transmissions />
      <ContactBlock />
      <HudFooter />
    </div>
  )
}
