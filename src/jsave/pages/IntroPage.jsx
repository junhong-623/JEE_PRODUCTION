// JSave Intro Landing Page
// Dark mode · Emerald accent · Maximum animations · Bilingual (EN/中文)
import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { AnimatedCount, Sparkline, AreaChart } from '../components/JSaveCharts'
import { IOSDevice } from '../components/IOSDevice'
import { PhoneDashboard, PhoneTransactions, PhoneAdd, PhoneInsights, PhoneGoals } from '../components/PhoneScreens'

const ACCENT = '#10b981'
const ACCENT_D = '#059669'

/* ── Bilingual copy ──────────────────────────────────────────────────── */
const COPY = {
  en: {
    nav: ['Features', 'Demo', 'Pricing', 'Roadmap'],
    navCta: 'Get JSave',
    pill: 'Personal finance · 个人理财',
    h1a: 'Every ringgit,',
    h1b: 'accounted',
    h1c: 'for.',
    sub: 'JSave is the quiet money tracker that turns daily spending into clear, calm progress. Log in seconds, see where it goes, and watch your goals fill up.',
    ctaA: 'Start saving free',
    ctaB: 'Watch 60s demo',
    trust: 'No bank login required · Works offline · 100% private',
    ticker: ['LOG IN 2 SECONDS', 'BILINGUAL 中英双语', 'OFFLINE-FIRST', 'NO ADS', 'GOAL TRACKING', 'SMART INSIGHTS', 'EXPORT ANYTIME', 'OPEN SOURCE'],
    featHead: 'Built for the way you actually spend',
    featSub: 'Ten small things that add up to a tool you open every day — without dreading it.',
    feats: [
      { e: '⚡', t: 'Two-tap logging', d: "Amount, category, done. The fastest ledger you'll ever keep." },
      { e: '🌏', t: 'Fully bilingual', d: 'Switch 中文 / English anywhere — categories, reports, everything.' },
      { e: '📊', t: 'Live insights', d: 'Charts that update as you type. Spot leaks before they grow.' },
      { e: '🎯', t: 'Goal jars', d: 'Tokyo, an iPhone, a rainy day — watch each one fill.' },
      { e: '🧮', t: 'Cost-per-day', d: 'Log what you buy — JSave shows the true daily cost as you use it.' },
      { e: '🔒', t: 'Private by default', d: 'Your data lives on your device. No bank logins, ever.' },
      { e: '✈️', t: 'Works offline', d: 'On a plane, in the hills — JSave never needs a signal.' },
      { e: '✨', t: 'AI nudges', d: '"Two home dinners saves RM 120." Gentle, specific tips.' },
      { e: '🔁', t: 'Subscriptions radar', d: 'Every recurring charge surfaced and ranked automatically.' },
      { e: '📥', t: 'Export anytime', d: 'CSV, PDF, or a clean monthly recap. Your numbers, yours.' },
      { e: '🐢', t: 'Slow money, on purpose', d: 'Designed to reduce anxiety, not gamify your wallet.' },
    ],
    demoHead: 'See it move',
    demoSub: 'This is the real interface. Tap through the screens — every number, chart and jar is live.',
    demoTabs: ['Home', 'Ledger', 'Add', 'Insights', 'Goals'],
    statsHead: 'Quiet numbers, real momentum',
    statsSub: 'A year of JSave, by the people who keep it open.',
    stats: [
      { v: 2.4, p: 'RM ', s: 'M', l: 'Total saved by users', d: 1 },
      { v: 318000, p: '', s: '+', l: 'Entries logged', d: 0 },
      { v: 92, p: '', s: '%', l: 'Still active at 6 months', d: 0 },
      { v: 11, p: '', s: 's', l: 'Avg. time to log', d: 0 },
    ],
    growthHead: 'Savings, compounding',
    growthSub: 'A typical user across their first year — money in jars, not just in a vibe.',
    roadHead: 'Where JSave is heading',
    roadSub: 'Shipped recently, building now, and what is next.',
    road: [
      { tag: 'SHIPPED', date: 'May 2026', t: 'Bilingual insights v2', d: 'AI nudges now speak both 中文 and English, with category-level tips.', done: true },
      { tag: 'SHIPPED', date: 'Apr 2026', t: 'Goal jars', d: 'Multiple savings goals with pace tracking and projected dates.', done: true },
      { tag: 'BUILDING', date: 'Now', t: 'Shared household ledger', d: 'Split a budget with a partner — separate logins, one clear picture.', now: true },
      { tag: 'NEXT', date: 'Q3 2026', t: 'Recurring auto-detect', d: 'JSave learns your subscriptions and flags price hikes.' },
      { tag: 'NEXT', date: 'Q4 2026', t: 'Apple Watch quick-log', d: 'Log a coffee from your wrist in one tap.' },
    ],
    priceHead: 'One price. No surprises.',
    priceSub: 'JSave stays free for everyday saving. Go Plus when you want the deeper tools.',
    plans: [
      { name: 'Free', price: 'RM 0', per: 'forever', desc: 'Everything you need to track and save.', cta: 'Start free', feats: ['Unlimited entries', 'Up to 3 goals', 'Core insights & charts', 'Bilingual interface', 'Offline + private'], hot: false },
      { name: 'Plus', price: 'RM 12', per: '/ month', desc: 'For people serious about a savings rhythm.', cta: 'Go Plus', feats: ['Everything in Free', 'Unlimited goals', 'AI insights & nudges', 'Subscriptions radar', 'Export to CSV / PDF', 'Shared household ledger'], hot: true },
      { name: 'Lifetime', price: 'RM 188', per: 'once', desc: 'Pay once. Keep Plus forever.', cta: 'Buy lifetime', feats: ['Everything in Plus', 'All future features', 'Founder badge 🐢', 'Priority support'], hot: false },
    ],
    faqHead: 'Questions, answered',
    faqSub: 'The things people ask before they start.',
    faqs: [
      { q: 'Do I have to connect my bank?', a: 'Never. JSave is entry-based by design — you log what you spend, and your data stays on your device. No bank logins, no scraping, no third parties.' },
      { q: 'Is it really bilingual?', a: 'Fully. Switch between 中文 and English anywhere in the app — every category, report, and AI tip is translated, not just the menus.' },
      { q: 'Does it work offline?', a: 'Yes. JSave is offline-first. Log on a plane, in the hills, anywhere — it syncs whenever you reconnect, if you choose to sync at all.' },
      { q: "What happens to my data if I stop?", a: 'It is yours. Export everything to CSV or PDF at any time, with one tap. We never lock your numbers behind a subscription.' },
      { q: 'Why a turtle? 🐢', a: 'Because good money habits are slow and steady. JSave is built to reduce anxiety, not to gamify your wallet or push you to spend.' },
    ],
    ctaHead: 'Start with your next ringgit.',
    ctaSub: 'Free forever for everyday saving. Two taps to your first entry.',
    finalCtaA: 'Get JSave free',
    finalCtaB: 'Read the docs',
    foot: 'Slow money, made calm. Built in KL.',
    footCols: [
      { h: 'Product', items: ['Features', 'Pricing', 'Roadmap', 'Changelog'] },
      { h: 'Company', items: ['About', 'Privacy', 'Open source', 'Contact'] },
      { h: 'Get it', items: ['App Store', 'Google Play', 'Web app', 'Mac'] },
    ],
  },
  zh: {
    nav: ['功能', '演示', '价格', '路线图'],
    navCta: '获取 JSave',
    pill: '个人理财 · Personal finance',
    h1a: '每一分钱,',
    h1b: '都心中',
    h1c: '有数。',
    sub: 'JSave 是一款安静的记账工具，把每天的开销变成清晰、从容的进度。几秒记一笔，看清钱去哪了，看着目标一点点填满。',
    ctaA: '免费开始记账',
    ctaB: '看 60 秒演示',
    trust: '无需银行登录 · 离线可用 · 100% 私密',
    ticker: ['两秒记一笔', '中英双语', '离线优先', '没有广告', '目标追踪', '智能洞察', '随时导出', '开源透明'],
    featHead: '为你真实的花钱方式而造',
    featSub: '十个小细节，累加成一个你每天都愿意打开的工具 —— 而不是负担。',
    feats: [
      { e: '⚡', t: '两下记账', d: '金额、类别、完成。你用过最快的账本。' },
      { e: '🌏', t: '完整双语', d: '随处切换中英文 —— 类别、报表，全都跟着变。' },
      { e: '📊', t: '实时洞察', d: '边输入边更新的图表。在漏洞变大前发现它。' },
      { e: '🎯', t: '目标罐子', d: '东京、一台 iPhone、应急金 —— 看每一个填满。' },
      { e: '🧮', t: '日均成本', d: '记录你买的东西 —— JSave 按使用天数算出真实的每天成本。' },
      { e: '🔒', t: '默认私密', d: '数据只在你的设备上。永远不需要银行登录。' },
      { e: '✈️', t: '离线可用', d: '飞机上、山里 —— JSave 从不需要信号。' },
      { e: '✨', t: 'AI 提醒', d: '温和、具体的建议。"在家吃两顿省 RM 120。"' },
      { e: '🔁', t: '订阅雷达', d: '每一笔周期扣款自动浮现并排序。' },
      { e: '📥', t: '随时导出', d: 'CSV、PDF，或一份干净的月度回顾。数据归你。' },
      { e: '🐢', t: '慢钱，有意为之', d: '为减少焦虑而设计，而不是让钱包游戏化。' },
    ],
    demoHead: '看它动起来',
    demoSub: '这就是真实界面。点击切换屏幕 —— 每个数字、图表和罐子都是实时的。',
    demoTabs: ['主页', '账本', '新增', '洞察', '目标'],
    statsHead: '安静的数字，真实的势头',
    statsSub: 'JSave 的一年 —— 来自每天打开它的人。',
    stats: [
      { v: 2.4, p: 'RM ', s: 'M', l: '用户累计储蓄', d: 1 },
      { v: 318000, p: '', s: '+', l: '已记录笔数', d: 0 },
      { v: 92, p: '', s: '%', l: '半年后仍活跃', d: 0 },
      { v: 11, p: '', s: '秒', l: '平均记账耗时', d: 0 },
    ],
    growthHead: '储蓄，在复利',
    growthSub: '一位典型用户的第一年 —— 钱进了罐子，而不只是停在感觉里。',
    roadHead: 'JSave 的去向',
    roadSub: '最近上线、正在打造、以及接下来。',
    road: [
      { tag: '已上线', date: '2026 年 5 月', t: '双语洞察 v2', d: 'AI 提醒现已支持中英双语，附带类别级别的建议。', done: true },
      { tag: '已上线', date: '2026 年 4 月', t: '目标罐子', d: '多个储蓄目标，含进度追踪与预计达成日期。', done: true },
      { tag: '打造中', date: '现在', t: '共享家庭账本', d: '与伴侣共享预算 —— 各自登录，一张清晰的全景图。', now: true },
      { tag: '接下来', date: '2026 Q3', t: '周期扣款自动识别', d: 'JSave 学习你的订阅，并标记涨价。' },
      { tag: '接下来', date: '2026 Q4', t: 'Apple Watch 快速记账', d: '在手腕上一点，记下一杯咖啡。' },
    ],
    priceHead: '一个价格。没有意外。',
    priceSub: '日常记账永久免费。需要更深的工具时，再升级 Plus。',
    plans: [
      { name: '免费版', price: 'RM 0', per: '永久', desc: '追踪与储蓄所需的一切。', cta: '免费开始', feats: ['无限记账', '最多 3 个目标', '核心洞察与图表', '中英双语界面', '离线 + 私密'], hot: false },
      { name: 'Plus', price: 'RM 12', per: '/ 月', desc: '为认真养成储蓄节奏的你。', cta: '升级 Plus', feats: ['包含免费版全部', '无限目标', 'AI 洞察与提醒', '订阅雷达', '导出 CSV / PDF', '共享家庭账本'], hot: true },
      { name: '终身版', price: 'RM 188', per: '一次性', desc: '付一次，永久享用 Plus。', cta: '购买终身', feats: ['包含 Plus 全部', '所有未来功能', '创始徽章 🐢', '优先支持'], hot: false },
    ],
    faqHead: '常见问题',
    faqSub: '开始之前，大家都会问的。',
    faqs: [
      { q: '我必须绑定银行吗？', a: '永远不需要。JSave 采用手动记账设计 —— 你记下花了什么，数据留在你的设备上。没有银行登录、没有抓取、没有第三方。' },
      { q: '真的是双语吗？', a: '完整双语。可在应用任何位置切换中英文 —— 每个类别、报表、AI 建议都被翻译，而不只是菜单。' },
      { q: '离线能用吗？', a: '可以。JSave 离线优先。在飞机上、山里、任何地方都能记账 —— 你选择同步时，它才在重新联网后同步。' },
      { q: '如果我不用了，数据怎么办？', a: '数据归你。随时一键导出全部为 CSV 或 PDF。我们绝不把你的数字锁在订阅背后。' },
      { q: '为什么是乌龟？🐢', a: '因为好的金钱习惯是缓慢而稳定的。JSave 为减少焦虑而造，而不是让钱包游戏化或催你花钱。' },
    ],
    ctaHead: '从你的下一分钱开始。',
    ctaSub: '日常记账永久免费。两下记下第一笔。',
    finalCtaA: '免费获取 JSave',
    finalCtaB: '阅读文档',
    foot: '慢钱，从容。于吉隆坡打造。',
    footCols: [
      { h: '产品', items: ['功能', '价格', '路线图', '更新日志'] },
      { h: '公司', items: ['关于', '隐私', '开源', '联系'] },
      { h: '获取', items: ['App Store', 'Google Play', '网页版', 'Mac'] },
    ],
  },
}

