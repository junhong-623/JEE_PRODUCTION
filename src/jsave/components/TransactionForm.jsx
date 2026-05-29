import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'

const INCOME_CATS  = ['catSalary', 'catFreelance', 'catInvestment', 'catGift', 'catOtherIncome']
const EXPENSE_CATS = ['catFood', 'catTransport', 'catBills', 'catEntertainment', 'catHealth', 'catShopping', 'catOther']
const TYPES = ['income', 'expense', 'transfer', 'split']

const CAT_ICONS = {
  catFood: '🍜', catTransport: '🚖', catBills: '🧾',
  catEntertainment: '🎬', catHealth: '💊', catShopping: '🛒', catOther: '🎁',
  catSalary: '💼', catFreelance: '💻', catInvestment: '📈', catGift: '🎁',
  catOtherIncome: '💰',
}

const TYPE_COLORS = {
  income:   { bg: 'rgba(16,185,129,0.4)', text: '#04140d', border: 'rgba(5,150,105,0.6)' },
  expense:  { bg: 'rgba(244,63,94,0.35)', text: '#fff',    border: 'rgba(244,63,94,0.6)' },
  transfer: { bg: 'rgba(129,140,248,0.35)', text: '#fff',  border: 'rgba(129,140,248,0.6)' },
  split:    { bg: 'rgba(245,158,11,0.35)', text: '#fff',   border: 'rgba(245,158,11,0.6)' },
}

const today = () => new Date().toISOString().split('T')[0]

function monthPrefix(lang) {
  const now = new Date()
  return lang === 'zh'
    ? `${now.getMonth() + 1}月`
    : now.toLocaleString('en', { month: 'short' })
}

function fmt(amount, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

// ── Label ──────────────────────────────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: 1.5, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </div>
  )
}

