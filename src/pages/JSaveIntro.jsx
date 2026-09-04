import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { IOSDevice } from '../jsave/components/IOSDevice'
import {
  PhoneAdd,
  PhoneDashboard,
  PhoneGoals,
  PhoneInsights,
  PhoneTransactions,
} from '../jsave/components/PhoneScreens'
import { JSAVE_BASE } from '../jsave/utils/basePath'
import '../jsave/design-system.css'
import './JSaveIntro.css'

const COPY = {
  en: {
    nav: ['Overview', 'Product', 'Principles'],
    open: 'Open JSave', install: 'Install',
    eyebrow: 'Personal finance, without the noise',
    heroA: 'Spend clearly.', heroB: 'Save calmly.',
    heroBody: 'A focused money companion for everyday life in Malaysia. Record a purchase in seconds, understand your pace, and keep moving toward what matters.',
    start: 'Start free', explore: 'Explore the product',
    assurances: ['No bank connection', 'Works offline', 'English + 中文'],
    productKicker: 'A calmer daily habit',
    productTitle: 'Everything important. Nothing distracting.',
    productBody: 'JSave keeps the daily loop deliberately small: record, understand, adjust. No ads, noisy streaks, or pressure to connect a bank account.',
    stories: [
      { no: '01', label: 'FAST CAPTURE', title: 'A money habit you can actually keep.', body: 'Choose an amount, category and account. That is enough. Recurring entries take care of predictable monthly spending without creating duplicates.', points: ['Four transaction types', 'Recurring monthly entries', 'Clear account balances'] },
      { no: '02', label: 'USEFUL FEEDBACK', title: 'Know what today means for tomorrow.', body: 'A daily budget signal turns a long monthly number into a decision you can use right now. Goals and cost-per-day add context without judging you.', points: ['Daily budget pacing', 'Goal progress', 'True cost per day'] },
      { no: '03', label: 'OFFLINE BY DESIGN', title: 'Your records stay available when the signal disappears.', body: 'Each account has its own offline cache. Changes queue safely and reconcile with your private cloud path when the connection returns.', points: ['Account-isolated cache', 'Reliable queued sync', 'CSV export anytime'] },
    ],
    lifestyleKicker: 'Made for real life',
    lifestyleTitle: 'Money clarity should feel quiet.',
    lifestyleBody: 'JSave is designed in Kuala Lumpur for the small, ordinary choices that shape a month—not for financial theatre.',
    lifestyleCards: [{ value: 'RM 38', label: 'safe to spend today' }, { value: '72%', label: 'Tokyo goal reached' }],
    demoKicker: 'THE REAL PRODUCT', demoTitle: 'Tap through JSave.',
    demoBody: 'These are working interface components—not a concept render. Switch screens to see the core flow.',
    tabs: ['Home', 'Ledger', 'Add', 'Insights', 'Goals'],
    principlesKicker: 'OUR PRINCIPLES', principlesTitle: 'Built to earn a place in your routine.',
    principles: [
      { title: 'Manual on purpose', body: 'You decide what enters the ledger. JSave never asks for bank credentials.' },
      { title: 'Private by account', body: 'Offline records are isolated by user and sync only to that user’s Firebase path.' },
      { title: 'Honest by default', body: 'No invented AI, fake user counts, or paid tiers that do not exist.' },
    ],
    faqTitle: 'A few useful answers.',
    faqs: [
      { q: 'Can I use JSave without internet?', a: 'Yes. Add and review records offline; queued changes sync after your connection returns.' },
      { q: 'Do I need to connect a bank?', a: 'No. JSave is manual-entry by design and never asks for bank login details.' },
      { q: 'Can I take my data with me?', a: 'Yes. Export all transactions as a spreadsheet-ready CSV from Settings.' },
      { q: 'How much does it cost?', a: 'The complete JSave experience is currently free, with no paid feature gate.' },
    ],
    finalTitle: 'Start with the next ringgit.', finalBody: 'Two taps to a clearer picture of your money.',
    footer: 'Designed and built in Kuala Lumpur.', close: 'Close', menu: 'Menu',
  },
  zh: {
    nav: ['概览', '产品', '原则'], open: '打开 JSave', install: '安装',
    eyebrow: '个人理财，不需要噪音', heroA: '花得清楚。', heroB: '存得从容。',
    heroBody: '为马来西亚日常生活而做的专注理财伙伴。几秒记下一笔，看懂自己的节奏，继续走向真正重要的目标。',
    start: '免费开始', explore: '看看产品', assurances: ['无需连接银行', '离线可用', '中文 + English'],
    productKicker: '更从容的日常习惯', productTitle: '重要的都有。多余的没有。',
    productBody: 'JSave 把每天的流程刻意保持简单：记录、看懂、调整。没有广告、吵闹的连续打卡，也不会催你绑定银行。',
    stories: [
      { no: '01', label: '快速记录', title: '真正坚持得下来的金钱习惯。', body: '选择金额、类别和账户，就够了。固定的每月开销可以自动记录，同时避免重复生成。', points: ['四种交易类型', '每月周期记账', '清楚的账户余额'] },
      { no: '02', label: '有用的反馈', title: '看懂今天，会怎样影响明天。', body: '每日预算把遥远的月度数字，变成当下可用的判断。目标进度和日均成本提供背景，但不评判你。', points: ['每日预算节奏', '目标进度', '真实日均成本'] },
      { no: '03', label: '为离线而设计', title: '没有信号，记录也依然在。', body: '每个账号都有独立的离线缓存。网络恢复后，排队中的修改会可靠地同步到你的私人云端路径。', points: ['账号隔离缓存', '可靠队列同步', '随时导出 CSV'] },
    ],
    lifestyleKicker: '为真实生活而做', lifestyleTitle: '看清钱，不应该让人焦虑。',
    lifestyleBody: 'JSave 在吉隆坡设计，关注的是组成一个月的普通小决定，而不是华而不实的金融表演。',
    lifestyleCards: [{ value: 'RM 38', label: '今天可安心使用' }, { value: '72%', label: '东京目标进度' }],
    demoKicker: '真实产品', demoTitle: '亲自看看 JSave。', demoBody: '这里展示的是真实界面组件，不是概念图。切换页面，了解主要流程。',
    tabs: ['主页', '账本', '新增', '洞察', '目标'],
    principlesKicker: '产品原则', principlesTitle: '值得留在你日常里的工具。',
    principles: [
      { title: '有意采用手动记录', body: '由你决定什么进入账本。JSave 永远不会索取银行登录资料。' },
      { title: '数据按账号私有', body: '离线记录按用户隔离，并只同步到该用户自己的 Firebase 路径。' },
      { title: '默认如实表达', body: '不虚构 AI、用户数字，也不展示并不存在的付费等级。' },
    ],
    faqTitle: '几个实用答案。',
    faqs: [
      { q: '没有网络也能用吗？', a: '可以。离线时仍能添加和查看记录，网络恢复后会自动同步排队中的修改。' },
      { q: '需要连接银行吗？', a: '不需要。JSave 采用手动记账设计，绝不会索取银行登录资料。' },
      { q: '可以带走自己的数据吗？', a: '可以。你可以随时在设置中把全部交易导出为适合表格软件的 CSV。' },
      { q: 'JSave 收费吗？', a: '目前完整的 JSave 体验免费使用，没有付费功能墙。' },
    ],
    finalTitle: '从下一块钱开始。', finalBody: '两下记录，慢慢看清自己的钱。',
    footer: '于吉隆坡设计与打造。', close: '关闭', menu: '菜单',
  },
}

