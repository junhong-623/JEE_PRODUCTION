import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import { Donut, BarChart as JSBarChart, AreaChart } from '../components/JSaveCharts'
import PageHeader from '../components/PageHeader'
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

function trendBuckets(range, lang) {
  const now = new Date()
  if (range === 'last30') {
    const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index * 5)
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 4)
      return {
        start: toLocalDateString(start), end: toLocalDateString(end),
        label: start.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en', { month: 'short', day: 'numeric' }),
      }
    })
  }

  const count = range === 'last3m' ? 3 : range === 'last6m' ? 6 : now.getMonth() + 1
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      start: `${key}-01`, end: `${key}-31`,
      label: date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en', { month: 'short' }),
    }
  })
}

// ── Card wrapper ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      padding: '18px 16px', borderRadius: 18,
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

      {/* Deterministic observation based on this period's entries */}
      <div className="jsave-report-observation">
        <div className="jsave-report-observation-label">{t('aiSuggestion')}</div>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(241,245,249,0.85)', margin: 0 }}>{aiTip}</p>
      </div>
    </>
  )
}

// ── Balances view ──────────────────────────────────────────────────────────
function BalancesView({ accounts, getAccountBalance, cur, t }) {
  const balances = accounts.map(a => ({ ...a, bal: getAccountBalance(a.id) }))
  const total = balances.reduce((s, a) => s + a.bal, 0)
  const absoluteTotal = balances.reduce((sum, account) => sum + Math.abs(account.bal), 0)
  if (accounts.length === 0) return <p className="jsave-empty-msg">{t('noAccounts')}</p>
  return (
    <Card>
      <Eyebrow>{t('accountBalances')}</Eyebrow>
      <div className="jsave-report-balance-total">
        <span>{t('totalBalance')}</span>
        <strong className={total >= 0 ? 'positive' : 'negative'}>{fmtFull(total, cur)}</strong>
      </div>
      <div className="jsave-report-balance-list">
        {balances.map((account, index) => {
          const color = account.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
          const percentage = absoluteTotal > 0 ? Math.abs(account.bal) / absoluteTotal * 100 : 0
          return (
            <div className="jsave-report-balance-row" key={account.id}>
              <div><span>{account.name}</span><strong className={account.bal >= 0 ? 'positive' : 'negative'}>{fmtFull(account.bal, cur)}</strong></div>
              <div className="jsave-report-balance-track"><i style={{ width: `${percentage}%`, background: color }} /></div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Trend view ───────────────────────────────────────────────────────────────
function TrendView({ filtered, cur, t, lang, range }) {
  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense' || t.type === 'split')
    .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0)
  const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0
  const buckets = useMemo(() => trendBuckets(range, lang), [range, lang])
  const chartData = useMemo(() => {
    const income = buckets.map(() => 0)
    const expense = buckets.map(() => 0)
    filtered.forEach(transaction => {
      const bucketIndex = buckets.findIndex(bucket => transaction.date >= bucket.start && transaction.date <= bucket.end)
      if (bucketIndex < 0) return
      if (transaction.type === 'income') income[bucketIndex] += transaction.amount
      if (transaction.type === 'expense' || transaction.type === 'split') {
        expense[bucketIndex] += transaction.type === 'split' ? (transaction.myShare ?? transaction.amount) : transaction.amount
      }
    })
    return { income: income.map(Math.round), expense: expense.map(Math.round) }
  }, [buckets, filtered])

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
      <Card>
        <div className="jsave-report-chart-head">
          <div><Eyebrow>{t('trendLabel')}</Eyebrow><h3>{lang === 'zh' ? '收入与支出变化' : 'Income and spending over time'}</h3></div>
          <div className="jsave-report-chart-legend"><span className="income">{t('income')}</span><span className="expense">{t('expense')}</span></div>
        </div>
        <div className="jsave-report-area-chart">
          <AreaChart
            width={620}
            height={230}
            padding={36}
            xLabels={buckets.map(bucket => bucket.label)}
            series={[
              { data: chartData.income, color: '#10b981' },
              { data: chartData.expense, color: '#f43f5e' },
            ]}
          />
        </div>
      </Card>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsPage({ onOpenSettings }) {
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
    if (range === 'last30') return subtractDays(29)
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
    <div className="jsave-page">
      <PageHeader code={`03 / ${VIEW_LABELS[view]}`} title={t('reportsTitle')} onOpenSettings={onOpenSettings} settingsLabel={t('navSettings')} />

      <div className="jsave-report-tabs" role="tablist" aria-label={t('reportsTitle')}>
        {VIEWS.map(v => (
          <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {view !== 'balances' && (
        <label className="jsave-report-range">
          <span>{lang === 'zh' ? '统计范围' : 'Period'}</span>
          <select value={range} onChange={event => setRange(event.target.value)} aria-label={lang === 'zh' ? '统计范围' : 'Report period'}>
            {RANGES.map(item => <option key={item} value={item}>{t(item)}</option>)}
          </select>
        </label>
      )}

      {view === 'insights'  && <InsightsView filtered={filtered} cur={cur} t={t} lang={lang} />}
      {view === 'balances'  && <BalancesView accounts={accounts} getAccountBalance={getAccountBalance} cur={cur} t={t} />}
      {view === 'trend'     && <TrendView filtered={filtered} cur={cur} t={t} lang={lang} range={range} />}
    </div>
  )
}