// ── Meta row (account / date / note) ────────────────────────────────────────
function MetaRow({ icon, label, children, first = false }) {
  return (
    <div style={{
      padding: '11px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      borderTop: first ? 'none' : '1px solid rgba(241,245,249,0.04)',
    }}>
      <div style={{ width: 22, fontSize: 14, textAlign: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <FieldLabel>{label}</FieldLabel>
        {children}
      </div>
    </div>
  )
}

// ── Split edit view ──────────────────────────────────────────────────────────
function SplitEditView({ initial, onClose }) {
  const { t, lang } = useLang()
  const { accounts, updateTransaction, deleteTransaction, settings } = useJSave()
  const cur = settings?.currency ?? 'MYR'

  const [settlements, setSettlements] = useState(() => (initial.splitWith || []).map(f => ({ ...f })))
  const [note, setNote] = useState(initial.note ?? '')
  const [date, setDate] = useState(initial.date ?? today())
  const [saving, setSaving] = useState(false)

  const totalOwed    = initial.amount - (initial.myShare ?? 0)
  const totalSettled = settlements.filter(f => f.settled).reduce((s, f) => s + f.share, 0)
  const pendingCount = settlements.filter(f => !f.settled).length

  function toggleSettled(i, on) {
    setSettlements(prev => prev.map((f, idx) => idx !== i ? f : {
      ...f, settled: on,
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
        <h2 className="jsave-modal-title">{t('txSplitEdit')}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.5)', fontSize: 20 }}>✕</button>
        </h2>
        <div className="jsave-split-summary">
          <div className="jsave-split-summary-row"><span className="jsave-section-sub">{t('txBillAmount')}</span><span style={{ fontWeight: 600 }}>{fmt(initial.amount, cur)}</span></div>
          <div className="jsave-split-summary-row"><span className="jsave-section-sub">{t('txMyShare')}</span><span style={{ fontWeight: 600, color: '#f59e0b' }}>{fmt(initial.myShare ?? 0, cur)}</span></div>
          <div className="jsave-split-summary-row"><span className="jsave-section-sub">{t('txSettledSummary')}</span><span style={{ fontWeight: 600, color: '#10b981' }}>{fmt(totalSettled, cur)} / {fmt(totalOwed, cur)}</span></div>
          {pendingCount === 0 && <div className="jsave-split-summary-row" style={{ marginTop: 2 }}><span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>{t('txSplitAllSettled')}</span></div>}
        </div>
        <div className="jsave-split-friends">
          {settlements.map((f, i) => (
            <div key={f.id || i} className="jsave-split-friend-row">
              <div className="jsave-split-friend-left">
                <span className="jsave-split-friend-name">{f.name || `Person ${i + 2}`}</span>
                <span className="jsave-split-friend-share">{fmt(f.share, cur)}</span>
              </div>
              <div className="jsave-split-friend-right">
                {f.settled && accounts.length > 0 && (
                  <select className="jsave-input jsave-input-sm" style={{ fontSize: 12, padding: '5px 8px' }} value={f.settledAccountId || ''} onChange={e => updateReturnAccount(i, e.target.value)}>
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
  const { t, lang } = useLang()
  const { accounts, addTransaction, updateTransaction, deleteTransaction, settings } = useJSave()

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
  const [note, setNote]           = useState(initial?.recurringBaseNote ?? initial?.note ?? '')
  const [recurring, setRecurring] = useState(initial?.recurring ?? false)
  const [saving, setSaving]       = useState(false)
  const [splitCount, setSplitCount]     = useState(2)
  const [friendNames, setFriendNames]   = useState([''])
  const [showFriendDetails, setDetails] = useState(false)

  const cur      = settings?.currency ?? 'MYR'
  const cats     = type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const totalAmt = Number(amount) || 0
  const myShare  = splitCount > 0 ? Math.round((totalAmt / splitCount) * 100) / 100 : 0

  const amtNum = parseFloat(amount) || 0
  const amtInt = Math.floor(amtNum).toString()
  const amtDec = (amtNum % 1).toFixed(2).slice(1) // ".xx"

  function switchType(tp) {
    setType(tp); setCategory('')
    if (tp === 'split') { setSplitCount(2); setFriendNames(['']) }
  }

  function updateSplitCount(n) {
    const count = Math.max(2, Math.min(20, n))
    setSplitCount(count)
    setFriendNames(prev => {
      const next = [...prev]
      while (next.length < count - 1) next.push('')
      return next.slice(0, count - 1)
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
        share, settled: false, settledAccountId: null,
      }))
      data = { type: 'split', amount: amt, myShare: share, splitWith, accountId, category, date, note }
    } else {
      const finalNote = (type === 'expense' && recurring && note) ? `${monthPrefix(lang)} - ${note}` : note
      data = {
        type, amount: amt, category, accountId, date, note: finalNote,
        ...(type === 'expense' && recurring && { recurring: true, recurringBaseNote: note }),
      }
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

  const typeColor = TYPE_COLORS[type]

  const metaRows = type === 'transfer' ? (
    <>
      <MetaRow icon="🏦" label={t('txFrom')} first>
        <select className="jsave-input" style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 13, fontWeight: 500 }} value={fromAccountId} onChange={e => setFrom(e.target.value)} required>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </MetaRow>
      <MetaRow icon="➡️" label={t('txTo')}>
        <select className="jsave-input" style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 13, fontWeight: 500 }} value={toAccountId} onChange={e => setTo(e.target.value)} required>
          {accounts.filter(a => a.id !== fromAccountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </MetaRow>
    </>
  ) : (
    <>
      {accounts.length > 0 && (
        <MetaRow icon="🏦" label={t('txAccount')} first>
          <select className="jsave-input" style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 13, fontWeight: 500 }} value={accountId} onChange={e => setAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </MetaRow>
      )}
    </>
  )

  return (
    <div className="jsave-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card" style={{ borderRadius: 24, padding: '0 0 16px' }}>
        {/* ── Type segmented control ── */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.06)', gap: 2 }}>
            {TYPES.map(tp => {
              const isActive = type === tp
              const col = TYPE_COLORS[tp]
              return (
                <button key={tp} type="button" onClick={() => switchType(tp)} style={{
                  flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 999, cursor: 'pointer', border: 0,
                  background: isActive ? `linear-gradient(135deg, ${col.bg}, ${col.border})` : 'transparent',
                  color: isActive ? col.text : 'rgba(241,245,249,0.5)',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.18s',
                }}>
                  {t(`tx${tp.charAt(0).toUpperCase() + tp.slice(1)}`)}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Amount hero input ── */}
          <div style={{
            margin: '14px 16px 0',
            padding: '20px 16px',
            borderRadius: 22,
            background: 'radial-gradient(120% 80% at 100% 0%, rgba(16,185,129,0.2), transparent 60%), rgba(255,255,255,0.025)',
            border: `1px solid ${type === 'income' ? 'rgba(16,185,129,0.32)' : type === 'expense' ? 'rgba(244,63,94,0.22)' : type === 'split' ? 'rgba(245,158,11,0.22)' : 'rgba(129,140,248,0.22)'}`,
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <FieldLabel>{type === 'split' ? t('txBillAmount') : t('txAmount')} ({cur})</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'rgba(241,245,249,0.5)' }}>
                {type === 'income' ? '+' : type === 'expense' || type === 'split' ? '−' : '⇄'} RM
              </span>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)} required
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-display)', fontSize: 44, letterSpacing: -2, color: '#f1f5f9',
                  width: '100%', textAlign: 'center', appearance: 'none', WebkitAppearance: 'none',
                  color: type === 'income' ? '#10b981' : type === 'expense' ? '#f87171' : '#f1f5f9',
                }}
              />
            </div>
            {type === 'split' && totalAmt > 0 && (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(241,245,249,0.6)' }}>
                {t('txMyShare')}: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{fmt(myShare, cur)}</span>
              </div>
            )}
            <i className="js-tick" style={{ position: 'absolute', top: 10, right: 10, width: 12, height: 12, color: '#10b981', opacity: 0.4 }}></i>
            <i className="js-tick" style={{ position: 'absolute', bottom: 10, left: 10, width: 12, height: 12, color: '#10b981', opacity: 0.4 }}></i>
          </div>

          {/* ── Category grid ── */}
          {type !== 'transfer' && (
            <div style={{ margin: '14px 16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <FieldLabel>{t('txCategory')}</FieldLabel>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(type === 'split' ? EXPENSE_CATS : cats).map(c => {
                  const isSelected = category === c
                  return (
                    <button
                      key={c} type="button" onClick={() => setCategory(c)}
                      style={{
                        padding: '10px 8px', borderRadius: 14, cursor: 'pointer',
                        background: isSelected ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.025)',
                        border: isSelected ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(241,245,249,0.06)',
                        display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{CAT_ICONS[c] || '💳'}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#10b981' : '#f1f5f9', textAlign: 'left', lineHeight: 1.2 }}>{t(c)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Split count ── */}
          {type === 'split' && (
            <div style={{ margin: '12px 16px 0' }}>
              <FieldLabel>{t('txSplitCount')}</FieldLabel>
              <div className="jsave-split-stepper-row">
                <div className="jsave-split-stepper">
                  <button type="button" className="jsave-split-step-btn" onClick={() => updateSplitCount(splitCount - 1)} disabled={splitCount <= 2}>−</button>
                  <span className="jsave-split-step-val">{splitCount}</span>
                  <button type="button" className="jsave-split-step-btn" onClick={() => updateSplitCount(splitCount + 1)} disabled={splitCount >= 20}>+</button>
                </div>
              </div>
              <div className="jsave-split-friends-header" style={{ marginTop: 8 }}>
                <label className="jsave-label" style={{ margin: 0 }}>{t('txFriends')}</label>
                <button type="button" className="jsave-btn-link" onClick={() => setDetails(v => !v)}>
                  {showFriendDetails ? t('txFriendSimplify') : t('txFriendDetails')}
                </button>
              </div>
              {showFriendDetails ? (
                <div className="jsave-form" style={{ marginTop: 8 }}>
                  {friendNames.map((name, i) => (
                    <input key={i} className="jsave-input" type="text" placeholder={`${t('txFriendPh')} ${i + 2}`} value={name} onChange={e => updateFriendName(i, e.target.value)} />
                  ))}
                </div>
              ) : (
                <div className="jsave-split-names-preview" style={{ marginTop: 8 }}>
                  {friendNames.map((name, i) => (
                    <span key={i} className="jsave-split-name-pill">{name.trim() || `#${i + 2}`}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Meta rows ── */}
          <div style={{ margin: '14px 16px 0', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.05)', overflow: 'hidden' }}>
            {metaRows}
            <MetaRow icon="🕘" label={t('txDate')}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: '#f1f5f9', width: '100%' }} />
            </MetaRow>
            <MetaRow icon="✎" label={t('txNote')}>
              <input type="text" placeholder={t('txNotePh')} value={note} onChange={e => setNote(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#f1f5f9', width: '100%' }} />
            </MetaRow>
          </div>

          {/* ── Recurring toggle ── */}
          {type === 'expense' && (
            <div style={{ margin: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9' }}>{t('txRecurring')}</div>
                <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.5)', marginTop: 2 }}>{t('txRecurringDesc')}</div>
                {recurring && note && (
                  <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>{t('txRecurringPreview')} {monthPrefix(lang)} - {note}</div>
                )}
              </div>
              <label className="jsave-toggle">
                <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
                <span className="jsave-toggle-track" />
              </label>
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ margin: '14px 16px 0', display: 'flex', gap: 8 }}>
            {initial?.id && (
              <button type="button" className="jsave-btn-danger" onClick={handleDelete}>{t('txDelete')}</button>
            )}
            <button type="button" className="jsave-btn-ghost" onClick={onClose} style={{ flex: 1 }}>{t('txCancel')}</button>
            <button type="submit" className="jsave-btn-primary" disabled={saving} style={{
              flex: 2, justifyContent: 'center', borderRadius: 14, padding: '13px 0',
            }}>
              {saving ? t('loading') : t('txSave')} {!saving && <span style={{ fontSize: 14 }}>→</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