const PWA_STEPS = {
  en: {
    ios: ['Open this page in Safari', 'Tap the Share button', 'Choose “Add to Home Screen”'],
    android: ['Open the browser menu', 'Choose “Add to Home screen” or “Install app”', 'Confirm the installation'],
    desktop: ['Look for the install icon in the address bar', 'Choose “Install”'],
  },
  zh: {
    ios: ['使用 Safari 打开此页面', '点击分享按钮', '选择「添加到主屏幕」'],
    android: ['打开浏览器菜单', '选择「添加到主屏幕」或「安装应用」', '确认安装'],
    desktop: ['在地址栏寻找安装图标', '选择「安装」'],
  },
}

function Device({ children }) {
  return <div className="ji-device-viewport"><div className="ji-device-scale"><IOSDevice width={390} height={844} dark>{children}</IOSDevice></div></div>
}

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function FeatureGlyph({ type }) {
  if (type === 'capture') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5v22M5 16h22"/><rect x="3.5" y="3.5" width="25" height="25" rx="8"/></svg>
  if (type === 'feedback') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 24V13M13 24V7M21 24v-8M29 24V4"/><path d="M3 27h27"/></svg>
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 13a9 9 0 0117-3M25 19a9 9 0 01-17 3"/><path d="M24 4v6h-6M8 28v-6h6"/></svg>
}

