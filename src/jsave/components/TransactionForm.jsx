import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'

const INCOME_CATS  = ['catSalary', 'catFreelance', 'catInvestment', 'catGift', 'catOtherIncome']
const EXPENSE_CATS = ['catFood', 'catTransport', 'catBills', 'catEntertainment', 'catHealth', 'catShopping', 'catOther']
const TYPES = ['income', 'expense', 'transfer', 'split']

const today = () => new Date().toISOString().split('T')[0]

function fmt(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

// ── Split edit view ───────────────────────────────────────────────────────────
function SplitEditView({ initial, onClose }) {
  const { t, lang } = useLang()
  const { accounts, updateTransaction, deleteTransaction, settings } = useJSave()
  const cur = settings?.currency ?? 'MYR'

  const [settlements, setSettlements] = useState(() =>
    (initial.splitWith || []).map(f => ({ ...f }))
  )
  const [note, setNote]   = useState(initial.note ?? '')
  const [date, setDate]   = useState(initial.date ?? today())
  const [saving, setSaving] = useState(false)

  const totalOwed    = initial.amount - (initial.myShare ?? 0)
  const totalSettled = settlements.filter(f => f.settled).reduce((s, f) => s + f.share, 0)
  const pendingCount = settlements.filter(f => !f.settled).length

  function toggleSettled(i, on) {
    setSettlements(prev => prev.map((f, idx) => idx !== i ? f : {
      ...f,
      settled: on,
      settledAccountId: on ? (f.settledAccountId || initial.accountId || accounts[0]?.id || '') : null,
    }))
  }

  function updateReturnAccount(i, accId) {
    setSettlements(prev => prev.map((f, idx) => idx === i ? { ...f, settledAccountId: accId } : f))
  }

  async function handleSave() {
    setSaving(true)
    await updateTransaction(initial.id, { ...initial, splitWith: settlements, note, date })
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm(t('confirmDelete'))) return
    await deleteTransaction(initial.id)
    onClose()
  }

  return (
    <div className="jsave-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card">
        <h2 className="jsave-modal-title">{t('txSplitEdit')}</h2>

        {/* Bill summary */}
        <div className="jsave-split-summary">
          <div className="jsave-split-summary-row">
            <span className="jsave-section-sub">{t('txBillAmount')}</span>
            <span style={{ fontWeight: 600 }}>{fmt(initial.amount, cur)}</span>
          </div>
          <div className="jsave-split-summary-row">
            <span className="jsave-section-sub">{t('txMyShare')}</span>
            <span style={{ fontWeight: 600, color: '#f59e0b' }}>{fmt(initial.myShare ?? 0, cur)}</span>
          </div>
          <div className="jsave-split-summary-row">
            <span className="jsave-section-sub">{t('txSettledSummary')}</span>
            <span style={{ fontWeight: 600, color: '#10b981' }}>
              {fmt(totalSettled, cur)} / {fmt(totalOwed, cur)}
            </span>
          </div>
          {pendingCount === 0 && (
            <div className="jsave-split-summary-row" style={{ marginTop: 2 }}>
              <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                {t('txSplitAllSettled')}
              </span>
            </div>
          )}
        </div>

        {/* Friend settlement list */}
        <div className="jsave-split-friends">
          {settlements.map((f, i) => (
            <div key={f.id || i} className="jsave-split-friend-row">
              <div className="jsave-split-friend-left">
                <span className="jsave-split-friend-name">{f.name || `Person ${i + 2}`}</span>
                <span className="jsave-split-friend-share">{fmt(f.share, cur)}</span>
              </div>
              <div className="jsave-split-friend-right">
                {f.settled && accounts.length > 0 && (
                  <select
                    className="jsave-input jsave-input-sm"
                    style={{ fontSize: 12, padding: '5px 8px' }}
                    value={f.settledAccountId || ''}
                    onChange={e => updateReturnAccount(i, e.target.value)}
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
                <label className="jsave-toggle">
                  <input type="checkbox" checked={f.settled} onChange={e => toggleSettled(i, e.target.checked)} />
                  <span className="jsave-toggle-track" />
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Note + date */}
        <div className="jsave-form" style={{ marginTop: 12 }}>
          <label className="jsave-label">{t('txDate')}</label>
          <input className="jsave-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <label className="jsave-label">{t('txNote')}</label>
          <input className="jsave-input" type="text" placeholder={t('txNotePh')} value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="jsave-form-actions" style={{ marginTop: 16 }}>
          <button type="button" className="jsave-btn-danger" onClick={handleDelete}>{t('txDelete')}</button>
          <button type="button" className="jsave-btn-ghost" onClick={onClose}>{t('txCancel')}</button>
          <button type="button" className="jsave-btn-primary" disabled={saving} onClick={handleSave}>{t('txSave')}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function TransactionForm({ initial, onClose }) {
  const { t } = useLang()
  const { accounts, addTransaction, updateTransaction, deleteTransaction, settings } = useJSave()

  // Route to settlement view when editing an existing split
  if (initial?.type === 'split' && initial?.id) {
    return <SplitEditView initial={initial} onClose={onClose} />
  }

  const [type, setType]           = useState(initial?.type ?? 'expense')
  const [amount, setAmount]       = useState(initial?.amount?.toString() ?? '')
  const [category, setCategory]   = useState(initial?.category ?? '')
  const [accountId, setAccountId] = useState(initial?.accountId ?? settings?.defaultAccountId ?? accounts[0]?.id ?? '')
  const [fromAccountId, setFrom]  = useState(initial?.fromAccountId ?? accounts[0]?.id ?? '')
  const [toAccountId, setTo]      = useState(initial?.toAccountId ?? accounts[1]?.id ?? '')
  const [date, setDate]           = useState(initial?.date ?? today())
  const [note, setNote]           = useState(initial?.note ?? '')
  const [saving, setSaving]       = useState(false)

  // Split-specific state
  const [splitCount, setSplitCount]     = useState(2)
  const [friendNames, setFriendNames]   = useState([''])
  const [showFriendDetails, setDetails] = useState(false)

  const cur      = settings?.currency ?? 'MYR'
  const cats     = type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const totalAmt = Number(amount) || 0
  const myShare  = splitCount > 0 ? Math.round((totalAmt / splitCount) * 100) / 100 : 0

  function switchType(tp) {
    setType(tp)
    setCategory('')
    if (tp === 'split') {
      setSplitCount(2)
      setFriendNames([''])
    }
  }

  function updateSplitCount(n) {
    const count = Math.max(2, Math.min(20, n))
    setSplitCount(count)
    const needed = count - 1
    setFriendNames(prev => {
      const next = [...prev]
      while (next.length < needed) next.push('')
      return next.slice(0, needed)
    })
  }

  function updateFriendName(i, name) {
    setFriendNames(prev => { const next = [...prev]; next[i] = name; return next })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    setSaving(true)

    let data
    if (type === 'transfer') {
      if (fromAccountId === toAccountId) { setSaving(false); return }
      data = { type, amount: amt, fromAccountId, toAccountId, date, note, category: 'txTransfer' }
    } else if (type === 'split') {
      const share = Math.round((amt / splitCount) * 100) / 100
      const splitWith = friendNames.map((name, i) => ({
        id: crypto.randomUUID(),
        name: name.trim() || `Person ${i + 2}`,
        share,
        settled: false,
        settledAccountId: null,
      }))
      data = { type: 'split', amount: amt, myShare: share, splitWith, accountId, category, date, note }
    } else {
      data = { type, amount: amt, category, accountId, date, note }
    }

    if (initial?.id) await updateTransaction(initial.id, data)
    else await addTransaction(data)
    onClose()
  }

  async function handleDelete() {
    if (!initial?.id) return
    if (!window.confirm(t('confirmDelete'))) return
    await deleteTransaction(initial.id)
    onClose()
  }

  return (
    <div className="jsave-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card">
        <h2 className="jsave-modal-title">{initial?.id ? t('txEdit') : t('txAdd')}</h2>

        {/* Type toggle */}
        <div className="jsave-type-toggle">
          {TYPES.map(tp => (
            <button
              key={tp}
              type="button"
              className={`jsave-type-btn${type === tp ? ` active-${tp}` : ''}`}
              onClick={() => switchType(tp)}
            >
              {t(`tx${tp.charAt(0).toUpperCase() + tp.slice(1)}`)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="jsave-form">
          <label className="jsave-label">
            {type === 'split' ? t('txBillAmount') : t('txAmount')} ({cur})
          </label>
          <input
            className="jsave-input"
            type="number" min="0" step="0.01" placeholder="0.00"
            value={amount} onChange={e => setAmount(e.target.value)} required
          />

          {/* Split-specific fields */}
          {type === 'split' && (
            <>
              <label className="jsave-label">{t('txSplitCount')}</label>
              <div className="jsave-split-stepper-row">
                <div className="jsave-split-stepper">
                  <button type="button" className="jsave-split-step-btn"
                    onClick={() => updateSplitCount(splitCount - 1)} disabled={splitCount <= 2}>−</button>
                  <span className="jsave-split-step-val">{splitCount}</span>
                  <button type="button" className="jsave-split-step-btn"
                    onClick={() => updateSplitCount(splitCount + 1)} disabled={splitCount >= 20}>+</button>
                </div>
                {totalAmt > 0 && (
                  <span className="jsave-split-myshare-preview">
                    {t('txMyShare')}: <strong style={{ color: '#f59e0b' }}>{fmt(myShare, cur)}</strong>
                  </span>
                )}
              </div>

              <div className="jsave-split-friends-header">
                <label className="jsave-label" style={{ margin: 0 }}>{t('txFriends')}</label>
                <button type="button" className="jsave-btn-link"
                  onClick={() => setDetails(v => !v)}>
                  {showFriendDetails ? t('txFriendSimplify') : t('txFriendDetails')}
                </button>
              </div>

              {showFriendDetails ? (
                friendNames.map((name, i) => (
                  <input
                    key={i}
                    className="jsave-input"
                    type="text"
                    placeholder={`${t('txFriendPh')} ${i + 2}`}
                    value={name}
                    onChange={e => updateFriendName(i, e.target.value)}
                  />
                ))
              ) : (
                <div className="jsave-split-names-preview">
                  {friendNames.map((name, i) => (
                    <span key={i} className="jsave-split-name-pill">
                      {name.trim() || `#${i + 2}`}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {type === 'transfer' ? (
            <>
              <label className="jsave-label">{t('txFrom')}</label>
              <select className="jsave-input" value={fromAccountId} onChange={e => setFrom(e.target.value)} required>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <label className="jsave-label">{t('txTo')}</label>
              <select className="jsave-input" value={toAccountId} onChange={e => setTo(e.target.value)} required>
                {accounts.filter(a => a.id !== fromAccountId).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className="jsave-label">{t('txCategory')}</label>
              <select className="jsave-input" value={category} onChange={e => setCategory(e.target.value)} required>
                <option value="">—</option>
                {(type === 'split' ? EXPENSE_CATS : cats).map(c => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
              {accounts.length > 0 && (
                <>
                  <label className="jsave-label">{t('txAccount')}</label>
                  <select className="jsave-input" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </>
              )}
            </>
          )}

          <label className="jsave-label">{t('txDate')}</label>
          <input className="jsave-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />

          <label className="jsave-label">{t('txNote')}</label>
          <input className="jsave-input" type="text" placeholder={t('txNotePh')} value={note} onChange={e => setNote(e.target.value)} />

          <div className="jsave-form-actions">
            {initial?.id && (
              <button type="button" className="jsave-btn-danger" onClick={handleDelete}>{t('txDelete')}</button>
            )}
            <button type="button" className="jsave-btn-ghost" onClick={onClose}>{t('txCancel')}</button>
            <button type="submit" className="jsave-btn-primary" disabled={saving}>{t('txSave')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
