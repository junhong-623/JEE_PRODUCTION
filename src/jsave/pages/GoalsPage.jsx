// GoalsPage.jsx — Savings Goals + Things (Cost Per Day) combined
import { useEffect, useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import { useAuth } from '../../contexts/AuthContext'
import { calendarDayDifference, toLocalDateString } from '../utils/date'
import { ProgressRing } from '../components/JSaveCharts'
import PageHeader from '../components/PageHeader'
import GoalThumbnail from '../components/GoalThumbnail'
import ItemThumbnail from '../components/ItemThumbnail'
import { deleteGoalCover, deleteItemCover, MAX_COVER_SOURCE_MB, uploadGoalCover, uploadItemCover, validateCoverSource } from '../services/goalCover'
import { isSingleEmoji, singleEmoji } from '../utils/emoji'
import { buildItemEntries, isItemGroup } from '../utils/itemGroups'

/* ──────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────── */
const DEFAULT_EMOJIS = ['🎯','✈️','📱','🏠','🛡️','🎓','💍','🚗','🏖️','💎','🌏','☕','🎸','🎨','🐢']
const ITEM_EMOJIS = ['📦','💻','📱','🎧','📷','⌚','👟','👜','🚲','🚗','🪑','☕','🎮','🎸','🏕️']

function coverErrorMessage(error, t) {
  if (error?.message === 'cover-too-large') return t('coverTooLargeError').replace('{size}', MAX_COVER_SOURCE_MB)
  if (error?.message === 'cover-invalid') return t('coverInvalidError')
  if (error?.message === 'cover-compression' || error?.message === 'cover-output-too-large') return t('coverCompressionError')
  if (error?.code === 'storage/unauthorized') return t('coverPermissionError')
  return t('coverUploadError')
}

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
            <GoalThumbnail goal={goal} size={46} />
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
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(initial?.coverUrl || null)
  const [removeCover, setRemoveCover] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState(null)
  const isEdit = !!initial?.id

  useEffect(() => () => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
  }, [coverPreview])

  function chooseCover(file) {
    if (!file) return
    try { validateCoverSource(file) } catch (error) { setSaveError(coverErrorMessage(error, t)); return }
    setCoverFile(file)
    setRemoveCover(false)
    setCoverPreview(URL.createObjectURL(file))
    setSaveError(null)
  }

  function clearCover() {
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCover(Boolean(initial?.coverPath))
  }

  async function handleSave() {
    if (!name.trim() || !target) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(
        { name: name.trim(), emoji, targetAmount: parseFloat(target) || 0, currentAmount: parseFloat(current) || 0, deadline: deadline || null },
        { file: coverFile, remove: removeCover },
      )
      onClose()
    } catch (error) {
      setSaveError(coverErrorMessage(error, t))
      setSaving(false)
    }
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

        <div className="jsave-goal-cover-field">
          <div className="jsave-goal-cover-preview">
            {coverPreview ? <img src={coverPreview} alt="" /> : <span>{emoji}</span>}
              <div><strong>{t('goalCover')}</strong><small>{t('goalCoverHint').replace('{size}', MAX_COVER_SOURCE_MB)}</small></div>
          </div>
          <div className="jsave-goal-cover-actions">
            <label className="jsave-btn-ghost">
              {coverPreview ? t('goalCoverReplace') : t('goalCoverChoose')}
              <input type="file" accept="image/*" onChange={event => chooseCover(event.target.files?.[0])} hidden />
            </label>
            {coverPreview && <button type="button" className="jsave-btn-link" onClick={clearCover}>{t('goalCoverRemove')}</button>}
          </div>
        </div>

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
        {saveError && <p className="jsave-error" style={{ marginTop: 10 }}>{saveError}</p>}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   Things view — Cost Per Day (uses existing items from JSaveContext)
   ────────────────────────────────────────────────────────────────────── */
