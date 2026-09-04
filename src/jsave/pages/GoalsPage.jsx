// GoalsPage.jsx — Savings Goals + Things (Cost Per Day) combined
import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import { calendarDayDifference, toLocalDateString } from '../utils/date'
import { ProgressRing } from '../components/JSaveCharts'

/* ──────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────── */
const DEFAULT_EMOJIS = ['🎯','✈️','📱','🏠','🛡️','🎓','💍','🚗','🏖️','💎','🌏','☕','🎸','🎨','🐢']

function fmtAmt(n) {
  return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function fmtCPD(n, cur) {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n)
}

function daysSince(dateStr) {
  return Math.max(1, calendarDayDifference(new Date(), dateStr))
}
function daysTotal(purchaseDate, endD) {
  if (!endD) return daysSince(purchaseDate)
  return Math.max(1, calendarDayDifference(endD, purchaseDate))
}
function endDate(item) { return item.retiredDate ?? item.saleDate ?? item.disposeDate ?? null }
function itemStatus(item) {
  if (item.status) return item.status
  if (item.disposeDate) return 'retired'
  return 'active'
}
const todayStr = () => toLocalDateString()

/* ──────────────────────────────────────────────────────────────────────
   Quick Deposit Modal — click a goal to deposit + "More settings" link
   ────────────────────────────────────────────────────────────────────── */
