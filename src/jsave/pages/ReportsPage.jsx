import { useState, useMemo, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import GlassCard from '../components/GlassCard'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const RANGES   = ['last30', 'last3m', 'last6m', 'thisYear']
const VIEWS    = ['balances', 'trend', 'categories']
const PIE_FALLBACK_COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#ef4444']

function fmt(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}
function fmtFull(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}
function subtractDays(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}
function startOfYear() { return `${new Date().getFullYear()}-01-01` }

const TOOLTIP_STYLE = {
  contentStyle: { background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8', fontSize: 11 },
}

// ── Animated Pie ──────────────────────────────────────────────────────────────
const PIE_BASE_R   = 70
const PIE_ACTIVE_R = 86
const PIE_GAP      = 1.5  // degrees gap between slices
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
  const SIZE = 280
  const cx = SIZE / 2, cy = SIZE / 2

  const total = data.reduce((s, d) => s + d.value, 0)

  const slices = useMemo(() => {
    let cum = 0
    return data.map(d => {
      const sweep = total > 0 ? (d.value / total) * 360 : 0
      const s = { ...d, a0: cum + PIE_GAP / 2, a1: cum + sweep - PIE_GAP / 2 }
      cum += sweep
      return s
    })
  }, [data, total])

  const radiiRef = useRef(slices.map(() => PIE_BASE_R))
  const [, forceRender] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    // Keep radiiRef in sync with slice count
    while (radiiRef.current.length < slices.length) radiiRef.current.push(PIE_BASE_R)
    radiiRef.current = radiiRef.current.slice(0, slices.length)

    const targets = slices.map((_, i) => i === selectedIdx ? PIE_ACTIVE_R : PIE_BASE_R)
    const from = [...radiiRef.current]
    const t0 = performance.now()

    cancelAnimationFrame(rafRef.current)
    function step(now) {
      const t = Math.min((now - t0) / PIE_ANIM_MS, 1)
      const e = easeOutBack(t)
      radiiRef.current = from.map((f, i) => f + (targets[i] - f) * e)
      forceRender(n => n + 1)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [selectedIdx, slices.length])

  return (
    <svg
      width="100%"
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ overflow: 'visible', cursor: 'pointer' }}
    >
      {/* Slices */}
      {slices.map((s, i) => (
        <path
          key={i}
          d={slicePath(cx, cy, Math.max(2, radiiRef.current[i] ?? PIE_BASE_R), s.a0, s.a1)}
          fill={s.color}
          onClick={() => onSelect(i === selectedIdx ? null : i)}
        />
      ))}

      {/* Labels: name + percent always visible beside each slice */}
      {slices.map((s, i) => {
        const mid = (s.a0 + s.a1) / 2
        const lr  = PIE_ACTIVE_R + 30
        const [lx, ly] = polarXY(cx, cy, lr, mid)
        const anchor = Math.abs(lx - cx) < 10 ? 'middle' : lx > cx ? 'start' : 'end'
        return (
          <g key={`lbl-${i}`} style={{ pointerEvents: 'none' }}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fill={s.color} fontSize={10} fontWeight={600}>
              {s.name.length > 11 ? s.name.slice(0, 10) + '…' : s.name}
            </text>
            <text x={lx} y={ly + 9} textAnchor={anchor} fill="#94a3b8" fontSize={10}>
              {s.percent}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── View: Account Balances ────────────────────────────────────────────────────
function BalancesView({ accounts, getAccountBalance, cur, t }) {
  const [selectedIdx, setSelectedIdx] = useState(null)

  const balances = accounts.map(a => ({ ...a, bal: getAccountBalance(a.id) }))
  const total    = balances.reduce((s, a) => s + a.bal, 0)

  const piePositive = balances.filter(a => a.bal > 0)
  const pieTotal    = piePositive.reduce((s, a) => s + a.bal, 0)

  const pieData = piePositive.map((a, i) => ({
    name: a.name,
    value: Math.round(a.bal),
    percent: pieTotal > 0 ? Math.round((a.bal / pieTotal) * 100) : 0,
    color: a.color || PIE_FALLBACK_COLORS[i % PIE_FALLBACK_COLORS.length],
  }))

  const selected = selectedIdx !== null ? pieData[selectedIdx] : null

  if (accounts.length === 0) return <p className="jsave-empty-msg">{t('noAccounts')}</p>

  return (
    <>
      {/* Balance list */}
      <GlassCard className="jsave-chart-card">
        <div className="jsave-acc-balances">
          {balances.map(acc => (
            <div key={acc.id} className="jsave-acc-bal-row">
              <div className="jsave-acc-bal-left">
                <span className="jsave-acc-dot" style={{ background: acc.color || '#10b981' }} />
                <span className="jsave-acc-name">{acc.name}</span>
                <span className="jsave-section-sub" style={{ marginLeft: 4 }}>· {t(acc.type)}</span>
              </div>
              <span className={`jsave-acc-bal-amount ${acc.bal >= 0 ? 'txt-income' : 'txt-expense'}`}>
                {fmtFull(acc.bal, cur)}
              </span>
            </div>
          ))}
          <div className="jsave-acc-bal-total">
            <span>{t('totalBalance')}</span>
            <span className={total >= 0 ? 'txt-income' : 'txt-expense'}>{fmtFull(total, cur)}</span>
          </div>
        </div>
      </GlassCard>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <GlassCard className="jsave-chart-card jsave-pie-card">
          <h3 className="jsave-chart-title">{t('accountBalances')}</h3>

          {/* Amount shown on top when a slice is selected */}
          <div className="jsave-pie-top-amount">
            {selected
              ? <span style={{ color: selected.color }}>{fmtFull(selected.value, cur)}</span>
              : <span className="jsave-pie-hint">{t('tapSliceHint')}</span>
            }
          </div>

          <AnimatedPie
            data={pieData}
            selectedIdx={selectedIdx}
            onSelect={setSelectedIdx}
          />
        </GlassCard>
      )}
    </>
  )
}

// ── View: Spending Trend ───────────────────────────────────────────────────────
function TrendView({ filtered, cur, t }) {
  const balanceTrend = useMemo(() => {
    const map = {}
    let running = 0
    filtered.forEach(tx => {
      if (tx.type === 'income')       running += tx.amount
      else if (tx.type === 'expense') running -= tx.amount
      else if (tx.type === 'split')   running -= tx.myShare ?? tx.amount
      map[tx.date] = running
    })
    return Object.entries(map).map(([date, balance]) => ({ date: date.slice(5), balance: Math.round(balance) }))
  }, [filtered])

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered
    .filter(t => t.type === 'expense' || t.type === 'split')
    .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0)
  const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  if (filtered.length === 0) return <p className="jsave-empty-msg">{t('noData')}</p>

  return (
    <>
      <div className="jsave-stat-row">
        <GlassCard className="jsave-stat-card">
          <p className="jsave-stat-label">{t('totalIncome')}</p>
          <p className="jsave-stat-value txt-income">{fmt(totalIncome, cur)}</p>
        </GlassCard>
        <GlassCard className="jsave-stat-card">
          <p className="jsave-stat-label">{t('totalExpense')}</p>
          <p className="jsave-stat-value txt-expense">{fmt(totalExpense, cur)}</p>
        </GlassCard>
        <GlassCard className="jsave-stat-card">
          <p className="jsave-stat-label">{t('savingsRateLabel')}</p>
          <p className={`jsave-stat-value ${savingsRate >= 0 ? 'txt-income' : 'txt-expense'}`}>{savingsRate}%</p>
        </GlassCard>
      </div>

      <GlassCard className="jsave-chart-card">
        <h3 className="jsave-chart-title">{t('trendLabel')}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={balanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={55}
              tickFormatter={v => new Intl.NumberFormat('en', { notation: 'compact' }).format(v)} />
            <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#10b981' }} formatter={v => fmtFull(v, cur)} />
            <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>
    </>
  )
}

// ── View: Category Breakdown ──────────────────────────────────────────────────
function CategoriesView({ filtered, cur, t }) {
  const byCategory = useMemo(() => {
    const map = {}
    filtered.filter(tx => tx.type === 'expense' || tx.type === 'split').forEach(tx => {
      const amt = tx.type === 'split' ? (tx.myShare ?? tx.amount) : tx.amount
      map[tx.category] = (map[tx.category] || 0) + amt
    })
    return Object.entries(map)
      .map(([cat, amount]) => ({ cat: t(cat) || cat, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount)
  }, [filtered, t])

  if (byCategory.length === 0) return <p className="jsave-empty-msg">{t('noData')}</p>

  return (
    <GlassCard className="jsave-chart-card">
      <h3 className="jsave-chart-title">{t('categoryLabel')}</h3>
      <ResponsiveContainer width="100%" height={Math.max(180, byCategory.length * 38)}>
        <BarChart data={byCategory} layout="vertical" margin={{ top: 5, right: 10, left: 64, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={v => new Intl.NumberFormat('en', { notation: 'compact' }).format(v)} />
          <YAxis type="category" dataKey="cat" tick={{ fontSize: 11, fill: '#cbd5e1' }} width={62} />
          <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#f43f5e' }} formatter={v => fmtFull(v, cur)} />
          <Bar dataKey="amount" fill="#f43f5e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { t } = useLang()
  const { transactions, accounts, settings, getAccountBalance } = useJSave()
  const [view,  setView]  = useState('balances')
  const [range, setRange] = useState('last30')
  const cur = settings?.currency ?? 'MYR'

  const VIEW_LABELS = { balances: t('accountBalances'), trend: t('trendLabel'), categories: t('categoryLabel') }

  const startDate = useMemo(() => {
    if (range === 'last30') return subtractDays(30)
    if (range === 'last3m') return subtractDays(90)
    if (range === 'last6m') return subtractDays(180)
    return startOfYear()
  }, [range])

  const filtered = useMemo(() =>
    transactions
      .filter(tx => tx.date >= startDate && tx.type !== 'transfer')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, startDate]
  )

  return (
    <div className="jsave-page">
      <div className="jsave-report-tabs">
        {VIEWS.map(v => (
          <button key={v} className={`jsave-report-tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {view !== 'balances' && (
        <div className="jsave-range-pills">
          {RANGES.map(r => (
            <button key={r} className={`jsave-pill${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>
              {t(r)}
            </button>
          ))}
        </div>
      )}

      {view === 'balances'   && <BalancesView accounts={accounts} getAccountBalance={getAccountBalance} cur={cur} t={t} />}
      {view === 'trend'      && <TrendView filtered={filtered} cur={cur} t={t} />}
      {view === 'categories' && <CategoriesView filtered={filtered} cur={cur} t={t} />}
    </div>
  )
}