function ItemForm({ initial, cur, t, onSave, onDelete, onClose, groupMode = false, availableItems = [], initialMemberIds = [], onAddComponent }) {
  const initStatus = itemStatus(initial ?? {})
  const initialEmoji = initial?.emoji ?? '📦'
  const [emoji,        setEmoji]       = useState(initialEmoji)
  const [customEmoji,  setCustomEmoji] = useState(ITEM_EMOJIS.includes(initialEmoji) ? '' : initialEmoji)
  const [showEmoji,    setShowEmoji]   = useState(false)
  const [name,         setName]        = useState(initial?.name ?? '')
  const [cost,         setCost]        = useState(initial?.cost?.toString() ?? '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? todayStr())
  const [note,         setNote]        = useState(initial?.note ?? '')
  const [retired,      setRetired]     = useState(initStatus === 'retired')
  const [retiredDate,  setRetiredDate] = useState(initial?.retiredDate ?? initial?.disposeDate ?? '')
  const [sold,         setSold]        = useState(initStatus === 'sold')
  const [salePrice,    setSalePrice]   = useState(initial?.salePrice?.toString() ?? '')
  const [saleDate,     setSaleDate]    = useState(initial?.saleDate ?? '')
  const [coverFile,    setCoverFile]   = useState(null)
  const [coverPreview, setCoverPreview] = useState(initial?.coverUrl ?? null)
  const [removeCover,  setRemoveCover] = useState(false)
  const [saving,       setSaving]      = useState(false)
  const [saveError,    setSaveError]   = useState(null)
  const [memberIds,    setMemberIds]   = useState(initialMemberIds)
  const customEmojiValid = !customEmoji || isSingleEmoji(customEmoji)

  useEffect(() => () => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
  }, [coverPreview])

  function chooseCover(file) {
    if (!file) return
    try { validateCoverSource(file) } catch (error) { setSaveError(coverErrorMessage(error, t)); return }
    setCoverFile(file)
    setRemoveCover(false)
    setCoverPreview(URL.createObjectURL(file))
    setSaveError(null)
  }

  function clearCover() {
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCover(Boolean(initial?.coverPath))
  }

  function toggleRetired(on) { setRetired(on); if (on) setSold(false) }
  function toggleSold(on)    { setSold(on);    if (on) setRetired(false) }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setSaveError(null)
    if (!customEmojiValid) { setSaving(false); return }
    try {
      if (groupMode) {
        await onSave({ kind: 'group', name: name.trim(), emoji, note, status: 'active' }, { file: coverFile, remove: removeCover }, memberIds)
      } else {
        const status = retired ? 'retired' : sold ? 'sold' : 'active'
        await onSave(
          { name: name.trim(), emoji, cost: Number(cost), purchaseDate, status, retiredDate: retired ? (retiredDate || todayStr()) : null, salePrice: sold ? Number(salePrice) : null, saleDate: sold ? (saleDate || todayStr()) : null, disposeDate: retired ? (retiredDate || todayStr()) : null, note },
          { file: coverFile, remove: removeCover },
        )
      }
    } catch (error) {
      setSaveError(coverErrorMessage(error, t))
      setSaving(false)
    }
  }

  return (
    <div className="jsave-modal-overlay centered" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ borderRadius: 24 }}>
        <h2 className="jsave-modal-title">{groupMode ? (initial?.id ? t('itemGroupEdit') : t('itemGroupAdd')) : (initial?.id ? t('itemEdit') : t('addItem'))}
          <button onClick={onClose} aria-label={t('close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.5)', fontSize: 20 }}>✕</button>
        </h2>
        <form onSubmit={handleSubmit} className="jsave-form">
          <div className="jsave-goal-cover-field">
            <div className="jsave-goal-cover-preview">
              {coverPreview ? <img src={coverPreview} alt="" /> : <span>{emoji}</span>}
              <div><strong>{t(groupMode ? 'itemGroupCover' : 'itemCover')}</strong><small>{t('itemCoverHint').replace('{size}', MAX_COVER_SOURCE_MB)}</small></div>
            </div>
            <div className="jsave-goal-cover-actions">
              <label className="jsave-btn-ghost">
                {coverPreview ? t('itemCoverReplace') : t('itemCoverChoose')}
                <input type="file" accept="image/*" onChange={event => chooseCover(event.target.files?.[0])} hidden />
              </label>
              {coverPreview && <button type="button" className="jsave-btn-link" onClick={clearCover}>{t('itemCoverRemove')}</button>}
            </div>
          </div>
          <div>
            <div className="jsave-label" style={{ marginBottom: 8 }}>{t(groupMode ? 'itemGroupEmoji' : 'itemEmoji')}</div>
            <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="jsave-emoji-trigger">{emoji}</button>
            {showEmoji && (
              <div className="jsave-emoji-picker">
                {ITEM_EMOJIS.map(value => (
                  <button key={value} type="button" className={emoji === value ? 'active' : ''} onClick={() => { setEmoji(value); setCustomEmoji(''); setShowEmoji(false) }}>{value}</button>
                ))}
                <label className="jsave-custom-emoji">
                  <span>{t('itemEmojiCustom')}</span>
                  <input
                    type="text"
                    value={customEmoji}
                    maxLength={24}
                    placeholder={t('itemEmojiCustomPh')}
                    aria-invalid={!customEmojiValid}
                    onChange={event => {
                      const value = event.target.value
                      setCustomEmoji(value)
                      const validEmoji = singleEmoji(value)
                      if (validEmoji) setEmoji(validEmoji)
                    }}
                  />
                </label>
              </div>
            )}
            {!customEmojiValid && <p className="jsave-error" style={{ marginTop: 7 }}>{t('itemEmojiInvalid')}</p>}
          </div>
          <div><label className="jsave-label">{t(groupMode ? 'itemGroupName' : 'itemName')}</label>
            <input className="jsave-input" placeholder={t(groupMode ? 'itemGroupNamePh' : 'itemNamePh')} value={name} onChange={e => setName(e.target.value)} required /></div>
          {!groupMode && <>
            <div><label className="jsave-label">{t('itemCost')} ({cur})</label>
              <input className="jsave-input" type="number" min="0" step="0.01" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} required /></div>
            <div><label className="jsave-label">{t('itemPurchaseDate')}</label>
              <input className="jsave-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required /></div>
          </>}
          <div><label className="jsave-label">{t('itemNote')}</label>
            <input className="jsave-input" value={note} onChange={e => setNote(e.target.value)} /></div>
          {groupMode && (
            <div className="jsave-group-members-field">
              <div className="jsave-label">{t('itemGroupMembers')}</div>
              <p className="jsave-section-sub">{t('itemGroupMembersHint')}</p>
              {availableItems.length > 0 ? (
                <div className="jsave-group-member-list">
                  {availableItems.map(item => (
                    <label key={item.id} className="jsave-group-member-row">
                      <input type="checkbox" checked={memberIds.includes(item.id)} onChange={event => setMemberIds(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id))} />
                      <ItemThumbnail item={item} size={32} />
                      <span><strong>{item.name}</strong><small>{cur} {fmtAmt(item.cost || 0)} · {item.purchaseDate}</small></span>
                    </label>
                  ))}
                </div>
              ) : <p className="jsave-empty-msg" style={{ padding: '10px 0' }}>{t('itemGroupNoAvailable')}</p>}
              {initial?.id && <button type="button" className="jsave-btn-ghost jsave-btn-full" onClick={onAddComponent}>+ {t('itemGroupAddComponent')}</button>}
            </div>
          )}
          {!groupMode && <><div className="jsave-setting-row" style={{ marginTop: 8 }}>
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
          </>)}</>}
          <div className="jsave-form-actions">
            {initial?.id && <button type="button" className="jsave-btn-danger" onClick={onDelete}>{groupMode ? t('itemGroupDelete') : t('itemDelete')}</button>}
            <button type="button" className="jsave-btn-ghost" onClick={onClose}>{t('itemCancel')}</button>
            <button type="submit" className="jsave-btn-primary" disabled={saving || !customEmojiValid || !name.trim()}>{t('itemSave')}</button>
          </div>
          {saveError && <p className="jsave-error">{saveError}</p>}
        </form>
      </div>
    </div>
  )
}