/* ── Sparks decoration ────────────────────────────────────────────────── */
function Sparks({ count = 12 }) {
  const sparks = Array.from({ length: count }, (_, i) => ({
    left: `${(i * 67) % 100}%`,
    delay: `${(i * 0.9) % 12}s`,
    dur: `${9 + (i % 5) * 1.4}s`,
    scale: 0.5 + (i % 4) * 0.3,
  }))
  return sparks.map((s, i) => (
    <span key={i} className="js-spark" style={{ left: s.left, bottom: 60, animationDelay: s.delay, animationDuration: s.dur, transform: `scale(${s.scale})` }} />
  ))
}

/* ── Device wrapper ───────────────────────────────────────────────────── */
function Device({ children }) {
  return <IOSDevice width={390} height={844} dark={true}>{children}</IOSDevice>
}

/* ── Nav ──────────────────────────────────────────────────────────────── */
function IntroNav({ c, onLogin }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 40px',
      background: 'rgba(5,13,26,0.72)',
      backdropFilter: 'blur(18px) saturate(150%)',
      WebkitBackdropFilter: 'blur(18px) saturate(150%)',
      borderBottom: '1px solid var(--js-line-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 19, color: '#04140d', fontWeight: 700, boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>J</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: -0.5 }}>JSave</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: 2, color: 'var(--js-ink-3)', marginTop: 2 }}>记账 · SAVE</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        {c.nav.map((n) => (
          <a key={n} href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, color: 'var(--js-ink-2)', textDecoration: 'none' }}>{n}</a>
        ))}
      </div>
      <a className="js-btn-primary" onClick={(e) => { e.preventDefault(); onLogin() }} href="#" style={{ padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>
        {c.navCta}
      </a>
    </nav>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
function IntroHero({ c, lang, onLogin }) {
  const tiltChars = c.h1b.split('')
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 40px 60px' }}>
      <div className="js-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
      <Sparks />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 48, alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        {/* Left */}
        <div>
          <div style={{ display: 'inline-flex', marginBottom: 24 }}>
            <span className="js-pill"><span className="js-dot" style={{ width: 5, height: 5 }}></span>{c.pill}</span>
          </div>
          <h1 className="js-h1">
            {c.h1a}<br />
            <span style={{ color: ACCENT }}>
              {tiltChars.map((ch, i) => (
                <span key={i} className="js-char" style={{ animationDelay: `${i * 0.06}s` }}>{ch}</span>
              ))}
            </span>{' '}
            <span style={{ color: ACCENT }}>{c.h1c}</span>
          </h1>
          <p className="js-body" style={{ marginTop: 22, maxWidth: 440, fontSize: 16 }}>{c.sub}</p>
          <div style={{ marginTop: 30, display: 'flex', gap: 12, alignItems: 'center' }}>
            <a className="js-btn-primary" href="#" onClick={(e) => { e.preventDefault(); onLogin() }}>{c.ctaA} <span style={{ fontSize: 15 }}>→</span></a>
            <a className="js-btn-ghost" href="#"><span style={{ fontSize: 13 }}>▶</span> {c.ctaB}</a>
          </div>
          <div style={{ marginTop: 22, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.5, color: 'var(--js-ink-3)' }}>{c.trust}</div>
          {/* stat row */}
          <div style={{ marginTop: 34, display: 'flex', gap: 32 }}>
            {[
              { v: 48721, p: 'RM ', s: '', l: lang === 'zh' ? '已追踪储蓄' : 'Saved tracked', d: 0 },
              { v: 12, p: '', s: 'k+', l: lang === 'zh' ? '安静的用户' : 'Quiet users', d: 0 },
              { v: 4.9, p: '', s: '★', l: lang === 'zh' ? '应用商店评分' : 'App Store', d: 1 },
            ].map((st) => (
              <div key={st.l}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: -1, color: 'var(--js-ink)' }}>
                  <AnimatedCount value={st.v} prefix={st.p} suffix={st.s} decimals={st.d} dur={1800} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 1.4, color: 'var(--js-ink-3)', textTransform: 'uppercase', marginTop: 4 }}>{st.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Right — phone */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.32), transparent 70%)', filter: 'blur(20px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}></div>
          <div className="js-float-slow" style={{ position: 'relative', transform: 'scale(0.78)', transformOrigin: 'center' }}>
            <Device><PhoneDashboard lang={lang} accent={ACCENT} /></Device>
          </div>
          {/* floating chips */}
          <div className="js-float" style={{ position: 'absolute', top: 40, left: -6, padding: '10px 14px', borderRadius: 14, background: 'rgba(8,18,32,0.85)', border: '1px solid var(--js-line-strong)', backdropFilter: 'blur(12px)', animationDelay: '0.6s' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--js-ink-3)', letterSpacing: 1 }}>{lang === 'zh' ? '本月已存' : 'SAVED · MAY'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: ACCENT }}>+RM 1,840</div>
          </div>
          <div className="js-float" style={{ position: 'absolute', bottom: 70, right: -10, padding: '10px 14px', borderRadius: 14, background: 'rgba(8,18,32,0.85)', border: '1px solid rgba(245,213,112,0.3)', backdropFilter: 'blur(12px)', animationDelay: '1.4s' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--js-ink-3)', letterSpacing: 1 }}>TOKYO ✈️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--js-gold)' }}>72%</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Ticker ───────────────────────────────────────────────────────────── */
function IntroTicker({ c }) {
  const items = [...c.ticker, ...c.ticker]
  return (
    <div style={{ borderTop: '1px solid var(--js-line-soft)', borderBottom: '1px solid var(--js-line-soft)', padding: '16px 0', overflow: 'hidden', background: 'rgba(16,185,129,0.02)' }}>
      <div className="js-marquee">
        {items.map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 56, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2.5, color: 'var(--js-ink-3)', whiteSpace: 'nowrap' }}>
            {t}<span style={{ color: 'var(--js-emerald)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Features ─────────────────────────────────────────────────────────── */
function IntroFeatures({ c, lang }) {
  return (
    <section style={{ padding: '96px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="js-section-header">
        <div>
          <div className="num">01 / {lang === 'zh' ? '功能' : 'FEATURES'}</div>
          <div className="title">{c.featHead}</div>
        </div>
        <div className="sub">{c.featSub}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {c.feats.map((f, i) => {
          const big = i === 0
          return (
            <div key={i} className="js-card js-card-feature js-reveal"
              style={{ gridColumn: big ? 'span 2' : 'span 1', transitionDelay: `${(i % 5) * 0.05}s` }}>
              <div className="js-glow-trail"></div>
              <div style={{ display: 'flex', alignItems: big ? 'center' : 'flex-start', gap: big ? 18 : 0, flexDirection: big ? 'row' : 'column' }}>
                <div style={{ width: big ? 56 : 44, height: big ? 56 : 44, borderRadius: big ? 16 : 13, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: big ? 28 : 22, flexShrink: 0, marginBottom: big ? 0 : 16 }}>{f.e}</div>
                <div>
                  <h4 className="js-h4" style={{ fontSize: big ? 20 : 16 }}>{f.t}</h4>
                  <p className="js-body-sm" style={{ marginTop: 8, fontSize: big ? 14 : 13 }}>{f.d}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── Live Demo ────────────────────────────────────────────────────────── */
function IntroLiveDemo({ c, lang }) {
  const [active, setActive] = useState(0)
  const screens = [
    <Device key="home"><PhoneDashboard lang={lang} accent={ACCENT} /></Device>,
    <Device key="tx"><PhoneTransactions lang={lang} /></Device>,
    <Device key="add"><PhoneAdd lang={lang} /></Device>,
    <Device key="ins"><PhoneInsights lang={lang} /></Device>,
    <Device key="goal"><PhoneGoals lang={lang} /></Device>,
  ]
  return (
    <section style={{ padding: '40px 40px 96px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="js-section-header">
        <div>
          <div className="num">02 / {lang === 'zh' ? '演示' : 'LIVE DEMO'}</div>
          <div className="title">{c.demoHead}</div>
        </div>
        <div className="sub">{c.demoSub}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 0.6fr', gap: 40, alignItems: 'center', borderRadius: 28, padding: '40px', position: 'relative', overflow: 'hidden', background: 'radial-gradient(120% 100% at 0% 0%, rgba(16,185,129,0.1), transparent 55%), rgba(255,255,255,0.02)', border: '1px solid var(--js-line)' }}>
        <i className="js-tick" style={{ top: 16, right: 16 }}></i>
        <i className="js-tick" style={{ bottom: 16, left: 16 }}></i>
        {/* Tab list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.demoTabs.map((tab, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, background: active === i ? 'rgba(16,185,129,0.1)' : 'transparent', border: active === i ? '1px solid rgba(16,185,129,0.32)' : '1px solid var(--js-line-soft)', transition: 'all 0.2s var(--ease-out)', fontFamily: 'inherit' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: active === i ? 'var(--js-emerald)' : 'var(--js-ink-4)' }}>0{i + 1}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: active === i ? 'var(--js-ink)' : 'var(--js-ink-3)' }}>{tab}</span>
              {active === i && <span style={{ marginLeft: 'auto', color: 'var(--js-emerald)' }}>→</span>}
            </button>
          ))}
        </div>
        {/* Phone */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.22), transparent 70%)', filter: 'blur(24px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}></div>
          <div style={{ transform: 'scale(0.82)', transformOrigin: 'center', position: 'relative' }}>
            {screens[active]}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Stats ────────────────────────────────────────────────────────────── */
function IntroStats({ c, lang }) {
  return (
    <section style={{ padding: '0 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ borderRadius: 28, padding: '48px', background: 'radial-gradient(120% 120% at 50% 0%, rgba(16,185,129,0.08), transparent 60%), rgba(255,255,255,0.02)', border: '1px solid var(--js-line)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="js-eyebrow" style={{ color: 'var(--js-emerald)' }}>04 / {lang === 'zh' ? '数据' : 'BY THE NUMBERS'}</div>
          <h2 className="js-h2" style={{ marginTop: 12 }}>{c.statsHead}</h2>
          <p className="js-body" style={{ marginTop: 10, maxWidth: 460, marginInline: 'auto' }}>{c.statsSub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
          {c.stats.map((s) => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div className="js-stat-num" style={{ color: 'var(--js-ink)' }}>
                <AnimatedCount value={s.v} prefix={s.p} suffix={s.s} decimals={s.d} dur={2000} />
              </div>
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: 1.4, color: 'var(--js-ink-3)', textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
        <hr className="js-hr" style={{ margin: '0 0 36px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="js-h3">{c.growthHead}</h3>
            <p className="js-body-sm" style={{ marginTop: 6 }}>{c.growthSub}</p>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            {[{ color: ACCENT, label: lang === 'zh' ? '储蓄' : 'Savings' }, { color: 'var(--js-gold)', label: lang === 'zh' ? '支出' : 'Spending' }].map((item) => (
              <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--js-ink-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color }}></span>{item.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <AreaChart
            width={1080} height={260}
            xLabels={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']}
            series={[
              { name: 'savings', color: ACCENT, data: [4, 9, 14, 18, 25, 31, 35, 42, 48, 55, 63, 72] },
              { name: 'spending', color: '#f5d570', data: [38, 41, 36, 44, 39, 35, 42, 33, 31, 36, 30, 28] },
            ]}
          />
        </div>
      </div>
    </section>
  )
}

/* ── Roadmap ──────────────────────────────────────────────────────────── */
function IntroRoadmap({ c, lang }) {
  return (
    <section style={{ padding: '56px 40px 96px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="js-section-header">
        <div>
          <div className="num">05 / {lang === 'zh' ? '路线图' : 'ROADMAP'}</div>
          <div className="title">{c.roadHead}</div>
        </div>
        <div className="sub">{c.roadSub}</div>
      </div>
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'linear-gradient(180deg, var(--js-emerald), rgba(16,185,129,0.1))' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {c.road.map((r, i) => (
            <div key={i} className="js-reveal" style={{ position: 'relative', transitionDelay: `${i * 0.06}s` }}>
              <div style={{ position: 'absolute', left: -32, top: 6, width: 16, height: 16, borderRadius: '50%', background: r.done ? 'var(--js-emerald)' : r.now ? 'var(--js-gold)' : 'rgba(8,18,32,1)', border: `2px solid ${r.done ? 'var(--js-emerald)' : r.now ? 'var(--js-gold)' : 'var(--js-line-strong)'}`, boxShadow: r.now ? '0 0 0 5px rgba(245,213,112,0.16)' : r.done ? '0 0 0 5px rgba(16,185,129,0.14)' : 'none' }}>
                {r.done && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#04140d' }}>✓</span>}
              </div>
              <div className="js-card" style={{ padding: '20px 24px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ minWidth: 130 }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.6, background: r.done ? 'rgba(16,185,129,0.12)' : r.now ? 'rgba(245,213,112,0.12)' : 'rgba(241,245,249,0.05)', color: r.done ? 'var(--js-emerald)' : r.now ? 'var(--js-gold)' : 'var(--js-ink-3)', border: `1px solid ${r.done ? 'rgba(16,185,129,0.3)' : r.now ? 'rgba(245,213,112,0.3)' : 'var(--js-line-soft)'}` }}>{r.tag}</span>
                  <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--js-ink-3)' }}>{r.date}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="js-h4" style={{ fontSize: 17 }}>{r.t}</h4>
                  <p className="js-body-sm" style={{ marginTop: 5 }}>{r.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ──────────────────────────────────────────────────────────── */
function IntroPricing({ c, lang, onLogin }) {
  return (
    <section style={{ padding: '40px 40px 96px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div className="js-eyebrow" style={{ color: 'var(--js-emerald)' }}>06 / {lang === 'zh' ? '价格' : 'PRICING'}</div>
        <h2 className="js-h2" style={{ marginTop: 12 }}>{c.priceHead}</h2>
        <p className="js-body" style={{ marginTop: 10, maxWidth: 460, marginInline: 'auto' }}>{c.priceSub}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
        {c.plans.map((p) => (
          <div key={p.name} className="js-card" style={{ padding: '32px 28px', borderRadius: 24, border: p.hot ? '1px solid rgba(16,185,129,0.5)' : '1px solid var(--js-line)', background: p.hot ? 'radial-gradient(120% 100% at 50% 0%, rgba(16,185,129,0.12), transparent 60%), rgba(255,255,255,0.025)' : 'var(--js-surface)', position: 'relative', transform: p.hot ? 'scale(1.03)' : 'none' }}>
            {p.hot && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 999, background: 'linear-gradient(135deg, #10b981, #059669)', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 1.6, color: '#04140d', fontWeight: 600, whiteSpace: 'nowrap' }}>{lang === 'zh' ? '最受欢迎' : 'MOST POPULAR'}</div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: p.hot ? 'var(--js-emerald)' : 'var(--js-ink-3)', textTransform: 'uppercase' }}>{p.name}</div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, letterSpacing: -1.5, color: 'var(--js-ink)' }}>{p.price}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--js-ink-3)' }}>{p.per}</span>
            </div>
            <p className="js-body-sm" style={{ marginTop: 10, minHeight: 38 }}>{p.desc}</p>
            <a className={p.hot ? 'js-btn-primary' : 'js-btn-ghost'} href="#" onClick={(e) => { e.preventDefault(); onLogin() }} style={{ width: '100%', justifyContent: 'center', marginTop: 8, boxSizing: 'border-box' }}>{p.cta}</a>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {p.feats.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1, background: 'rgba(16,185,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--js-emerald)' }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--js-ink-2)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */
function IntroFAQ({ c, lang }) {
  const [open, setOpen] = useState(0)
  return (
    <section style={{ padding: '40px 40px 96px', maxWidth: 920, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="js-eyebrow" style={{ color: 'var(--js-emerald)' }}>07 / {lang === 'zh' ? '问答' : 'FAQ'}</div>
        <h2 className="js-h2" style={{ marginTop: 12 }}>{c.faqHead}</h2>
        <p className="js-body" style={{ marginTop: 10 }}>{c.faqSub}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {c.faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={i} className="js-card" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setOpen(isOpen ? -1 : i)}>
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--js-ink)' }}>{f.q}</span>
                <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: isOpen ? 'rgba(16,185,129,0.16)' : 'rgba(241,245,249,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOpen ? 'var(--js-emerald)' : 'var(--js-ink-3)', fontSize: 16, transition: 'transform 0.3s var(--ease-out)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
              </div>
              <div style={{ maxHeight: isOpen ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.4s var(--ease-out)' }}>
                <p className="js-body" style={{ padding: '0 24px 22px', fontSize: 14.5, maxWidth: 680 }}>{f.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── CTA + Footer ─────────────────────────────────────────────────────── */
function IntroCTA({ c, lang, onLogin }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '0 40px 0' }}>
      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', borderRadius: 32, padding: '80px 56px', textAlign: 'center', overflow: 'hidden', background: 'radial-gradient(120% 140% at 50% 0%, rgba(16,185,129,0.24), transparent 60%), radial-gradient(100% 120% at 50% 120%, rgba(245,213,112,0.12), transparent 55%), rgba(8,18,32,0.7)', border: '1px solid rgba(16,185,129,0.32)' }}>
        <div className="js-dots" style={{ position: 'absolute', inset: 0, opacity: 0.4, maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)' }}></div>
        <Sparks count={10} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', marginBottom: 24 }}>
            <span className="js-pill"><span className="js-dot" style={{ width: 5, height: 5 }}></span>🐢 {lang === 'zh' ? '慢钱，从容' : 'SLOW MONEY, MADE CALM'}</span>
          </div>
          <h2 className="js-h1" style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}>{c.ctaHead}</h2>
          <p className="js-body" style={{ marginTop: 18, fontSize: 17, maxWidth: 440, marginInline: 'auto' }}>{c.ctaSub}</p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a className="js-btn-primary" href="#" onClick={(e) => { e.preventDefault(); onLogin() }} style={{ padding: '15px 26px', fontSize: 15 }}>{c.finalCtaA} <span style={{ fontSize: 16 }}>→</span></a>
            <a className="js-btn-ghost" href="#" style={{ padding: '14px 22px', fontSize: 15 }}>{c.finalCtaB}</a>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 19, color: '#04140d', fontWeight: 700 }}>J</div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: -0.5 }}>JSave</span>
            </div>
            <p className="js-body-sm" style={{ maxWidth: 260 }}>{c.foot}</p>
          </div>
          {c.footCols.map((col) => (
            <div key={col.h}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--js-ink-4)', textTransform: 'uppercase', marginBottom: 16 }}>{col.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.items.map((it) => (
                  <a key={it} href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--js-ink-2)', textDecoration: 'none' }}>{it}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <hr className="js-hr" style={{ margin: '40px 0 24px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--js-ink-4)' }}>© 2026 JSave · 记账. {lang === 'zh' ? '保留所有权利。' : 'All rights reserved.'}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--js-ink-4)' }}>Made with 🐢 in Kuala Lumpur</span>
        </div>
      </footer>
    </section>
  )
}

/* ── Root ─────────────────────────────────────────────────────────────── */
export default function IntroPage({ onLogin }) {
  const { lang } = useLang()
  const c = COPY[lang] ?? COPY.en

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.js-reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.12 })
    els.forEach((el) => io.observe(el))
    const fallback = setTimeout(() => els.forEach((el) => el.classList.add('visible')), 1200)
    return () => { io.disconnect(); clearTimeout(fallback) }
  }, [lang])

  return (
    <div className="js-intro-root js-bg" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <IntroNav c={c} onLogin={onLogin} />
      <IntroHero c={c} lang={lang} onLogin={onLogin} />
      <IntroTicker c={c} />
      <IntroFeatures c={c} lang={lang} />
      <IntroLiveDemo c={c} lang={lang} />
      <IntroStats c={c} lang={lang} />
      <IntroRoadmap c={c} lang={lang} />
      <IntroPricing c={c} lang={lang} onLogin={onLogin} />
      <IntroFAQ c={c} lang={lang} />
      <IntroCTA c={c} lang={lang} onLogin={onLogin} />
    </div>
  )
}
