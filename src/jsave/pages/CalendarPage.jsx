import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import GlassCard from '../components/GlassCard'
import TransactionForm from '../components/TransactionForm'
import PageHeader from '../components/PageHeader'
import { toLocalDateString } from '../utils/date'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function fmt(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function pad(n) { return String(n).padStart(2, '0') }

export default function CalendarPage({ onOpenSettings }) {
  const { t, lang } = useLang()
  const { transactions, settings } = useJSave()
  const cur = settings?.currency ?? 'MYR'

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editTx, setEditTx] = useState(null)

  const monthStr = `${year}-${pad(month + 1)}`

  const txByDay = useMemo(() => {
    const map = {}
    transactions
      .filter(t => t.date.startsWith(monthStr))
      .forEach(tx => {
        const d = tx.date.split('-')[2]
        if (!map[d]) map[d] = []
        map[d].push(tx)
      })
    return map
  }, [transactions, monthStr])

  const monthIncome = useMemo(() =>
    Object.values(txByDay).flat().filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [txByDay]
  )
  const monthExpense = useMemo(() =>
    Object.values(txByDay).flat()
      .filter(t => t.type === 'expense' || t.type === 'split')
      .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0),
    [txByDay]
  )

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  // Build calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayStr = toLocalDateString(now)
  const selectedDayTx = selectedDay ? (txByDay[pad(selectedDay)] ?? []) : []

  return (
    <div className="jsave-page">
      <PageHeader code={`02 / ${lang === 'zh' ? '日历' : 'CALENDAR'}`} title={t('navCalendar')} onOpenSettings={onOpenSettings} settingsLabel={t('navSettings')} />

      {/* Month nav */}
      <div className="jsave-cal-header">
        <button className="jsave-icon-btn" onClick={prevMonth}>‹</button>
        <h2 className="jsave-cal-month">
          {new Date(year, month).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </h2>
        <button className="jsave-icon-btn" onClick={nextMonth}>›</button>
      </div>

      {/* Monthly summary */}
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

      {/* Day headers */}
      <div className="jsave-cal-grid">
        {DAY_KEYS.map(k => (
          <div key={k} className="jsave-cal-dow">{t(k)}</div>
        ))}

        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />
          const key = pad(d)
          const dayTxs = txByDay[key] ?? []
          const dayIncome  = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
          const dayExpense = dayTxs
            .filter(t => t.type === 'expense' || t.type === 'split')
            .reduce((s, t) => s + (t.type === 'split' ? (t.myShare ?? t.amount) : t.amount), 0)
          const net = dayIncome - dayExpense
          const dateStr = `${year}-${pad(month + 1)}-${key}`
          const isToday = dateStr === todayStr
          const isSelected = selectedDay === d

          return (
            <div
              key={d}
              className={`jsave-cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${dayTxs.length ? (net >= 0 ? ' has-income' : ' has-expense') : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : d)}
            >
              <span className="jsave-cal-day-num">{d}</span>
              {dayTxs.length > 0 && (
                <span className={`jsave-cal-day-amt ${net >= 0 ? 'txt-income' : 'txt-expense'}`}>
                  {net >= 0 ? '+' : ''}{Math.round(net)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Day detail */}
      {selectedDay && (
        <GlassCard className="jsave-day-detail">
          <div className="jsave-day-detail-header">
            <h3>{`${year}-${pad(month + 1)}-${pad(selectedDay)}`}</h3>
            <button className="jsave-icon-btn" onClick={() => { setEditTx(null); setShowForm(true) }}>+</button>
          </div>
          {selectedDayTx.length === 0 ? (
            <p className="jsave-empty-msg">{t('noTxDay')}</p>
          ) : (
            selectedDayTx.map(tx => {
              const isSplit = tx.type === 'split'
              const displayAmt = isSplit ? (tx.myShare ?? tx.amount) : tx.amount
              const amtClass = tx.type === 'income' ? 'txt-income' : isSplit ? 'txt-split' : 'txt-expense'
              const prefix   = tx.type === 'income' ? '+' : '−'
              return (
                <div key={tx.id} className="jsave-tx-row" onClick={() => { setEditTx(tx); setShowForm(true) }}>
                  <div className="jsave-tx-left">
                    <span className={`jsave-tx-cat ${isSplit ? 'txt-split' : ''}`}>{t(tx.category) || tx.category}</span>
                    {tx.note && <span className="jsave-tx-note">{tx.note}</span>}
                  </div>
                  <span className={`jsave-tx-amount ${amtClass}`}>
                    {prefix}{fmt(displayAmt, cur)}
                  </span>
                </div>
              )
            })
          )}
        </GlassCard>
      )}

      {showForm && (
        <TransactionForm
          initial={editTx ? editTx : { date: selectedDay ? `${year}-${pad(month + 1)}-${pad(selectedDay)}` : undefined }}
          onClose={() => { setShowForm(false); setEditTx(null) }}
        />
      )}
    </div>
  )
}