function ThingsView({ t, lang, showAdd, onShowAddChange }) {
  const { items, addItem, updateItem, deleteItem, settings } = useJSave()
  const { user } = useAuth()
  const [editing, setEditing] = useState(null)
  const [pendingParentId, setPendingParentId] = useState(null)
  const cur = settings?.currency ?? 'MYR'

  const regularItems = useMemo(() => items.filter(item => !isItemGroup(item)), [items])
  const itemEntries = useMemo(() => buildItemEntries(items), [items])
  const sortedItems = useMemo(() => [...itemEntries].sort((a, b) => a.cpd - b.cpd), [itemEntries])

  const activeItems  = regularItems.filter(i => itemStatus(i) === 'active')
  const totalAssets  = activeItems.reduce((s, i) => s + (Number(i.cost) || 0), 0)
  const totalCPD     = activeItems.reduce((s, i) => s + i.cost / daysTotal(i.purchaseDate, endDate(i)), 0)

  const maxCPD = Math.max(...sortedItems.map(i => i.cpd), 0.01)
  const best   = sortedItems[0]
  const worst  = sortedItems[sortedItems.length - 1]
  const groupMode = isItemGroup(editing)
  const availableGroupItems = regularItems.filter(item => !item.parentItemId || item.parentItemId === editing?.id)

  function closeForm() {
    setEditing(null)
    setPendingParentId(null)
    onShowAddChange(false)
  }

  async function syncGroupMembers(groupId, selectedIds) {
    const selected = new Set(selectedIds)
    const changes = regularItems.filter(item =>
      (selected.has(item.id) && item.parentItemId !== groupId)
      || (!selected.has(item.id) && item.parentItemId === groupId)
    )
    await Promise.all(changes.map(item => updateItem(item.id, {
      parentItemId: selected.has(item.id) ? groupId : null,
    })))
  }

  async function saveItem(data, coverChange, memberIds = []) {
    if (editing?.id) {
      let coverUpdate = {}
      if (coverChange.file) coverUpdate = await uploadItemCover(user.uid, editing.id, coverChange.file)
      else if (coverChange.remove) coverUpdate = { coverPath: null, coverUrl: null }
      await updateItem(editing.id, { ...data, ...coverUpdate })
      if (data.kind === 'group') await syncGroupMembers(editing.id, memberIds)
      if (coverChange.remove && editing.coverPath) await deleteItemCover(editing.coverPath)
      closeForm()
      return
    }

    const itemId = crypto.randomUUID()
    const coverUpdate = coverChange.file ? await uploadItemCover(user.uid, itemId, coverChange.file) : {}
    try {
      await addItem({ ...data, ...coverUpdate, id: itemId, ...(data.kind !== 'group' && { parentItemId: pendingParentId || null }) })
      if (data.kind === 'group') await syncGroupMembers(itemId, memberIds)
      closeForm()
    } catch (error) {
      if (coverUpdate.coverPath) await deleteItemCover(coverUpdate.coverPath).catch(() => {})
      throw error
    }
  }

  async function removeItem() {
    if (!editing?.id || !window.confirm(t('confirmDelete'))) return
    const coverPath = editing.coverPath
    if (isItemGroup(editing)) {
      await Promise.all(regularItems.filter(item => item.parentItemId === editing.id).map(item => updateItem(item.id, { parentItemId: null })))
    }
    await deleteItem(editing.id)
    if (coverPath) await deleteItemCover(coverPath).catch(() => {})
    closeForm()
  }

  function addComponentToGroup() {
    const groupId = editing?.id
    setEditing(null)
    setPendingParentId(groupId)
    onShowAddChange(true)
  }

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
                  RM {best.cpd.toFixed(2)}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(241,245,249,0.4)' }}> / {lang === 'zh' ? '天' : 'day'}</span>
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 16, background: 'rgba(245,213,112,0.07)', border: '1px solid rgba(245,213,112,0.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>👀</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f5d570', letterSpacing: 1.5, textTransform: 'uppercase' }}>{lang === 'zh' ? '该用了' : 'Use more'}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{worst.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#f5d570' }}>
                  RM {worst.cpd.toFixed(2)}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(241,245,249,0.4)' }}> / {lang === 'zh' ? '天' : 'day'}</span>
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

      {itemEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="jsave-empty-symbol items" aria-hidden="true"><i /><i /><i /></div>
          <p className="jsave-empty-msg">{t('noItems')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {sortedItems.map((item, i) => {
            const days = item.isGroup ? null : daysTotal(item.purchaseDate, endDate(item))
            const cpd  = item.cpd
            const fill = Math.min(cpd / maxCPD, 1)
            const isBest = i === 0
            const status = item.isGroup ? 'active' : itemStatus(item)

            return (
              <div key={item.id} onClick={() => { setEditing(item); onShowAddChange(false) }}
                style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(241,245,249,0.06)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              >
                <ItemThumbnail item={item} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#f1f5f9' }}>{item.name}</span>
                    {item.isGroup && <span className="jsave-item-group-badge">{t('itemGroup')}</span>}
                    {status !== 'active' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(241,245,249,0.4)', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(241,245,249,0.06)', padding: '1px 6px', borderRadius: 4 }}>{t(status === 'sold' ? 'itemSold' : 'itemRetired')}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(241,245,249,0.45)' }}>
                    {item.isGroup
                      ? `${cur} ${fmtAmt(item.totalCost)} · ${item.members.length} ${t('itemGroupParts')}`
                      : `RM ${fmtAmt(item.cost)} · ${days} ${lang === 'zh' ? '天' : 'd'}`}
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

      {/* Add item / group */}
      <div className="jsave-item-add-actions">
        <button onClick={() => { setEditing(null); setPendingParentId(null); onShowAddChange(true) }}>+ {t('addItem')}</button>
        <button onClick={() => { setEditing({ kind: 'group', emoji: '🖥️' }); setPendingParentId(null); onShowAddChange(false) }}>+ {t('itemGroupAdd')}</button>
      </div>

      {(showAdd || editing) && (
        <ItemForm
          initial={editing} cur={cur} t={t}
          onSave={saveItem}
          onDelete={removeItem}
          onClose={closeForm}
          groupMode={groupMode}
          availableItems={availableGroupItems}
          initialMemberIds={groupMode ? (editing.members?.map(item => item.id) || []) : []}
          onAddComponent={addComponentToGroup}
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
    <button type="button" className={`jsave-goal-hero ${goal.coverUrl ? 'has-cover' : ''}`} onClick={onClick} style={{ padding: '22px', borderRadius: 18, background: 'radial-gradient(140% 80% at 0% 0%, rgba(245,213,112,0.22), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(16,185,129,0.16), transparent 65%), rgba(8,18,32,0.6)', border: '1px solid rgba(245,213,112,0.28)', position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: 12, transition: 'transform 0.2s', width: '100%', textAlign: 'left' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {goal.coverUrl && <div className="jsave-goal-hero-cover"><img src={goal.coverUrl} alt="" /></div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <GoalThumbnail goal={goal} size={46} />
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
        {daysLeft != null && <span className="jsave-goal-meta">{daysLeft} {t('goalDaysLeft')}</span>}
        {monthlyNeeded && <span className="jsave-goal-meta">RM {monthlyNeeded} {t('goalMonthly')}</span>}
      </div>
      <i className="js-tick" style={{ position: 'absolute', top: 10, right: 10, width: 12, height: 12, color: '#f5d570', opacity: 0.5 }}></i>
    </button>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────────────── */
export default function GoalsPage({ onOpenSettings }) {
  const { t, lang } = useLang()
  const { goals, addGoal, updateGoal, deleteGoal } = useJSave()
  const { user } = useAuth()

  const [tab, setTab]               = useState('goals')         // 'goals' | 'things'
  const [quickGoal, setQuickGoal]   = useState(null)            // goal for quick deposit
  const [settingsGoal, setSettingsGoal] = useState(null)        // goal for full settings
  const [showAddGoal, setShowAddGoal]   = useState(false)
  const [showAddItem, setShowAddItem]   = useState(false)

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

  async function handleSaveGoal(data, coverChange) {
    if (settingsGoal?.id) {
      let coverUpdate = {}
      if (coverChange.file) coverUpdate = await uploadGoalCover(user.uid, settingsGoal.id, coverChange.file)
      else if (coverChange.remove) coverUpdate = { coverPath: null, coverUrl: null }
      await updateGoal(settingsGoal.id, { ...data, ...coverUpdate })
      if (coverChange.remove && settingsGoal.coverPath) await deleteGoalCover(settingsGoal.coverPath)
      return
    }

    const goalId = crypto.randomUUID()
    const coverUpdate = coverChange.file ? await uploadGoalCover(user.uid, goalId, coverChange.file) : {}
    try {
      await addGoal({ ...data, ...coverUpdate, id: goalId })
    } catch (error) {
      if (coverUpdate.coverPath) await deleteGoalCover(coverUpdate.coverPath).catch(() => {})
      throw error
    }
  }

  async function handleDeleteGoal(id) {
    const goal = goals.find(item => item.id === id)
    await deleteGoal(id)
    if (goal?.coverPath) await deleteGoalCover(goal.coverPath).catch(() => {})
  }

  const RING_COLORS = ['#10b981', '#22d3ee', '#8b5cf6', '#f59e0b']

  return (
    <div className="jsave-page">

      <PageHeader
        code={`04 / ${tab === 'goals' ? 'GOALS' : 'THINGS'}`}
        title={tab === 'goals' ? t('goalsTitle') : t('itemsTitle')}
        onOpenSettings={onOpenSettings}
        settingsLabel={t('navSettings')}
        action={<button
          type="button"
          className="jsave-header-action primary"
          aria-label={tab === 'goals' ? t('addGoal') : t('addItem')}
          onClick={() => {
            if (tab === 'goals') { setSettingsGoal({}); setShowAddGoal(true) }
            else setShowAddItem(true)
          }}
        >+</button>}
      />

      {/* ── Goals / Things ── */}
      <div className="jsave-goal-tabs" role="tablist" aria-label={t('goalsTitle')}>
        {[['goals', t('goalsTitle')], ['things', t('itemsTitle')]].map(([id, label]) => (
          <button type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} key={id} onClick={() => { setTab(id); if (id !== 'things') setShowAddItem(false) }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Goals tab ── */}
      {tab === 'goals' && (
        <>
          {sortedGoals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div className="jsave-empty-symbol goal" aria-hidden="true"><i /></div>
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
                              <GoalThumbnail goal={goal} size={24} />
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
      {tab === 'things' && <ThingsView t={t} lang={lang} showAdd={showAddItem} onShowAddChange={setShowAddItem} />}

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
