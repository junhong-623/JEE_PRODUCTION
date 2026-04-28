import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import GlassCard from '../components/GlassCard'
import TransactionForm from '../components/TransactionForm'

function TxRow({ tx, accounts, cur, t, onClick }) {
  if (tx.type === 'transfer') {
    const from = accounts.find(a => a.id === tx.fromAccountId)?.name ?? '?'
    const to   = accounts.find(a => a.id === tx.toAccountId)?.name ?? '?'
    return (
      <GlassCard className="jsave-tx-row" onClick={onClick}>
        <div className="jsave-tx-left">
          <span className="jsave-tx-cat txt-transfer">⇄ {from} → {to}</span>
          <span className="jsave-tx-note">{tx.note || tx.date}</span>
        </div>
        <span className="jsave-tx-amount txt-transfer">{fmt(tx.amount, cur)}</span>
      </GlassCard>
    )
  }
  if (tx.type === 'split') {
    const pending = (tx.splitWith || []).filter(f => !f.settled).length
    const total   = (tx.splitWith?.length ?? 0) + 1
    return (
      <GlassCard className="jsave-tx-row" onClick={onClick}>
        <div className="jsave-tx-left">
          <span className="jsave-tx-cat txt-split">⇄ {t(tx.category) || tx.category}</span>
          <span className="jsave-tx-note">
            {total}-way · {pending > 0 ? t('txSplitPendingCount').replace('{n}', pending) : t('txSplitAllSettled')}
          </span>
        </div>
        <span className="jsave-tx-amount txt-expense">−{fmt(tx.myShare ?? tx.amount, cur)}</span>
      </GlassCard>
    )
  }
  return (
    <GlassCard className="jsave-tx-row" onClick={onClick}>
      <div className="jsave-tx-left">
        <span className="jsave-tx-cat">{t(tx.category) || tx.category}</span>
        <span className="jsave-tx-note">{tx.note || tx.date}</span>
      </div>
      <span className={`jsave-tx-amount ${tx.type === 'income' ? 'txt-income' : 'txt-expense'}`}>
        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount, cur)}
      </span>
    </GlassCard>
  )
}

function fmt(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

function monthRange() {
  const now = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const end = now.toISOString().split('T')[0]
  return { start, end }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { t } = useLang()
  const { transactions, accounts, settings, getTotalBalance, loading } = useJSave()
  const [showForm, setShowForm] = useState(false)
  const [editTx, setEditTx] = useState(null)

  const cur = settings?.currency ?? 'MYR'
  const { start, end } = monthRange()

  const monthTx = useMemo(() =>
    transactions.filter(tx => tx.date >= start && tx.date <= end),
    [transactions, start, end]
  )

  const monthIncome = useMemo(() =>
    monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTx]
  )

  const monthExpense = useMemo(() =>
    monthTx
      .filter(t => t.type === 'expense' || t.type === 'split')
      .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0),
    [monthTx]
  )

  const savingsRate = monthIncome > 0
    ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100)
    : 0

  const totalBalance = getTotalBalance()
  const recent = transactions.slice(0, 15)

  if (loading) {
    return <div className="jsave-center-msg">{t('loading')}</div>
  }

  return (
    <div className="jsave-page">
      {/* Balance card */}
      <GlassCard className="jsave-balance-card" glow>
        <p className="jsave-balance-label">{t('totalBalance')}</p>
        <p className="jsave-balance-amount">{fmt(totalBalance, cur)}</p>
        <p className="jsave-savings-rate">
          {t('savingsRate')}: <span className={savingsRate >= 0 ? 'txt-income' : 'txt-expense'}>{savingsRate}%</span>
        </p>
      </GlassCard>

      {/* Month summary */}
      <div className="jsave-stat-row">
        <GlassCard className="jsave-stat-card">
          <p className="jsave-stat-label">{t('income')}</p>
          <p className="jsave-stat-value txt-income">{fmt(monthIncome, cur)}</p>
        </GlassCard>
        <GlassCard className="jsave-stat-card">
          <p className="jsave-stat-label">{t('expense')}</p>
          <p className="jsave-stat-value txt-expense">{fmt(monthExpense, cur)}</p>
        </GlassCard>
        <GlassCard className="jsave-stat-card">
          <p className="jsave-stat-label">{t('net')}</p>
          <p className={`jsave-stat-value ${monthIncome - monthExpense >= 0 ? 'txt-income' : 'txt-expense'}`}>
            {fmt(monthIncome - monthExpense, cur)}
          </p>
        </GlassCard>
      </div>

      {/* Recent transactions */}
      <div className="jsave-section-header">
        <h2 className="jsave-section-title">{t('recentTx')}</h2>
      </div>

      {recent.length === 0 ? (
        <p className="jsave-empty-msg">{t('noTx')}</p>
      ) : (
        <div className="jsave-tx-list">
          {recent.map(tx => (
            <TxRow key={tx.id} tx={tx} accounts={accounts} cur={cur} t={t}
              onClick={() => { setEditTx(tx); setShowForm(true) }} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className={`jsave-fab${showForm ? ' jsave-fab--open' : ''}`}
        onClick={() => { setEditTx(null); setShowForm(true) }}
      >+</button>

      {showForm && (
        <TransactionForm initial={editTx} onClose={() => { setShowForm(false); setEditTx(null) }} />
      )}
    </div>
  )
}