function QuickDepositModal({ goal, onDeposit, onMoreSettings, onClose, t, lang }) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const pct = Math.min(1, (goal.currentAmount || 0) / (goal.targetAmount || 1))

  async function handleDeposit(e) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    await onDeposit(goal.id, (goal.currentAmount || 0) + amt)
    onClose()
  }

  return (
    <div className="jsave-modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ borderRadius: 24, padding: '0 0 16px', maxWidth: 380 }}>
        {/* Goal header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(245,213,112,0.18)', border: '1px solid rgba(245,213,112,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              {goal.emoji}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 2 }}>
                {Math.round(pct * 100)}% {lang === 'zh' ? '完成' : 'complete'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: -0.4, color: '#f1f5f9' }}>{goal.name}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label={t('close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.4)', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ margin: '16px 20px 0', position: 'relative', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, background: 'linear-gradient(90deg, #f5d570, #10b981)', borderRadius: 999, boxShadow: '0 0 12px rgba(16,185,129,0.5)' }}></div>
        </div>
        <div style={{ margin: '8px 20px 0', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(241,245,249,0.5)' }}>
          <span style={{ color: '#10b981' }}>RM {fmtAmt(goal.currentAmount || 0)}</span>
          <span>/ RM {fmtAmt(goal.targetAmount || 0)}</span>
        </div>

        {/* Amount input */}
        <form onSubmit={handleDeposit}>
          <div style={{ margin: '20px 20px 0', padding: '18px 16px', borderRadius: 18, background: 'radial-gradient(120% 80% at 50% 0%, rgba(16,185,129,0.18), transparent 60%), rgba(255,255,255,0.025)', border: '1px solid rgba(16,185,129,0.24)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
              {lang === 'zh' ? '存入金额 (RM)' : 'Add amount (RM)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'rgba(241,245,249,0.5)' }}>+RM</span>
              <input
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                autoFocus
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: -2,
                  color: '#10b981', width: '160px', textAlign: 'center',
                  WebkitAppearance: 'none', appearance: 'none',
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ margin: '14px 20px 0', display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onMoreSettings}
              style={{
                padding: '11px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(241,245,249,0.12)',
                color: 'rgba(241,245,249,0.6)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(241,245,249,0.6)' }}
            >
              ⋯ {lang === 'zh' ? '更多设置' : 'More'}
            </button>
            <button
              type="submit" disabled={saving || !amount || parseFloat(amount) <= 0}
              className="jsave-btn-primary"
              style={{ flex: 1, justifyContent: 'center', borderRadius: 12, padding: '11px 0' }}
            >
              {saving ? (lang === 'zh' ? '保存…' : 'Saving…') : (lang === 'zh' ? '存入目标' : 'Add to goal')} {!saving && '→'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   Goal Settings Modal — full edit (name, emoji, target, deadline, etc.)
   ────────────────────────────────────────────────────────────────────── */
function GoalSettingsModal({ initial, onSave, onDelete, onClose, t }) {
  const [name, setName]       = useState(initial?.name || '')
  const [emoji, setEmoji]     = useState(initial?.emoji || '🎯')
  const [target, setTarget]   = useState(initial?.targetAmount?.toString() || '')
  const [current, setCurrent] = useState(initial?.currentAmount?.toString() || '0')
  const [deadline, setDeadline] = useState(initial?.deadline || '')
  const [showEmoji, setShowEmoji] = useState(false)
  const [saving, setSaving]   = useState(false)
  const isEdit = !!initial?.id

  async function handleSave() {
    if (!name.trim() || !target) return
    setSaving(true)
    await onSave({ name: name.trim(), emoji, targetAmount: parseFloat(target) || 0, currentAmount: parseFloat(current) || 0, deadline: deadline || null })
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm(t('confirmDelete'))) return
    await onDelete(initial.id)
    onClose()
  }

  return (
    <div className="jsave-modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ borderRadius: 24, maxWidth: 400 }}>
        <h2 className="jsave-modal-title">
          {isEdit ? t('editGoal') : t('addGoal')}
          <button onClick={onClose} aria-label={t('close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.5)', fontSize: 20 }}>✕</button>
        </h2>

        {/* Emoji picker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>{t('goalEmoji')}</div>
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ width: 52, height: 52, borderRadius: 15, fontSize: 26, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.28)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {emoji}
          </button>
          {showEmoji && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, padding: 10, borderRadius: 12, background: 'rgba(8,18,32,0.95)', border: '1px solid rgba(241,245,249,0.08)' }}>
              {DEFAULT_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => { setEmoji(e); setShowEmoji(false) }}
                  style={{ width: 36, height: 36, borderRadius: 10, fontSize: 20, background: emoji === e ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)', border: emoji === e ? '1px solid rgba(16,185,129,0.5)' : '1px solid transparent', cursor: 'pointer' }}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="jsave-form">
          <div><label className="jsave-label">{t('goalName')}</label>
            <input className="jsave-input" value={name} onChange={e => setName(e.target.value)} placeholder={t('goalNamePh')} /></div>
          <div><label className="jsave-label">{t('goalTarget')} (RM)</label>
            <input className="jsave-input" type="number" min="0" step="0.01" value={target} onChange={e => setTarget(e.target.value)} placeholder="10000" /></div>
          <div><label className="jsave-label">{t('goalCurrent')} (RM)</label>
            <input className="jsave-input" type="number" min="0" step="0.01" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0" /></div>
          <div><label className="jsave-label">{t('goalDeadline')}</label>
            <input className="jsave-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
        </div>

        <div className="jsave-form-actions" style={{ marginTop: 20 }}>
          {isEdit && <button type="button" onClick={handleDelete} className="jsave-btn-danger">{t('goalDelete')}</button>}
          <button type="button" onClick={onClose} className="jsave-btn-ghost">{t('cancel')}</button>
          <button type="button" onClick={handleSave} className="jsave-btn-primary" disabled={saving || !name.trim() || !target}>
            {saving ? t('loading') : t('goalSave')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   Things view — Cost Per Day (uses existing items from JSaveContext)
   ────────────────────────────────────────────────────────────────────── */
function ItemForm({ initial, cur, t, onSave, onDelete, onClose }) {
  const initStatus = itemStatus(initial ?? {})
  const [name,         setName]        = useState(initial?.name ?? '')
  const [cost,         setCost]        = useState(initial?.cost?.toString() ?? '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? todayStr())
  const [note,         setNote]        = useState(initial?.note ?? '')
  const [retired,      setRetired]     = useState(initStatus === 'retired')
  const [retiredDate,  setRetiredDate] = useState(initial?.retiredDate ?? initial?.disposeDate ?? '')
  const [sold,         setSold]        = useState(initStatus === 'sold')
  const [salePrice,    setSalePrice]   = useState(initial?.salePrice?.toString() ?? '')
  const [saleDate,     setSaleDate]    = useState(initial?.saleDate ?? '')
  const [saving,       setSaving]      = useState(false)

  function toggleRetired(on) { setRetired(on); if (on) setSold(false) }
  function toggleSold(on)    { setSold(on);    if (on) setRetired(false) }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    const status = retired ? 'retired' : sold ? 'sold' : 'active'
    await onSave({ name, cost: Number(cost), purchaseDate, status, retiredDate: retired ? (retiredDate || todayStr()) : null, salePrice: sold ? Number(salePrice) : null, saleDate: sold ? (saleDate || todayStr()) : null, disposeDate: retired ? (retiredDate || todayStr()) : null, note })
  }

  return (
    <div className="jsave-modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ borderRadius: 24 }}>
        <h2 className="jsave-modal-title">{initial?.id ? t('itemEdit') : t('addItem')}
          <button onClick={onClose} aria-label={t('close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.5)', fontSize: 20 }}>✕</button>
        </h2>
        <form onSubmit={handleSubmit} className="jsave-form">
          <div><label className="jsave-label">{t('itemName')}</label>
            <input className="jsave-input" placeholder={t('itemNamePh')} value={name} onChange={e => setName(e.target.value)} required /></div>
          <div><label className="jsave-label">{t('itemCost')} ({cur})</label>
            <input className="jsave-input" type="number" min="0" step="0.01" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} required /></div>
          <div><label className="jsave-label">{t('itemPurchaseDate')}</label>
            <input className="jsave-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required /></div>
          <div><label className="jsave-label">{t('itemNote')}</label>
            <input className="jsave-input" value={note} onChange={e => setNote(e.target.value)} /></div>
          <div className="jsave-setting-row" style={{ marginTop: 8 }}>
            <span className="jsave-label">{t('itemRetiredToggle')}</span>
            <label className="jsave-toggle"><input type="checkbox" checked={retired} onChange={e => toggleRetired(e.target.checked)} /><span className="jsave-toggle-track" /></label>
          </div>
          {retired && <div><label className="jsave-label">{t('itemRetiredDate')}</label><input className="jsave-input" type="date" value={retiredDate} onChange={e => setRetiredDate(e.target.value)} /></div>}
          <div className="jsave-setting-row" style={{ marginTop: 4 }}>
            <span className="jsave-label">{t('itemSoldToggle')}</span>
            <label className="jsave-toggle"><input type="checkbox" checked={sold} onChange={e => toggleSold(e.target.checked)} /><span className="jsave-toggle-track" /></label>
          </div>
          {sold && (<>
            <div><label className="jsave-label">{t('itemSalePrice')} ({cur})</label><input className="jsave-input" type="number" min="0" step="0.01" placeholder="0.00" value={salePrice} onChange={e => setSalePrice(e.target.value)} /></div>
            <div><label className="jsave-label">{t('itemSaleDate')}</label><input className="jsave-input" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} /></div>
          </>)}
          <div className="jsave-form-actions">
            {initial?.id && <button type="button" className="jsave-btn-danger" onClick={onDelete}>{t('itemDelete')}</button>}
            <button type="button" className="jsave-btn-ghost" onClick={onClose}>{t('itemCancel')}</button>
            <button type="submit" className="jsave-btn-primary" disabled={saving}>{t('itemSave')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ThingsView({ t, lang }) {
  const { items, addItem, updateItem, deleteItem, settings } = useJSave()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const cur = settings?.currency ?? 'MYR'

  const sortedItems = useMemo(() =>
    [...items].sort((a, b) => {
      const cpdA = a.cost / daysTotal(a.purchaseDate, endDate(a))
      const cpdB = b.cost / daysTotal(b.purchaseDate, endDate(b))
      return cpdA - cpdB // best value first
    }), [items])

  const activeItems  = items.filter(i => itemStatus(i) === 'active')
  const totalAssets  = activeItems.reduce((s, i) => s + i.cost, 0)
  const totalCPD     = activeItems.reduce((s, i) => s + i.cost / daysTotal(i.purchaseDate, endDate(i)), 0)

  const maxCPD = Math.max(...sortedItems.map(i => i.cost / daysTotal(i.purchaseDate, endDate(i))), 0.01)
  const best   = sortedItems[0]
  const worst  = sortedItems[sortedItems.length - 1]

  return (
    <>
      {/* Hero stats */}
      {items.length > 0 && (
        <>
          <div style={{ padding: '22px', borderRadius: 26, background: 'radial-gradient(140% 80% at 0% 0%, rgba(16,185,129,0.28), transparent 60%), rgba(8,18,32,0.6)', border: '1px solid rgba(16,185,129,0.26)', position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.5)', textTransform: 'uppercase' }}>{t('itemsTotalAssets')}</div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'rgba(241,245,249,0.5)' }}>RM</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, letterSpacing: -1.4, color: '#f1f5f9', lineHeight: 1 }}>{fmtAmt(totalAssets)}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.5, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase' }}>{t('itemsTotalCPD')}</div>
                <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: -0.8, color: '#10b981' }}>
                  RM {totalCPD.toFixed(2)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#10b981' }}>▼ {lang === 'zh' ? '持续下降' : 'dropping'}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.6, color: 'rgba(241,245,249,0.5)' }}>
              {activeItems.length} {lang === 'zh' ? '件 · 越用越便宜' : 'items · cheaper every day'}
            </div>
            <i className="js-tick" style={{ position: 'absolute', top: 10, right: 10, width: 12, height: 12, color: '#10b981', opacity: 0.5 }}></i>
            <i className="js-tick" style={{ position: 'absolute', bottom: 10, left: 10, width: 12, height: 12, color: '#10b981', opacity: 0.5 }}></i>
          </div>

          {/* Best / Worst callouts */}
          {sortedItems.length >= 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 14, borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.24)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>🏆</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#10b981', letterSpacing: 1.5, textTransform: 'uppercase' }}>{t('itemGreatValue')}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{best.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#10b981' }}>
                  RM {(best.cost / daysTotal(best.purchaseDate, endDate(best))).toFixed(2)}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(241,245,249,0.4)' }}> / {lang === 'zh' ? '天' : 'day'}</span>
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 16, background: 'rgba(245,213,112,0.07)', border: '1px solid rgba(245,213,112,0.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>👀</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f5d570', letterSpacing: 1.5, textTransform: 'uppercase' }}>{lang === 'zh' ? '该用了' : 'Use more'}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{worst.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#f5d570' }}>
                  RM {(worst.cost / daysTotal(worst.purchaseDate, endDate(worst))).toFixed(2)}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(241,245,249,0.4)' }}> / {lang === 'zh' ? '天' : 'day'}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Item list */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
        {lang === 'zh' ? '全部用品 · 按日均排序' : 'All things · sorted by cost/day'}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧮</div>
          <p className="jsave-empty-msg">{t('noItems')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {sortedItems.map((item, i) => {
            const end  = endDate(item)
            const days = daysTotal(item.purchaseDate, end)
            const cpd  = item.cost / days
            const fill = Math.min(cpd / maxCPD, 1)
            const isBest = i === 0
            const status = itemStatus(item)

            return (
              <div key={item.id} onClick={() => { setEditing(item); setShowForm(true) }}
                style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  📦
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#f1f5f9' }}>{item.name}</span>
                    {status !== 'active' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(241,245,249,0.4)', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(241,245,249,0.06)', padding: '1px 6px', borderRadius: 4 }}>{t(status === 'sold' ? 'itemSold' : 'itemRetired')}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(241,245,249,0.45)' }}>
                    RM {fmtAmt(item.cost)} · {days} {lang === 'zh' ? '天' : 'd'}
                  </div>
                  {/* amortization bar */}
                  <div style={{ marginTop: 6, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${fill * 100}%`, borderRadius: 999, background: isBest ? 'linear-gradient(90deg, #10b981, #34d399)' : 'rgba(16,185,129,0.45)', transition: 'width 0.8s' }}></div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: -0.5, color: isBest ? '#10b981' : '#f1f5f9' }}>
                    {cpd.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 0.5, color: 'rgba(241,245,249,0.4)' }}>
                    RM / {lang === 'zh' ? '天' : 'day'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add item */}
      <button onClick={() => { setEditing(null); setShowForm(true) }} style={{ width: '100%', padding: '13px 0', borderRadius: 16, border: '1px dashed rgba(16,185,129,0.4)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#10b981', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        + {t('addItem')}
      </button>

      {showForm && (
        <ItemForm
          initial={editing} cur={cur} t={t}
          onSave={async (data) => {
            if (editing?.id) await updateItem(editing.id, data)
            else await addItem(data)
            setShowForm(false)
          }}
          onDelete={async () => {
            if (editing?.id && window.confirm(t('confirmDelete'))) {
              await deleteItem(editing.id); setShowForm(false)
            }
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   Goal Hero Card
   ────────────────────────────────────────────────────────────────────── */
function HeroGoalCard({ goal, onClick, t, lang }) {
  const pct = Math.min(1, (goal.currentAmount || 0) / (goal.targetAmount || 1))
  const daysLeft = goal.deadline ? Math.max(0, calendarDayDifference(goal.deadline, new Date())) : null
  const monthsLeft = daysLeft != null ? Math.max(1, daysLeft / 30) : null
  const remaining = (goal.targetAmount || 0) - (goal.currentAmount || 0)
  const monthlyNeeded = monthsLeft ? (remaining / monthsLeft).toFixed(0) : null

  return (
    <div onClick={onClick} style={{ padding: '22px', borderRadius: 26, background: 'radial-gradient(140% 80% at 0% 0%, rgba(245,213,112,0.22), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(16,185,129,0.16), transparent 65%), rgba(8,18,32,0.6)', border: '1px solid rgba(245,213,112,0.28)', position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: 12, transition: 'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: 'rgba(245,213,112,0.18)', border: '1px solid rgba(245,213,112,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{goal.emoji}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.5)', textTransform: 'uppercase' }}>{t('activeGoals')}</div>
          <div style={{ marginTop: 2, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: -0.6, color: '#f1f5f9' }}>{goal.name}</div>
        </div>
      </div>
      <div style={{ marginTop: 18, position: 'relative', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, background: 'linear-gradient(90deg, #f5d570, #10b981)', borderRadius: 999, boxShadow: '0 0 16px rgba(16,185,129,0.6)', transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }}></div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: -0.8, color: '#f1f5f9' }}>RM {fmtAmt(goal.currentAmount || 0)}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(241,245,249,0.5)' }}> / {fmtAmt(goal.targetAmount || 0)}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#10b981', fontWeight: 600 }}>{Math.round(pct * 100)}%</div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(241,245,249,0.5)' }}>
        {daysLeft != null && <span>⏱ {daysLeft} {t('goalDaysLeft')}</span>}
        {monthlyNeeded && <span>📈 RM {monthlyNeeded} {t('goalMonthly')}</span>}
      </div>
      <i className="js-tick" style={{ position: 'absolute', top: 10, right: 10, width: 12, height: 12, color: '#f5d570', opacity: 0.5 }}></i>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────────────── */
export default function GoalsPage() {
  const { t, lang } = useLang()
  const { goals, addGoal, updateGoal, deleteGoal } = useJSave()

  const [tab, setTab]               = useState('goals')         // 'goals' | 'things'
  const [quickGoal, setQuickGoal]   = useState(null)            // goal for quick deposit
  const [settingsGoal, setSettingsGoal] = useState(null)        // goal for full settings
  const [showAddGoal, setShowAddGoal]   = useState(false)

  const sortedGoals = useMemo(() =>
    [...(goals || [])].sort((a, b) => {
      const pctA = (a.currentAmount || 0) / (a.targetAmount || 1)
      const pctB = (b.currentAmount || 0) / (b.targetAmount || 1)
      return pctB - pctA
    }), [goals])

  const heroGoal  = sortedGoals[0]
  const otherGoals = sortedGoals.slice(1)

  // Quick deposit: add amount to currentAmount
  async function handleDeposit(goalId, newAmount) {
    await updateGoal(goalId, { currentAmount: newAmount })
  }

  async function handleSaveGoal(data) {
    if (settingsGoal?.id) await updateGoal(settingsGoal.id, data)
    else await addGoal(data)
  }

  async function handleDeleteGoal(id) {
    await deleteGoal(id)
  }

  const RING_COLORS = ['#10b981', '#22d3ee', '#8b5cf6', '#f59e0b']

  return (
    <div className="jsave-page" style={{ paddingTop: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 19, color: '#04140d', fontWeight: 700 }}>J</div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase' }}>04 / {tab === 'goals' ? 'GOALS' : 'THINGS'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: -0.3, color: '#f1f5f9' }}>
              {tab === 'goals' ? t('goalsTitle') : t('itemsTitle')}
            </div>
          </div>
        </div>
        {tab === 'goals' && (
          <button onClick={() => { setSettingsGoal({}); setShowAddGoal(true) }} style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', border: 'none', cursor: 'pointer', color: '#04140d', fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            +
          </button>
        )}
      </div>

      {/* ── Segmented control: Goals 🎯 / Things 🧮 ── */}
      <div style={{ display: 'flex', padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(241,245,249,0.06)', gap: 2, marginBottom: 18 }}>
        {[['goals', `🎯 ${t('goalsTitle')}`], ['things', `🧮 ${t('itemsTitle')}`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '9px 0', textAlign: 'center', borderRadius: 999, cursor: 'pointer', border: 0,
            background: tab === id ? 'linear-gradient(135deg, rgba(16,185,129,0.42), rgba(5,150,105,0.58))' : 'transparent',
            color: tab === id ? '#04140d' : 'rgba(241,245,249,0.6)',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: tab === id ? 700 : 500,
            transition: 'all 0.2s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Goals tab ── */}
      {tab === 'goals' && (
        <>
          {sortedGoals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: -0.5, color: '#f1f5f9', marginBottom: 8 }}>{t('noGoals')}</div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.5)', marginBottom: 28, lineHeight: 1.6 }}>{t('noGoalsHint')}</p>
              <button onClick={() => { setSettingsGoal({}); setShowAddGoal(true) }} className="jsave-btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
                + {t('addGoal')}
              </button>
            </div>
          ) : (
            <>
              {/* Hero goal — click to quick deposit */}
              {heroGoal && <HeroGoalCard goal={heroGoal} onClick={() => setQuickGoal(heroGoal)} t={t} lang={lang} />}

              {/* Other goals */}
              {otherGoals.length > 0 && (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1.8, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>{t('activeGoals')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {otherGoals.map((goal, i) => {
                      const pct = Math.min(1, (goal.currentAmount || 0) / (goal.targetAmount || 1))
                      return (
                        <div key={goal.id} onClick={() => setQuickGoal(goal)} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.15s, transform 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'none' }}
                        >
                          <ProgressRing value={pct} size={52} thickness={5} color={RING_COLORS[i % RING_COLORS.length]}>
                            {Math.round(pct * 100)}%
                          </ProgressRing>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 15 }}>{goal.emoji}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</span>
                            </div>
                            <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(241,245,249,0.5)' }}>
                              RM {fmtAmt(goal.currentAmount || 0)} / {fmtAmt(goal.targetAmount || 0)}
                              {goal.deadline && ` · ${Math.max(0, calendarDayDifference(goal.deadline, new Date()))}d`}
                            </div>
                          </div>
                          <div style={{ color: 'rgba(241,245,249,0.3)', fontSize: 16 }}>›</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Add more */}
              <button onClick={() => { setSettingsGoal({}); setShowAddGoal(true) }} style={{ width: '100%', padding: '13px 0', borderRadius: 16, border: '1px dashed rgba(16,185,129,0.4)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#10b981', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                + {t('addGoal')}
              </button>
            </>
          )}
        </>
      )}

      {/* ── Things tab ── */}
      {tab === 'things' && <ThingsView t={t} lang={lang} />}

      {/* ── Quick Deposit Modal ── */}
      {quickGoal && (
        <QuickDepositModal
          goal={quickGoal}
          onDeposit={handleDeposit}
          onMoreSettings={() => { setSettingsGoal(quickGoal); setQuickGoal(null) }}
          onClose={() => setQuickGoal(null)}
          t={t}
          lang={lang}
        />
      )}

      {/* ── Goal Settings Modal ── */}
      {(settingsGoal !== null || showAddGoal) && (
        <GoalSettingsModal
          initial={settingsGoal?.id ? settingsGoal : null}
          onSave={handleSaveGoal}
          onDelete={handleDeleteGoal}
          onClose={() => { setSettingsGoal(null); setShowAddGoal(false) }}
          t={t}
        />
      )}
    </div>
  )
}
