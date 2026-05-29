// JSave phone UI mockups — 5 core screens + Settings
import { useState } from 'react'
import { AnimatedCount, Sparkline, Donut, ProgressRing, BarChart } from './JSaveCharts'

const JS_EMERALD = '#10b981'
const JS_GOLD    = '#f5d570'
const JS_RED     = '#ef4444'
const JS_VIOLET  = '#8b5cf6'
const JS_CYAN    = '#22d3ee'

/* ── Shared chrome ────────────────────────────────────────────────────── */
function PhoneTopChrome({ pageLabel, pageNum }) {
  return (
    <div style={{ padding: '54px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: '#04140d', fontWeight: 700 }}>J</div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'rgba(241,245,249,0.4)' }}>{pageNum}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>{pageLabel}</div>
        </div>
      </div>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(241,245,249,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(241,245,249,0.7)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/>
        </svg>
      </div>
    </div>
  )
}

function PhoneTabbar({ active }) {
  const tabs = [
    { id: 'home', icon: '◳', en: 'Home' },
    { id: 'tx',   icon: '≡', en: 'Ledger' },
    { id: 'add',  icon: '＋', en: '' },
    { id: 'ins',  icon: '◔', en: 'Insights' },
    { id: 'goal', icon: '◉', en: 'Goals' },
  ]
  return (
    <div style={{ position: 'sticky', bottom: 0, margin: '24px 14px 18px', padding: '8px', borderRadius: 24, background: 'rgba(8, 18, 32, 0.7)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(241,245,249,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {tabs.map((t) => {
        const isActive = active === t.id
        if (t.id === 'add') return (
          <div key={t.id} style={{ width: 44, height: 44, borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 6px 18px rgba(16,185,129,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#04140d', fontSize: 22, fontWeight: 600 }}>＋</div>
        )
        return (
          <div key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 0', color: isActive ? JS_EMERALD : 'rgba(241,245,249,0.4)' }}>
            <div style={{ fontSize: 14 }}>{t.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.2 }}>{t.en.toUpperCase()}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── 1. Dashboard ─────────────────────────────────────────────────────── */
export function PhoneDashboard({ lang = 'en', accent = JS_EMERALD }) {
  const trend = [42, 38, 51, 47, 58, 62, 55, 68, 72, 69, 78, 84, 81, 92]
  const t = lang === 'zh' ? {
    title: '主页', num: '00 / 主页',
    balanceLabel: '总储蓄余额', save: '本月已存', cat: '类别', recent: '最近活动', spend: '今日支出', diff: '比昨日',
    catsName: ['餐饮', '通勤', '日用', '娱乐'],
    rows: [
      { n: '咖啡 · Common Man', t: '今天 09:18', v: '−RM 14.00', c: '☕' },
      { n: '工资 · 月薪', t: '今天 08:00', v: '+RM 6,200.00', c: '💼', pos: true },
      { n: 'Grab · 上班', t: '昨天', v: '−RM 12.80', c: '🚖' },
    ],
  } : {
    title: 'Home', num: '00 / Home',
    balanceLabel: 'Total savings', save: 'Saved this month', cat: 'Categories', recent: 'Recent activity', spend: 'Spent today', diff: 'vs yesterday',
    catsName: ['Food', 'Commute', 'Daily', 'Fun'],
    rows: [
      { n: 'Coffee · Common Man', t: 'Today 9:18', v: '−RM 14.00', c: '☕' },
      { n: 'Salary · Monthly', t: 'Today 8:00', v: '+RM 6,200.00', c: '💼', pos: true },
      { n: 'Grab · to work', t: 'Yesterday', v: '−RM 12.80', c: '🚖' },
    ],
  }
  return (
    <div className="js-phone-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <PhoneTopChrome pageLabel={t.title} pageNum={t.num} />
      {/* Balance hero */}
      <div style={{ margin: '24px 20px 0', padding: '22px', borderRadius: 28, background: 'radial-gradient(140% 80% at 0% 0%, rgba(16,185,129,0.32), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(245,213,112,0.16), transparent 65%), linear-gradient(135deg, rgba(16,185,129,0.18), rgba(8,18,32,0.6) 100%)', border: '1px solid rgba(16,185,129,0.28)', position: 'relative', overflow: 'hidden' }}>
        <div className="js-eyebrow" style={{ color: 'rgba(241,245,249,0.5)', fontSize: 9 }}>{t.balanceLabel}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(241,245,249,0.5)' }}>RM</span>
          <AnimatedCount value={48721.42} decimals={2} dur={1800} style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: -1.5, color: '#f1f5f9', lineHeight: 1 }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.2, color: 'rgba(241,245,249,0.5)' }}>
          <span><span style={{ color: JS_EMERALD }}>▲ 4.2%</span> 30D</span>
          <span><span style={{ color: JS_GOLD }}>+RM 1,840</span> {t.save}</span>
        </div>
        <div style={{ marginTop: 14, marginLeft: -4 }}>
          <Sparkline data={trend} width={290} height={56} color={accent} fill="rgba(16,185,129,0.18)" strokeWidth={1.6} />
        </div>
        <i className="js-tick" style={{ top: 10, right: 10 }}></i>
        <i className="js-tick" style={{ bottom: 10, left: 10 }}></i>
      </div>
      {/* Today + Goal */}
      <div style={{ margin: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.08)' }}>
          <div className="js-eyebrow" style={{ fontSize: 8, color: 'rgba(241,245,249,0.4)' }}>{t.spend}</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: -0.5 }}>RM <AnimatedCount value={86.40} decimals={2} dur={1600} /></div>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: JS_EMERALD }}>▼ 18% {t.diff}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.08)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <ProgressRing value={0.72} size={54} thickness={5} color={JS_GOLD}>72%</ProgressRing>
          <div>
            <div className="js-eyebrow" style={{ fontSize: 8, color: 'rgba(241,245,249,0.4)' }}>{lang === 'zh' ? '目标完成' : 'Goal complete'}</div>
            <div style={{ marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600 }}>Tokyo 2026 ✈️</div>
          </div>
        </div>
      </div>
      {/* Category chips */}
      <div style={{ margin: '18px 20px 0' }}>
        <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{t.cat}</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {['🍜','🚖','🛒','🎬'].map((e, i) => (
            <div key={i} style={{ padding: '12px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{e}</div>
              <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 0.8, color: 'rgba(241,245,249,0.5)' }}>{t.catsName[i]}</div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#f1f5f9' }}>{['286','124','418','92'][i]}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Recent */}
      <div style={{ margin: '18px 20px 0', flex: 1 }}>
        <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{t.recent}</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {t.rows.map((r, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(241,245,249,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{r.c}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.n}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{r.t}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: r.pos ? JS_EMERALD : '#f1f5f9' }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>
      <PhoneTabbar active="home" />
    </div>
  )
}

/* ── 2. Ledger ────────────────────────────────────────────────────────── */
export function PhoneTransactions({ lang = 'en' }) {
  const t = lang === 'zh' ? {
    title: '账本', num: '01 / 账本', sum: '本月支出', net: '本月净存',
    filters: ['全部', '支出', '收入', '订阅'],
    groups: [
      { day: '今天 · 周二', total: '−RM 102.80', items: [
        { n: '咖啡 · Common Man', c: '☕', v: '−14.00', tag: '餐饮' },
        { n: 'Grab · 回家', c: '🚖', v: '−18.40', tag: '通勤' },
        { n: '工资 · NextWave', c: '💼', v: '+6,200.00', tag: '收入', pos: true },
      ]},
      { day: '昨天', total: '−RM 218.50', items: [
        { n: 'Lotus 超市', c: '🛒', v: '−86.50', tag: '日用' },
        { n: '电影 · 沙丘 2', c: '🎬', v: '−42.00', tag: '娱乐' },
        { n: 'Spotify', c: '🎧', v: '−14.90', tag: '订阅' },
      ]},
    ],
  } : {
    title: 'Ledger', num: '01 / Ledger', sum: 'This month spend', net: 'This month net',
    filters: ['All', 'Spend', 'Income', 'Subs'],
    groups: [
      { day: 'Today · Tue', total: '−RM 102.80', items: [
        { n: 'Coffee · Common Man', c: '☕', v: '−14.00', tag: 'Food' },
        { n: 'Grab · home', c: '🚖', v: '−18.40', tag: 'Commute' },
        { n: 'Salary · NextWave', c: '💼', v: '+6,200.00', tag: 'Income', pos: true },
      ]},
      { day: 'Yesterday', total: '−RM 218.50', items: [
        { n: 'Lotus Grocery', c: '🛒', v: '−86.50', tag: 'Daily' },
        { n: 'Cinema · Dune 2', c: '🎬', v: '−42.00', tag: 'Fun' },
        { n: 'Spotify', c: '🎧', v: '−14.90', tag: 'Sub' },
      ]},
    ],
  }
  return (
    <div className="js-phone-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <PhoneTopChrome pageLabel={t.title} pageNum={t.num} />
      <div style={{ margin: '20px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: 14, borderRadius: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <div className="js-eyebrow" style={{ fontSize: 8, color: 'rgba(241,245,249,0.4)' }}>{t.sum}</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: -0.5, color: '#ffb4b4' }}>−RM <AnimatedCount value={3284.10} decimals={2} dur={1500} /></div>
        </div>
        <div style={{ padding: 14, borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
          <div className="js-eyebrow" style={{ fontSize: 8, color: 'rgba(241,245,249,0.4)' }}>{t.net}</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: -0.5, color: JS_EMERALD }}>+RM <AnimatedCount value={1942.18} decimals={2} dur={1500} /></div>
        </div>
      </div>
      <div style={{ margin: '14px 20px 0', display: 'flex', gap: 6, overflow: 'auto', scrollbarWidth: 'none' }}>
        {t.filters.map((f, i) => (
          <div key={f} style={{ padding: '6px 12px', borderRadius: 999, background: i === 0 ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.03)', border: i === 0 ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(241,245,249,0.06)', color: i === 0 ? JS_EMERALD : 'rgba(241,245,249,0.6)', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{f}</div>
        ))}
      </div>
      <div style={{ margin: '18px 20px 0' }}>
        {t.groups.map((g) => (
          <div key={g.day} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
              <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.5)' }}>{g.day}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.4)' }}>{g.total}</div>
            </div>
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(241,245,249,0.05)', overflow: 'hidden' }}>
              {g.items.map((r, i) => (
                <div key={i} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid rgba(241,245,249,0.04)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: r.pos ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{r.c}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.n}</div>
                    <div style={{ marginTop: 2, display: 'inline-block', padding: '1px 7px', borderRadius: 999, background: 'rgba(241,245,249,0.05)', fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: 1.2, color: 'rgba(241,245,249,0.5)', textTransform: 'uppercase' }}>{r.tag}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: r.pos ? JS_EMERALD : '#f1f5f9' }}>
                    <span style={{ color: 'rgba(241,245,249,0.4)' }}>RM </span>{r.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <PhoneTabbar active="tx" />
    </div>
  )
}

/* ── 3. Add ───────────────────────────────────────────────────────────── */
export function PhoneAdd({ lang = 'en' }) {
  const t = lang === 'zh' ? {
    title: '新增', num: '02 / 新增', type: ['支出', '收入', '转账'],
    amount: '金额', cat: '类别', note: '备注', account: '账户', when: '时间',
    save: '保存这一笔', placeholder: '记一笔...咖啡, 工资...',
    cats: [{ e: '🍜', n: '餐饮', on: true }, { e: '🚖', n: '通勤' }, { e: '🛒', n: '日用' }, { e: '🎬', n: '娱乐' }, { e: '💼', n: '工资' }, { e: '🎁', n: '其他' }],
    accounts: ['Maybank · 7782', 'Cash', 'Touch n Go'], today: '今天 · 09:18',
  } : {
    title: 'Add', num: '02 / Add', type: ['Spend', 'Income', 'Transfer'],
    amount: 'Amount', cat: 'Category', note: 'Note', account: 'Account', when: 'When',
    save: 'Save this one', placeholder: 'log one... coffee, salary...',
    cats: [{ e: '🍜', n: 'Food', on: true }, { e: '🚖', n: 'Commute' }, { e: '🛒', n: 'Daily' }, { e: '🎬', n: 'Fun' }, { e: '💼', n: 'Income' }, { e: '🎁', n: 'Other' }],
    accounts: ['Maybank · 7782', 'Cash', 'Touch n Go'], today: 'Today · 9:18',
  }
  return (
    <div className="js-phone-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <PhoneTopChrome pageLabel={t.title} pageNum={t.num} />
      <div style={{ margin: '20px 20px 0', padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.06)', display: 'flex', gap: 2 }}>
        {t.type.map((typ, i) => (
          <div key={typ} style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 999, background: i === 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(5,150,105,0.6))' : 'transparent', color: i === 0 ? '#04140d' : 'rgba(241,245,249,0.6)', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700 }}>{typ}</div>
        ))}
      </div>
      <div style={{ margin: '24px 20px 0', padding: '26px 20px', borderRadius: 22, background: 'radial-gradient(120% 80% at 100% 0%, rgba(16,185,129,0.22), transparent 60%), rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.22)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{t.amount}</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'rgba(241,245,249,0.5)' }}>−RM</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: -2, color: '#f1f5f9' }}>14<span style={{ color: 'rgba(241,245,249,0.4)' }}>.00</span></span>
        </div>
        <div style={{ marginTop: 12, display: 'inline-flex', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(8,18,32,0.6)', border: '1px solid rgba(241,245,249,0.08)' }}>
          <span style={{ fontSize: 12 }}>☕</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.6)' }}>{t.placeholder}</span>
        </div>
        <i className="js-tick" style={{ top: 10, right: 10 }}></i>
        <i className="js-tick" style={{ bottom: 10, left: 10 }}></i>
      </div>
      <div style={{ margin: '20px 20px 0' }}>
        <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{t.cat}</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {t.cats.map((c) => (
            <div key={c.n} style={{ padding: '12px 10px', borderRadius: 14, background: c.on ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.025)', border: c.on ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(241,245,249,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 18 }}>{c.e}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.on ? JS_EMERALD : '#f1f5f9' }}>{c.n}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ margin: '20px 20px 0' }}>
        <button className="js-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 0', borderRadius: 16, border: 'none' }}>
          {t.save} <span style={{ fontSize: 14 }}>→</span>
        </button>
      </div>
      <PhoneTabbar active="add" />
    </div>
  )
}

/* ── 4. Insights ──────────────────────────────────────────────────────── */
export function PhoneInsights({ lang = 'en' }) {
  const t = lang === 'zh' ? {
    title: '洞察', num: '03 / 洞察', breakdown: '本月支出明细', total: '本月总额',
    weekly: '七日趋势', smarter: 'AI 建议',
    tip: '本月在外用餐 RM 412 — 比 4 月增加 28%。在家做两顿，下月可省约 RM 120。',
    months: ['一', '二', '三', '四', '五', '六', '日'],
  } : {
    title: 'Insights', num: '03 / Insights', breakdown: 'Spend breakdown', total: 'This month',
    weekly: '7-day trend', smarter: 'AI suggestion',
    tip: 'You spent RM 412 dining out this month — 28% more than April. Two home dinners could save ~RM 120 next month.',
    months: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  }
  const donutData = [
    { label: 'Food', value: 412, color: JS_EMERALD },
    { label: 'Daily', value: 286, color: JS_GOLD },
    { label: 'Commute', value: 184, color: JS_CYAN },
    { label: 'Fun', value: 142, color: JS_VIOLET },
    { label: 'Sub', value: 96, color: '#fb7185' },
  ]
  const weekData = t.months.map((label, i) => ({ label, value: [38, 62, 84, 41, 112, 74, 22][i] }))
  return (
    <div className="js-phone-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <PhoneTopChrome pageLabel={t.title} pageNum={t.num} />
      <div style={{ margin: '20px 20px 0', padding: '20px 16px', borderRadius: 22, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{t.breakdown}</div>
            <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: -0.6 }}>{lang === 'zh' ? '五月 · 2026' : 'May · 2026'}</div>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(245,213,112,0.12)', border: '1px solid rgba(245,213,112,0.32)', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: JS_GOLD, letterSpacing: 1.2 }}>▲ 8%</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
          <Donut data={donutData} size={140} thickness={18} centerLabel={t.total} centerValue="RM 1.1k" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {donutData.map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, boxShadow: `0 0 8px ${d.color}` }}></span>
                <div style={{ flex: 1, fontSize: 11, color: '#f1f5f9' }}>{d.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.6)' }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ margin: '14px 20px 0', padding: '16px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)' }}>
        <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{t.weekly}</div>
        <div style={{ marginTop: 10 }}>
          <BarChart data={weekData} width={300} height={92} color={JS_EMERALD} highlight={4} />
        </div>
      </div>
      <div style={{ margin: '14px 20px 0', padding: 16, borderRadius: 18, background: 'linear-gradient(135deg, rgba(245,213,112,0.08), rgba(16,185,129,0.06))', border: '1px solid rgba(245,213,112,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(245,213,112,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✨</div>
          <div className="js-eyebrow" style={{ fontSize: 9, color: JS_GOLD, letterSpacing: 2 }}>{t.smarter}</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: 'rgba(241,245,249,0.85)' }}>{t.tip}</div>
      </div>
      <PhoneTabbar active="ins" />
    </div>
  )
}

/* ── 5. Goals ─────────────────────────────────────────────────────────── */
export function PhoneGoals({ lang = 'en' }) {
  const t = lang === 'zh' ? {
    title: '目标', num: '04 / 目标', active: '进行中', upcoming: '即将开始',
    primary: { name: 'Tokyo 2026', emoji: '✈️', sub: '日本 · 10 月', cur: 7240, target: 10000, days: 142, pace: '+RM 480/月' },
    items: [
      { name: 'Emergency 应急金', emoji: '🛡️', pct: 0.86, target: '12,000', cur: '10,320', days: 38 },
      { name: 'iPhone 17 Pro', emoji: '📱', pct: 0.42, target: '7,800', cur: '3,276', days: 215 },
      { name: 'Wedding 婚礼', emoji: '💍', pct: 0.18, target: '50,000', cur: '9,000', days: 480 },
    ],
  } : {
    title: 'Goals', num: '04 / Goals', active: 'In progress', upcoming: 'Upcoming',
    primary: { name: 'Tokyo 2026', emoji: '✈️', sub: 'Japan · October', cur: 7240, target: 10000, days: 142, pace: '+RM 480/mo' },
    items: [
      { name: 'Emergency fund', emoji: '🛡️', pct: 0.86, target: '12,000', cur: '10,320', days: 38 },
      { name: 'iPhone 17 Pro', emoji: '📱', pct: 0.42, target: '7,800', cur: '3,276', days: 215 },
      { name: 'Wedding day', emoji: '💍', pct: 0.18, target: '50,000', cur: '9,000', days: 480 },
    ],
  }
  const pct = t.primary.cur / t.primary.target
  return (
    <div className="js-phone-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <PhoneTopChrome pageLabel={t.title} pageNum={t.num} />
      <div style={{ margin: '20px 20px 0', padding: '22px', borderRadius: 26, background: 'radial-gradient(140% 80% at 0% 0%, rgba(245,213,112,0.22), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(16,185,129,0.16), transparent 65%), rgba(8,18,32,0.6)', border: '1px solid rgba(245,213,112,0.28)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,213,112,0.18)', border: '1px solid rgba(245,213,112,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{t.primary.emoji}</div>
          <div>
            <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.5)' }}>{t.active}</div>
            <div style={{ marginTop: 2, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: -0.6 }}>{t.primary.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.5)' }}>{t.primary.sub}</div>
          </div>
        </div>
        <div style={{ marginTop: 18, position: 'relative', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, background: 'linear-gradient(90deg, #f5d570, #10b981)', borderRadius: 999, boxShadow: '0 0 18px rgba(16,185,129,0.6)' }}></div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: -0.8 }}>RM <AnimatedCount value={t.primary.cur} dur={1500} /></span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(241,245,249,0.5)' }}>{' / '}{t.primary.target.toLocaleString()}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: JS_EMERALD }}>{Math.round(pct * 100)}%</div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.5)' }}>
          <span>⏱ {t.primary.days}d</span>
          <span>📈 {t.primary.pace}</span>
        </div>
        <i className="js-tick" style={{ top: 10, right: 10 }}></i>
      </div>
      <div style={{ margin: '18px 20px 0' }}>
        <div className="js-eyebrow" style={{ fontSize: 9, color: 'rgba(241,245,249,0.4)' }}>{t.upcoming}</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {t.items.map((g, i) => (
            <div key={g.name} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProgressRing value={g.pct} size={52} thickness={5} color={i === 0 ? JS_EMERALD : i === 1 ? JS_CYAN : JS_VIOLET}>
                {Math.round(g.pct * 100)}%
              </ProgressRing>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{g.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                </div>
                <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(241,245,249,0.5)' }}>
                  RM {g.cur} / {g.target} · {g.days}d
                </div>
              </div>
              <div style={{ color: 'rgba(241,245,249,0.3)' }}>›</div>
            </div>
          ))}
        </div>
      </div>
      <PhoneTabbar active="goal" />
    </div>
  )
}