export default function JSaveIntro({ onOpenApp, withHead = true }) {
  const [lang, setLang] = useState(() => localStorage.getItem('jsave-lang') || 'en')
  const [activeScreen, setActiveScreen] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [installGuide, setInstallGuide] = useState(null)
  const deferredPromptRef = useRef(null)
  const zh = lang === 'zh'
  const c = COPY[lang]
  const appHref = onOpenApp ? '#' : 'https://jsave.jeeprod.com'

  const screens = [
    <PhoneDashboard key="home" lang={lang} />,
    <PhoneTransactions key="ledger" lang={lang} />,
    <PhoneAdd key="add" lang={lang} />,
    <PhoneInsights key="insights" lang={lang} />,
    <PhoneGoals key="goals" lang={lang} />,
  ]

  const handleOpenApp = event => { if (onOpenApp) { event.preventDefault(); onOpenApp() } }
  const changeLanguage = () => { const next = zh ? 'en' : 'zh'; setLang(next); localStorage.setItem('jsave-lang', next) }

  useEffect(() => {
    if (onOpenApp) return undefined
    const capturePrompt = event => { event.preventDefault(); deferredPromptRef.current = event }
    window.addEventListener('beforeinstallprompt', capturePrompt)
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt)
  }, [onOpenApp])

  const showInstall = () => {
    if (deferredPromptRef.current) { deferredPromptRef.current.prompt(); deferredPromptRef.current = null; return }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) { setInstallGuide('ios'); return }
    setInstallGuide(/Android/i.test(navigator.userAgent) ? 'android' : 'desktop')
  }

  const metaTitle = zh ? 'JSave — 花得清楚，存得从容' : 'JSave — Spend clearly. Save calmly.'
  const metaDescription = zh ? '为马来西亚日常生活而做的个人记账工具。快速记录、预算反馈、目标追踪、离线同步。' : 'A focused personal finance companion for Malaysia with fast logging, budget feedback, goals and reliable offline sync.'

  return (
    <main className="ji-root">
      {withHead && <Helmet>
        <title>{metaTitle}</title><meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} /><meta property="og:description" content={metaDescription} />
        <meta property="og:url" content="https://www.jeeprod.com/jsave-intro" /><meta property="og:image" content="https://www.jeeprod.com/jsave/j-save-lifestyle.webp" />
        <link rel="canonical" href="https://www.jeeprod.com/jsave-intro" />
      </Helmet>}

      <nav className="ji-nav" aria-label="Primary navigation">
        <div className="ji-nav-inner">
          <a className="ji-brand" href="#top" aria-label="JSave home"><span className="ji-brand-mark">J</span><span>JSave</span></a>
          <div className="ji-nav-links">{c.nav.map((item, index) => <a key={item} href={['#overview', '#product', '#principles'][index]}>{item}</a>)}</div>
          <div className="ji-nav-actions">
            <button className="ji-language" onClick={changeLanguage} aria-label={zh ? 'Switch to English' : '切换到中文'}>{zh ? 'EN' : '中文'}</button>
            <a className="ji-nav-open" href={appHref} onClick={handleOpenApp}>{c.open}</a>
            <button className="ji-menu-button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label={c.menu}><span /><span /></button>
          </div>
        </div>
        {menuOpen && <div className="ji-mobile-menu">
          {c.nav.map((item, index) => <a key={item} href={['#overview', '#product', '#principles'][index]} onClick={() => setMenuOpen(false)}>{item}</a>)}
          <a href={appHref} onClick={event => { setMenuOpen(false); handleOpenApp(event) }}>{c.open}</a>
        </div>}
      </nav>

      <section id="top" className="ji-hero">
        <div className="ji-hero-copy ji-reveal is-visible">
          <p className="ji-kicker">{c.eyebrow}</p><h1>{c.heroA}<br /><span>{c.heroB}</span></h1>
          <p className="ji-hero-body">{c.heroBody}</p>
          <div className="ji-hero-actions"><a className="ji-button ji-button-primary" href={appHref} onClick={handleOpenApp}>{c.start}<ArrowIcon /></a><a className="ji-button ji-button-text" href="#overview">{c.explore}<ArrowIcon /></a></div>
          <div className="ji-assurances">{c.assurances.map(item => <span key={item}><i />{item}</span>)}</div>
        </div>
        <div className="ji-hero-product" aria-label={zh ? 'JSave 首页界面预览' : 'JSave home screen preview'}>
          <div className="ji-hero-halo" /><Device><PhoneDashboard lang={lang} /></Device>
          <div className="ji-float-card ji-float-budget"><span>{zh ? '今日预算' : 'TODAY'}</span><strong>RM 38</strong></div>
          <div className="ji-float-card ji-float-goal"><span>{zh ? '目标进度' : 'GOAL'}</span><strong>72%</strong></div>
        </div>
      </section>

      <section id="overview" className="ji-intro"><div className="ji-section-copy ji-reveal"><p className="ji-kicker">{c.productKicker}</p><h2>{c.productTitle}</h2><p>{c.productBody}</p></div></section>

      <section id="product" className="ji-stories">
        {c.stories.map((story, index) => <article className={`ji-story ji-story-${index + 1}`} key={story.no}>
          <div className="ji-story-copy ji-reveal">
            <div className="ji-story-glyph"><FeatureGlyph type={['capture', 'feedback', 'sync'][index]} /></div>
            <p className="ji-story-label">{story.no} · {story.label}</p><h3>{story.title}</h3><p className="ji-story-body">{story.body}</p>
            <ul>{story.points.map(point => <li key={point}>{point}</li>)}</ul>
          </div>
          <div className="ji-story-visual ji-reveal">
            {index === 0 && <div className="ji-story-phone"><Device><PhoneAdd lang={lang} /></Device></div>}
            {index === 1 && <div className="ji-budget-visual"><div className="ji-budget-head"><span>{zh ? '九月节奏' : 'SEPTEMBER PACE'}</span><b>68%</b></div><div className="ji-budget-track"><span /></div><div className="ji-budget-row"><span>{zh ? '今天已用' : 'Spent today'}</span><strong>RM 42.60</strong></div><div className="ji-budget-row"><span>{zh ? '仍可安心使用' : 'Still comfortable'}</span><strong className="is-green">RM 38.20</strong></div></div>}
            {index === 2 && <div className="ji-sync-visual"><div className="ji-sync-device"><span>{zh ? '手机' : 'PHONE'}</span><b>12</b><small>{zh ? '本地记录' : 'local records'}</small></div><div className="ji-sync-line"><i /><i /><i /></div><div className="ji-sync-device"><span>{zh ? '私人云端' : 'PRIVATE CLOUD'}</span><b>12</b><small>{zh ? '已同步' : 'synced safely'}</small></div></div>}
          </div>
        </article>)}
      </section>

      <section className="ji-lifestyle">
        <img src={`${JSAVE_BASE}/j-save-lifestyle.webp`} alt={zh ? '桌面上的手机、笔记本与 JSave 乌龟摆件' : 'A phone, notebook and JSave turtle on a calm desk'} loading="lazy" />
        <div className="ji-lifestyle-shade" /><div className="ji-lifestyle-copy ji-reveal"><p className="ji-kicker">{c.lifestyleKicker}</p><h2>{c.lifestyleTitle}</h2><p>{c.lifestyleBody}</p></div>
        <div className="ji-lifestyle-metrics">{c.lifestyleCards.map(card => <div key={card.label}><strong>{card.value}</strong><span>{card.label}</span></div>)}</div>
      </section>

      <section className="ji-demo" aria-labelledby="demo-title">
        <div className="ji-demo-copy ji-reveal"><p className="ji-kicker">{c.demoKicker}</p><h2 id="demo-title">{c.demoTitle}</h2><p>{c.demoBody}</p>
          <div className="ji-demo-tabs" role="tablist" aria-label={c.demoTitle}>{c.tabs.map((tab, index) => <button key={tab} role="tab" aria-selected={activeScreen === index} onClick={() => setActiveScreen(index)}><span>{String(index + 1).padStart(2, '0')}</span>{tab}</button>)}</div>
        </div>
        <div className="ji-demo-stage" role="tabpanel" aria-label={c.tabs[activeScreen]}><Device>{screens[activeScreen]}</Device></div>
      </section>

      <section id="principles" className="ji-principles">
        <div className="ji-section-copy ji-reveal"><p className="ji-kicker">{c.principlesKicker}</p><h2>{c.principlesTitle}</h2></div>
        <div className="ji-principle-grid">{c.principles.map((principle, index) => <article className="ji-reveal" key={principle.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{principle.title}</h3><p>{principle.body}</p></article>)}</div>
      </section>

      <section className="ji-faq"><h2 className="ji-reveal">{c.faqTitle}</h2><div>{c.faqs.map((faq, index) => {
        const expanded = openFaq === index
        return <article key={faq.q}><button onClick={() => setOpenFaq(expanded ? -1 : index)} aria-expanded={expanded}><span>{faq.q}</span><i>{expanded ? '−' : '+'}</i></button><div className={expanded ? 'is-open' : ''}><p>{faq.a}</p></div></article>
      })}</div></section>

      <section className="ji-final"><div className="ji-final-glow" /><div className="ji-reveal"><h2>{c.finalTitle}</h2><p>{c.finalBody}</p><div className="ji-final-actions"><a className="ji-button ji-button-primary" href={appHref} onClick={handleOpenApp}>{c.open}<ArrowIcon /></a>{!onOpenApp && <button className="ji-button ji-button-secondary" onClick={showInstall}>{c.install}</button>}</div></div></section>
      <footer className="ji-footer"><a className="ji-brand" href="#top"><span className="ji-brand-mark">J</span><span>JSave</span></a><p>{c.footer}</p><span>© 2026 JSave · Jee Production</span></footer>

      {!onOpenApp && installGuide && <div className="ji-modal-backdrop" onClick={() => setInstallGuide(null)}><div className="ji-install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={event => event.stopPropagation()}><button className="ji-modal-close" onClick={() => setInstallGuide(null)} aria-label={c.close}>×</button><span className="ji-brand-mark">J</span><h2 id="install-title">{c.install} JSave</h2><ol>{PWA_STEPS[lang][installGuide].map(step => <li key={step}>{step}</li>)}</ol></div></div>}
    </main>
  )
}
