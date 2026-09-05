import { useState, useMemo, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import { Donut, BarChart as JSBarChart } from '../components/JSaveCharts'
import { localDateDaysAgo, toLocalDateString } from '../utils/date'

function fmt(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}
function fmtFull(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}
function subtractDays(n) { return localDateDaysAgo(n) }
function startOfYear() { return `${new Date().getFullYear()}-01-01` }

const RANGES = ['last30', 'last3m', 'last6m', 'thisYear']
const VIEWS  = ['insights', 'balances', 'trend']

const CAT_COLORS = ['#10b981','#f5d570','#22d3ee','#8b5cf6','#fb7185','#f59e0b','#3b82f6']
const FALLBACK_COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#ef4444']

// ── Animated Pie (kept for balances view) ────────────────────────────────────
const PIE_BASE_R   = 70
const PIE_ACTIVE_R = 84
const PIE_GAP      = 1.5
const PIE_ANIM_MS  = 380

function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function polarXY(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}
function slicePath(cx, cy, r, a0, a1) {
  const [sx, sy] = polarXY(cx, cy, r, a0)
  const [ex, ey] = polarXY(cx, cy, r, a1)
  return `M${cx},${cy} L${sx},${sy} A${r},${r} 0 ${(a1 - a0) > 180 ? 1 : 0},1 ${ex},${ey}Z`
}

function AnimatedPie({ data, selectedIdx, onSelect }) {
  const SIZE = 260, cx = SIZE / 2, cy = SIZE / 2
  const total = data.reduce((s, d) => s + d.value, 0)
  const slices = useMemo(() => {
    let cum = 0
    return data.map(d => {
      const sweep = total > 0 ? (d.value / total) * 360 : 0
      const s = { ...d, a0: cum + PIE_GAP / 2, a1: cum + sweep - PIE_GAP / 2 }
      cum += sweep; return s
    })
  }, [data, total])
  const radiiRef = useRef(slices.map(() => PIE_BASE_R))
  const [, forceRender] = useState(0)
  const rafRef = useRef(null)
  useEffect(() => {
    while (radiiRef.current.length < slices.length) radiiRef.current.push(PIE_BASE_R)
    radiiRef.current = radiiRef.current.slice(0, slices.length)
    const targets = slices.map((_, i) => i === selectedIdx ? PIE_ACTIVE_R : PIE_BASE_R)
    const from = [...radiiRef.current]; const t0 = performance.now()
    cancelAnimationFrame(rafRef.current)
    function step(now) {
      const t = Math.min((now - t0) / PIE_ANIM_MS, 1); const e = easeOutBack(t)
      radiiRef.current = from.map((f, i) => f + (targets[i] - f) * e)
      forceRender(n => n + 1)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [selectedIdx, slices.length])
  return (
    <svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible', cursor: 'pointer' }}>
      {slices.map((s, i) => (
        <path key={i} d={slicePath(cx, cy, Math.max(2, radiiRef.current[i] ?? PIE_BASE_R), s.a0, s.a1)}
          fill={s.color} onClick={() => onSelect(i === selectedIdx ? null : i)} />
      ))}
      {slices.map((s, i) => {
        const mid = (s.a0 + s.a1) / 2; const lr = PIE_ACTIVE_R + 26
        const [lx, ly] = polarXY(cx, cy, lr, mid)
        const anchor = Math.abs(lx - cx) < 10 ? 'middle' : lx > cx ? 'start' : 'end'
        return (
          <g key={`lbl-${i}`} style={{ pointerEvents: 'none' }}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fill={s.color} fontSize={9} fontWeight={600}>{s.name.length > 11 ? s.name.slice(0, 10) + '…' : s.name}</text>
            <text x={lx} y={ly + 9} textAnchor={anchor} fill="rgba(241,245,249,0.5)" fontSize={9}>{s.percent}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Card wrapper ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      padding: '18px 16px', borderRadius: 22,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(241,245,249,0.06)',
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

function Eyebrow({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </div>
  )
}

// ── Insights view ──────────────────────────────────────────────────────────
function InsightsView({ filtered, cur, t, lang }) {
  const byCategory = useMemo(() => {
    const map = {}
    filtered.filter(tx => tx.type === 'expense' || tx.type === 'split').forEach(tx => {
      const amt = tx.type === 'split' ? (tx.myShare ?? tx.amount) : tx.amount
      map[tx.category] = (map[tx.category] || 0) + amt
    })
    return Object.entries(map).map(([cat, amount]) => ({ cat, amount: Math.round(amount) })).sort((a, b) => b.amount - a.amount)
  }, [filtered])

  const totalExpense = byCategory.reduce((s, c) => s + c.amount, 0)
  const donutData = byCategory.slice(0, 5).map((c, i) => ({
    label: t(c.cat) || c.cat,
    value: c.amount,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  // 7-day daily spend
  const weekData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return { date: toLocalDateString(d), label: d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en', { weekday: 'narrow' }) }
    })
    const dayMap = {}
    filtered.filter(tx => tx.type === 'expense' || tx.type === 'split').forEach(tx => {
      const amt = tx.type === 'split' ? (tx.myShare ?? tx.amount) : tx.amount
      dayMap[tx.date] = (dayMap[tx.date] || 0) + amt
    })
    return days.map(d => ({ label: d.label, value: Math.round(dayMap[d.date] || 0) }))
  }, [filtered, lang])

  const maxIdx = weekData.reduce((mi, d, i, arr) => d.value > arr[mi].value ? i : mi, 0)

  // Top category for AI tip
  const topCat = byCategory[0]
  const aiTip = topCat
    ? (lang === 'zh'
      ? `本期在「${t(topCat.cat)}」花费 RM ${topCat.amount.toFixed(0)}，占总支出 ${totalExpense > 0 ? Math.round((topCat.amount / totalExpense) * 100) : 0}%。尝试设置预算目标来控制这项支出。`
      : `You spent RM ${topCat.amount.toFixed(0)} on ${t(topCat.cat)} this period — ${totalExpense > 0 ? Math.round((topCat.amount / totalExpense) * 100) : 0}% of your total expenses. Consider setting a budget to manage this category.`)
    : (lang === 'zh' ? '暂无支出记录。' : 'No expenses recorded yet.')

  if (filtered.length === 0) return <p className="jsave-empty-msg">{t('noData')}</p>

  return (
    <>
      {/* Donut — spend breakdown */}
      <Card>
        <div style={{ marginBottom: 14 }}>
          <div>
            <Eyebrow>{t('spendBreakdown')}</Eyebrow>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: -0.5, color: '#f1f5f9' }}>
              {new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        {donutData.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 140, flex: '0 0 140px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Donut data={donutData} size={130} thickness={16} />
              <div style={{ width: '100%', marginTop: 10, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: 1.6, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase' }}>
                  {lang === 'zh' ? '总额' : 'Total'}
                </div>
                <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 'clamp(14px, 4vw, 18px)', lineHeight: 1.2, color: '#f1f5f9', overflowWrap: 'anywhere' }}>
                  {fmtFull(totalExpense, cur)}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {donutData.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, boxShadow: `0 0 6px ${d.color}`, flexShrink: 0 }}></span>
                  <div style={{ flex: 1, fontSize: 11, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.6)' }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="jsave-empty-msg">{t('noData')}</p>
        )}
      </Card>

      {/* BarChart — 7-day trend */}
      <Card>
        <Eyebrow>{t('weeklyTrend')}</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: -0.4, color: '#f1f5f9' }}>
            {lang === 'zh' ? '七日支出' : '7-Day Spending'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#10b981' }}>
            RM {weekData.reduce((s, d) => s + d.value, 0)}
          </div>
        </div>
        <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
          <JSBarChart data={weekData} width={360} height={100} color="#10b981" highlight={maxIdx} />
        </div>
      </Card>

      {/* AI suggestion */}
      <div style={{
        padding: '14px 16px', borderRadius: 18, marginBottom: 12,
        background: 'linear-gradient(135deg, rgba(245,213,112,0.08), rgba(16,185,129,0.06))',
        border: '1px solid rgba(245,213,112,0.22)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(245,213,112,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✨</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: '#f5d570', textTransform: 'uppercase' }}>{t('aiSuggestion')}</div>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(241,245,249,0.85)', margin: 0 }}>{aiTip}</p>
      </div>
    </>
  )
}

// ── Balances view ──────────────────────────────────────────────────────────
function BalancesView({ accounts, getAccountBalance, cur, t }) {
  const [selectedIdx, setSelectedIdx] = useState(null)
  const balances = accounts.map(a => ({ ...a, bal: getAccountBalance(a.id) }))
  const total = balances.reduce((s, a) => s + a.bal, 0)
  const piePositive = balances.filter(a => a.bal > 0)
  const pieTotal = piePositive.reduce((s, a) => s + a.bal, 0)
  const pieData = piePositive.map((a, i) => ({
    name: a.name,
    value: Math.round(a.bal),
    percent: pieTotal > 0 ? Math.round((a.bal / pieTotal) * 100) : 0,
    color: a.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }))
  const selected = selectedIdx !== null ? pieData[selectedIdx] : null
  if (accounts.length === 0) return <p className="jsave-empty-msg">{t('noAccounts')}</p>
  return (
    <>
      <Card>
        <Eyebrow>{t('accountBalances')}</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {balances.map(acc => (
            <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(241,245,249,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: acc.color || '#10b981', flexShrink: 0 }}></span>
                <span style={{ color: '#f1f5f9' }}>{acc.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: acc.bal >= 0 ? '#10b981' : '#f43f5e' }}>
                {fmtFull(acc.bal, cur)}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, fontSize: 13, fontWeight: 700, color: 'rgba(241,245,249,0.6)' }}>
            <span>{t('totalBalance')}</span>
            <span style={{ color: total >= 0 ? '#10b981' : '#f43f5e', fontFamily: 'var(--font-mono)' }}>{fmtFull(total, cur)}</span>
          </div>
        </div>
      </Card>
      {pieData.length > 0 && (
        <Card>
          <Eyebrow>{t('accountBalances')}</Eyebrow>
          <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, fontSize: 17, fontWeight: 700 }}>
            {selected ? <span style={{ color: selected.color, fontFamily: 'var(--font-display)' }}>{fmtFull(selected.value, cur)}</span>
              : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.3)' }}>{t('tapSliceHint')}</span>}
          </div>
          <AnimatedPie data={pieData} selectedIdx={selectedIdx} onSelect={setSelectedIdx} />
        </Card>
      )}
    </>
  )
}

// ── Trend view ───────────────────────────────────────────────────────────────
function TrendView({ filtered, cur, t, lang }) {
  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense' || t.type === 'split')
    .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0)
  const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  if (filtered.length === 0) return <p className="jsave-empty-msg">{t('noData')}</p>

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: t('totalIncome'), value: fmt(totalIncome, cur), color: '#10b981' },
          { label: t('totalExpense'), value: fmt(totalExpense, cur), color: '#f43f5e' },
          { label: t('savingsRateLabel'), value: `${savingsRate}%`, color: savingsRate >= 0 ? '#10b981' : '#f43f5e' },
        ].map(item => (
          <Card key={item.label} style={{ padding: '12px 10px', textAlign: 'center', marginBottom: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.2, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</div>
          </Card>
        ))}
      </div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { t, lang } = useLang()
  const { transactions, accounts, settings, getAccountBalance } = useJSave()
  const [view, setView] = useState('insights')
  const [range, setRange] = useState('last30')
  const cur = settings?.currency ?? 'MYR'

  const VIEW_LABELS = {
    insights: lang === 'zh' ? '洞察' : 'Insights',
    balances: lang === 'zh' ? '账户' : 'Balances',
    trend: lang === 'zh' ? '趋势' : 'Trend',
  }

  const startDate = useMemo(() => {
    if (range === 'last30') return subtractDays(30)
    if (range === 'last3m') return subtractDays(90)
    if (range === 'last6m') return subtractDays(180)
    return startOfYear()
  }, [range])

  const filtered = useMemo(() =>
    transactions.filter(tx => tx.date >= startDate && tx.type !== 'transfer')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, startDate]
  )

  return (
    <div className="jsave-page" style={{ paddingTop: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 19, color: '#04140d', fontWeight: 700 }}>J</div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase' }}>03 / {lang === 'zh' ? '洞察' : 'INSIGHTS'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: -0.3, color: '#f1f5f9' }}>{t('reportsTitle')}</div>
        </div>
      </div>

      {/* View tabs — pill style */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {VIEWS.map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '7px 14px', borderRadius: 999,
            background: view === v ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.03)',
            border: view === v ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(241,245,249,0.06)',
            color: view === v ? '#10b981' : 'rgba(241,245,249,0.6)',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1.2,
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.18s',
          }}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Range pills (not for balances) */}
      {view !== 'balances' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '5px 12px', borderRadius: 999,
              background: range === r ? 'rgba(16,185,129,0.16)' : 'transparent',
              border: range === r ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(241,245,249,0.08)',
              color: range === r ? '#10b981' : 'rgba(241,245,249,0.5)',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {t(r)}
            </button>
          ))}
        </div>
      )}

      {view === 'insights'  && <InsightsView filtered={filtered} cur={cur} t={t} lang={lang} />}
      {view === 'balances'  && <BalancesView accounts={accounts} getAccountBalance={getAccountBalance} cur={cur} t={t} />}
      {view === 'trend'     && <TrendView filtered={filtered} cur={cur} t={t} lang={lang} />}
    </div>
  )
}
