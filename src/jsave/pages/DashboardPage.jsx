import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import TransactionForm from '../components/TransactionForm'
import { Sparkline, ProgressRing } from '../components/JSaveCharts'
import PageHeader from '../components/PageHeader'
import GoalThumbnail from '../components/GoalThumbnail'
import ItemThumbnail from '../components/ItemThumbnail'
import { localDateDaysAgo, toLocalDateString } from '../utils/date'
import { getDashboardItem, itemDaysOwned, itemStatus } from '../utils/itemGroups'

function fmt(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

function fmtShort(amount, currency = 'MYR') {
  if (Math.abs(amount) >= 1000) {
    return currency === 'MYR'
      ? `RM ${(amount / 1000).toFixed(1)}k`
      : `${(amount / 1000).toFixed(1)}k`
  }
  return fmt(amount, currency)
}

function monthRange() {
  const now = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const end = toLocalDateString(now)
  return { start, end }
}

function todayStr() {
  return toLocalDateString()
}

function yesterdayStr() {
  return localDateDaysAgo(1)
}

const CAT_ICONS = {
  catFood: '🍜', catTransport: '🚖', catBills: '🧾',
  catEntertainment: '🎬', catHealth: '💊', catShopping: '🛒', catOther: '🎁',
  catSalary: '💼', catFreelance: '💻', catInvestment: '📈', catGift: '🎁',
  catOtherIncome: '💰',
}

// ── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx, accounts, cur, t, onClick }) {
  const isIncome = tx.type === 'income'
  const isTransfer = tx.type === 'transfer'
  const isSplit = tx.type === 'split'

  const icon = isTransfer ? '⇄' : isSplit ? '⇄' : (CAT_ICONS[tx.category] || '💳')
  const label = isTransfer
    ? `${accounts.find(a => a.id === tx.fromAccountId)?.name ?? '?'} → ${accounts.find(a => a.id === tx.toAccountId)?.name ?? '?'}`
    : t(tx.category) || tx.category
  const note = tx.note || tx.date
  const amount = isSplit ? (tx.myShare ?? tx.amount) : tx.amount
  const sign = isIncome ? '+' : '−'
  const amtColor = isIncome ? '#10b981' : isTransfer ? '#818cf8' : isSplit ? '#f59e0b' : '#f43f5e'

  return (
    <div onClick={onClick} style={{
      padding: '10px 12px',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(241,245,249,0.05)',
      display: 'flex', alignItems: 'center', gap: 12,
      cursor: 'pointer',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: isIncome ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.4)', marginTop: 2 }}>{note}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: amtColor, flexShrink: 0 }}>
        <span style={{ color: 'rgba(241,245,249,0.4)' }}>RM </span>{sign}{Math.abs(amount).toFixed(2)}
      </div>
    </div>
  )
}

function HomeItemCard({ item, cur, lang, onClick, expanded = false, automatic = false }) {
  const status = item.isGroup
    ? (item.activeMembers.length > 0 ? 'active' : 'retired')
    : itemStatus(item)
  const statusLabel = status === 'sold'
    ? (lang === 'zh' ? '已出售' : 'Sold')
    : status === 'retired'
      ? (lang === 'zh' ? '已退役' : 'Retired')
      : (lang === 'zh' ? '使用中' : 'Active')
  const cost = item.isGroup ? item.activeTotalCost : Number(item.cost || 0)
  const detail = item.isGroup
    ? (lang === 'zh'
        ? `${item.activeMembers.length} / ${item.members.length} 个部件在用`
        : `${item.activeMembers.length} / ${item.members.length} parts active`)
    : (lang === 'zh' ? `已使用 ${itemDaysOwned(item)} 天` : `${itemDaysOwned(item)} days owned`)

  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', minWidth: 0, padding: expanded ? '14px 16px' : 14,
      borderRadius: 18, border: '1px solid rgba(16,185,129,0.2)',
      background: 'linear-gradient(135deg, rgba(16,185,129,0.09), rgba(255,255,255,0.025))',
      display: 'flex', alignItems: 'center', gap: 11, color: 'inherit', textAlign: 'left', cursor: 'pointer',
    }} aria-label={`${lang === 'zh' ? '打开物品' : 'Open item'} ${item.name}`}>
      <ItemThumbnail item={item} size={expanded ? 48 : 42} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <small style={{ display: 'block', color: 'rgba(241,245,249,0.42)', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {automatic ? (lang === 'zh' ? '物品详情' : 'Item details') : (lang === 'zh' ? '首页物品' : 'Featured item')}
        </small>
        <strong style={{ marginTop: 3, display: 'block', overflow: 'hidden', color: '#f1f5f9', fontSize: expanded ? 14 : 12, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</strong>
        <small style={{ marginTop: 3, display: 'block', overflow: 'hidden', color: 'rgba(241,245,249,0.44)', fontFamily: 'var(--font-mono)', fontSize: 8.5, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {detail} · {statusLabel}
        </small>
      </span>
      <span style={{ flexShrink: 0, textAlign: 'right' }}>
        <strong style={{ display: 'block', color: '#10b981', fontFamily: 'var(--font-display)', fontSize: expanded ? 20 : 17, letterSpacing: -0.4 }}>{Number(item.cpd || 0).toFixed(2)}</strong>
        <small style={{ display: 'block', color: 'rgba(241,245,249,0.38)', fontFamily: 'var(--font-mono)', fontSize: 7.5 }}>{cur} / {lang === 'zh' ? '天' : 'day'}</small>
        {expanded && <small style={{ marginTop: 3, display: 'block', color: 'rgba(241,245,249,0.42)', fontFamily: 'var(--font-mono)', fontSize: 8 }}>{cur} {cost.toFixed(2)}</small>}
      </span>
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage({ onOpenSettings, onNavigate }) {
  const { t, lang } = useLang()
  const { transactions, accounts, goals, items, settings, getTotalBalance, loading } = useJSave()
  const [editTx, setEditTx] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const cur = settings?.currency ?? 'MYR'
  const { start, end } = monthRange()
  const today = todayStr()
  const yesterday = yesterdayStr()

  const monthTx = useMemo(() =>
    transactions.filter(tx => tx.date >= start && tx.date <= end),
    [transactions, start, end]
  )

  const monthIncome = useMemo(() =>
    monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTx]
  )
  const monthExpense = useMemo(() =>
    monthTx.filter(t => t.type === 'expense' || t.type === 'split')
      .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0),
    [monthTx]
  )

  const todayExpense = useMemo(() =>
    transactions.filter(tx => tx.date === today && (tx.type === 'expense' || tx.type === 'split'))
      .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0),
    [transactions, today]
  )
  const yesterdayExpense = useMemo(() =>
    transactions.filter(tx => tx.date === yesterday && (tx.type === 'expense' || tx.type === 'split'))
      .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0),
    [transactions, yesterday]
  )
  const dailyBudget = Number(settings?.dailyBudget) || 0
  const budgetRemaining = dailyBudget - todayExpense
  const budgetPercent = dailyBudget > 0 ? Math.min(100, (todayExpense / dailyBudget) * 100) : 0

  const totalBalance = getTotalBalance()
  const recent = transactions.slice(0, 12)
  const pendingSplits = useMemo(() => transactions.filter(transaction =>
    transaction.type === 'split' && transaction.splitWith?.some(friend => !friend.settled)
  ), [transactions])
  const pendingSplitAmount = useMemo(() => pendingSplits.reduce((total, transaction) =>
    total + transaction.splitWith.filter(friend => !friend.settled).reduce((sum, friend) => sum + Number(friend.share || 0), 0)
  , 0), [pendingSplits])
  const pendingSplitPeople = useMemo(() => pendingSplits.reduce((total, transaction) =>
    total + transaction.splitWith.filter(friend => !friend.settled).length
  , 0), [pendingSplits])

  // Sparkline: last 14 days running balance trend
  const sparkData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      return localDateDaysAgo(13 - i)
    })
    let running = accounts.reduce((s, a) => s + (a.initialBalance ?? 0), 0)
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
    const vals = []
    let tIdx = 0
    for (const day of days) {
      while (tIdx < sorted.length && sorted[tIdx].date <= day) {
        const tx = sorted[tIdx]
        if (tx.type === 'income') running += tx.amount
        else if (tx.type === 'expense') running -= tx.amount
        else if (tx.type === 'split') running -= (tx.myShare ?? tx.amount)
        tIdx++
      }
      vals.push(Math.max(0, running))
    }
    return vals
  }, [accounts, transactions])

  // Category spending this month
  const catSpend = useMemo(() => {
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    const CATS = ['catFood', 'catTransport', 'catShopping', 'catEntertainment']
    return CATS.map(k => ({ key: k, icon: CAT_ICONS[k], label: t(k), amount: map[k] || 0 }))
  }, [monthTx, t])

  // Top goal
  const topGoal = goals?.[0]
  const goalPct = topGoal
    ? Math.min(1, (topGoal.currentAmount || 0) / (topGoal.targetAmount || 1))
    : 0
  const homeItem = useMemo(
    () => getDashboardItem(items, settings?.homeItemId, !topGoal),
    [items, settings?.homeItemId, topGoal]
  )
  const manuallyFeaturedItem = Boolean(homeItem && settings?.homeItemId === homeItem.id)

  const vsYesterday = todayExpense - yesterdayExpense
  const vsColor = vsYesterday > 0 ? '#f43f5e' : '#10b981'
  const vsSign = vsYesterday > 0 ? '▲' : '▼'

  if (loading) return <div className="jsave-center-msg">{t('loading')}</div>

  return (
    <div className="jsave-page">

      <PageHeader code="00 / HOME" title="JSave" onOpenSettings={onOpenSettings} settingsLabel={t('navSettings')} />

      {/* ── Balance Hero Card ── */}
      <div style={{
        padding: '22px 22px 18px',
        borderRadius: 28,
        background: 'radial-gradient(140% 80% at 0% 0%, rgba(16,185,129,0.32), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(245,213,112,0.14), transparent 65%), linear-gradient(135deg, rgba(16,185,129,0.16), rgba(8,18,32,0.6))',
        border: '1px solid rgba(16,185,129,0.28)',
        position: 'relative', overflow: 'hidden',
        marginBottom: 12,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.5)', textTransform: 'uppercase' }}>{t('totalBalance')}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(241,245,249,0.5)' }}>{cur === 'MYR' ? 'RM' : cur}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: -1.5, color: '#f1f5f9', lineHeight: 1 }}>
            {Math.abs(totalBalance).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'rgba(241,245,249,0.5)' }}>
          <span>
            <span style={{ color: monthIncome - monthExpense >= 0 ? '#10b981' : '#f43f5e' }}>
              {monthIncome - monthExpense >= 0 ? '▲' : '▼'} {Math.abs(monthIncome - monthExpense).toFixed(0)}
            </span>
            {' '}{lang === 'zh' ? '本月净' : 'net this month'}
          </span>
          <span><span style={{ color: '#f5d570' }}>+{fmtShort(monthIncome, cur)}</span> {lang === 'zh' ? '收入' : 'in'}</span>
        </div>
        <div style={{ marginTop: 14, marginLeft: -4 }}>
          <Sparkline data={sparkData.length > 1 ? sparkData : [0, 1]} width={360} height={52} color="#10b981" strokeWidth={1.6} showDot />
        </div>
        {/* Corner ticks */}
        <i className="js-tick" style={{ position: 'absolute', top: 10, right: 10, width: 12, height: 12, color: '#10b981', opacity: 0.5 }}></i>
        <i className="js-tick" style={{ position: 'absolute', bottom: 10, left: 10, width: 12, height: 12, color: '#10b981', opacity: 0.5 }}></i>
      </div>

      {pendingSplits.length > 0 && (
        <button className="jsave-aa-receivable" type="button" onClick={() => { setEditTx(pendingSplits[0]); setShowForm(true) }}>
          <span className="jsave-aa-receivable-icon">AA</span>
          <span><small>{lang === 'zh' ? '待收分账' : 'Split receivables'}</small><strong>{fmt(pendingSplitAmount, cur)}</strong></span>
          <span className="jsave-aa-receivable-meta">{lang === 'zh' ? `${pendingSplitPeople} 人待还` : `${pendingSplitPeople} pending`}<b>›</b></span>
        </button>
      )}

      {/* ── Double grid: Today spend + Top goal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {/* Today spend */}
        <div onClick={() => onNavigate?.('calendar')} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.07)', cursor: 'pointer' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: 1.4, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase' }}>{t('spendToday')}</div>
          <div style={{ marginTop: 5, fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: -0.8, color: '#f1f5f9' }}>
            {cur === 'MYR' ? 'RM' : cur} {todayExpense.toFixed(2)}
          </div>
          {yesterdayExpense > 0 && (
            <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: vsColor }}>
              {vsSign} {Math.abs(vsYesterday).toFixed(0)} {t('vsYesterday')}
            </div>
          )}
          {dailyBudget > 0 && (
            <>
              <div style={{ marginTop: 7, height: 3, borderRadius: 999, background: 'rgba(241,245,249,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${budgetPercent}%`, height: '100%', background: budgetRemaining >= 0 ? '#10b981' : '#f43f5e' }} />
              </div>
              <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 8.5, color: budgetRemaining >= 0 ? '#10b981' : '#f43f5e' }}>
                {budgetRemaining >= 0
                  ? t('budgetRemaining').replace('{amount}', Math.abs(budgetRemaining).toFixed(0))
                  : t('budgetOver').replace('{amount}', Math.abs(budgetRemaining).toFixed(0))}
              </div>
            </>
          )}
        </div>
        {/* Top goal, or an item when there are no goals */}
        {topGoal ? (
          <div onClick={() => onNavigate?.('goals')} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.07)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <ProgressRing value={goalPct} size={52} thickness={5} color="#f5d570">
                {Math.round(goalPct * 100)}%
              </ProgressRing>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: 1.4, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase' }}>{t('goalComplete')}</div>
                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <GoalThumbnail goal={topGoal} size={22} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{topGoal.name}</span>
                </div>
              </div>
          </div>
        ) : homeItem ? (
          <HomeItemCard item={homeItem} cur={cur} lang={lang} automatic={!manuallyFeaturedItem} onClick={() => onNavigate?.('goals', { itemId: homeItem.id })} />
        ) : (
          <div onClick={() => onNavigate?.('goals')} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.07)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: 1.4, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>{t('topGoal')}</div>
              <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.3)' }}>{t('noGoals')}</div>
            </div>
          </div>
        )}
      </div>

      {topGoal && manuallyFeaturedItem && (
        <div style={{ marginBottom: 12 }}>
          <HomeItemCard item={homeItem} cur={cur} lang={lang} expanded onClick={() => onNavigate?.('goals', { itemId: homeItem.id })} />
        </div>
      )}

      {/* ── Categories grid ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>{t('categories')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {catSpend.map(({ key, icon, label, amount }) => (
            <div key={key} style={{ padding: '12px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 0.8, color: 'rgba(241,245,249,0.5)', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 10, color: amount > 0 ? '#f1f5f9' : 'rgba(241,245,249,0.25)' }}>
                {amount > 0 ? amount.toFixed(0) : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase' }}>{t('recentActivity')}</div>
          {recent.length > 0 && (
            <button onClick={() => onNavigate?.('calendar')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#10b981', cursor: 'pointer' }}>
              {t('seeAll')} →
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="jsave-empty-msg">{t('noTx')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map(tx => (
              <TxRow key={tx.id} tx={tx} accounts={accounts} cur={cur} t={t}
                onClick={() => { setEditTx(tx); setShowForm(true) }} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm initial={editTx} onClose={() => { setShowForm(false); setEditTx(null) }} />
      )}
    </div>
  )
}
