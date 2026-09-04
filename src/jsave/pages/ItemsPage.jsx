import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import GlassCard from '../components/GlassCard'
import { calendarDayDifference, toLocalDateString } from '../utils/date'

function daysSince(dateStr) {
  return Math.max(1, calendarDayDifference(new Date(), dateStr))
}

// Returns the date the item stopped being "active" — supports old disposeDate field
function endDate(item) {
  return item.retiredDate ?? item.saleDate ?? item.disposeDate ?? null
}

function daysTotal(purchaseDate, end) {
  if (!end) return daysSince(purchaseDate)
  return Math.max(1, calendarDayDifference(end, purchaseDate))
}

function itemStatus(item) {
  if (item.status) return item.status
  if (item.disposeDate) return 'retired'
  return 'active'
}

const today = () => toLocalDateString()

export default function ItemsPage() {
  const { t } = useLang()
  const { items, addItem, updateItem, deleteItem, settings } = useJSave()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const cur = settings?.currency ?? 'MYR'

  const fmt = (n) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: cur }).format(n)

  const sortedItems = [...items].sort((a, b) => {
    const cpdA = a.cost / daysTotal(a.purchaseDate, endDate(a))
    const cpdB = b.cost / daysTotal(b.purchaseDate, endDate(b))
    return cpdB - cpdA
  })

  const activeItems  = items.filter(i => itemStatus(i) === 'active')
  const retiredItems = items.filter(i => itemStatus(i) === 'retired')
  const soldItems    = items.filter(i => itemStatus(i) === 'sold')
  const totalAssets  = activeItems.reduce((s, i) => s + i.cost, 0)
  const totalCPD     = activeItems.reduce((s, i) => s + i.cost / daysTotal(i.purchaseDate, endDate(i)), 0)

  function openEdit(item) { setEditing(item); setShowForm(true) }
  function openAdd() { setEditing(null); setShowForm(true) }

  return (
    <div className="jsave-page">
      <div className="jsave-section-header">
        <div>
          <h2 className="jsave-section-title">{t('itemsTitle')}</h2>
          <p className="jsave-section-sub">{t('itemsSubtitle')}</p>
        </div>
        <button className="jsave-btn-primary" onClick={openAdd}>{t('addItem')}</button>
      </div>

      {items.length > 0 && (
        <GlassCard className="jsave-item-summary">
          <p className="jsave-section-sub" style={{ margin: '0 0 10px', fontWeight: 600 }}>{t('itemsOverview')}</p>
          <div className="jsave-item-summary-stats">
            <div className="jsave-item-stat">
              <span className="jsave-stat-label">{t('itemsTotalAssets')}</span>
              <span className="jsave-stat-val">{fmt(totalAssets)}</span>
            </div>
            <div className="jsave-item-stat">
              <span className="jsave-stat-label">{t('itemsTotalCPD')}</span>
              <span className="jsave-stat-val">{fmt(totalCPD)}</span>
            </div>
          </div>
          <div className="jsave-item-summary-counts">
            <span className="jsave-badge jsave-badge-blue">{t('itemsCountActive')} {activeItems.length}</span>
            <span className="jsave-badge jsave-badge-dim">{t('itemsCountRetired')} {retiredItems.length}</span>
            <span className="jsave-badge jsave-badge-green">{t('itemsCountSold')} {soldItems.length}</span>
          </div>
        </GlassCard>
      )}

      {items.length === 0 ? (
        <p className="jsave-empty-msg">{t('noItems')}</p>
      ) : (
        <div className="jsave-items-list">
          {sortedItems.map(item => {
            const end = endDate(item)
            const days = daysTotal(item.purchaseDate, end)
            const cpd = item.cost / days
            const isGreat = cpd < 1
            const status = itemStatus(item)

            return (
              <GlassCard key={item.id} className="jsave-item-card" onClick={() => openEdit(item)}>
                <div className="jsave-item-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="jsave-item-name">{item.name}</span>
                    {isGreat && <span className="jsave-badge-green">{t('itemGreatValue')}</span>}
                    {status === 'active'  && <span className="jsave-badge jsave-badge-blue">{t('itemActive')}</span>}
                    {status === 'retired' && <span className="jsave-badge jsave-badge-dim">{t('itemRetired')}</span>}
                    {status === 'sold'    && <span className="jsave-badge jsave-badge-green">{t('itemSold')}</span>}
                  </div>
                  <span className="jsave-item-cost">{fmt(item.cost)}</span>
                </div>

                <div className="jsave-item-stats">
                  <div className="jsave-item-stat">
                    <span className="jsave-stat-label">{t('itemDaysOwned')}</span>
                    <span className="jsave-stat-val">{days}</span>
                  </div>
                  <div className="jsave-item-stat">
                    <span className="jsave-stat-label">{t('itemCPD')}</span>
                    <span className={`jsave-stat-val ${isGreat ? 'txt-income' : ''}`}>
                      {new Intl.NumberFormat('en-MY', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(cpd)}
                    </span>
                  </div>
                  {status === 'sold' && item.salePrice != null && (
                    <div className="jsave-item-stat">
                      <span className="jsave-stat-label">{t('itemSalePrice')}</span>
                      <span className="jsave-stat-val txt-income">{fmt(item.salePrice)}</span>
                    </div>
                  )}
                </div>

                {item.note && <p className="jsave-item-note">{item.note}</p>}
              </GlassCard>
            )
          })}
        </div>
      )}

      {showForm && (
        <ItemForm
          initial={editing}
          cur={cur}
          t={t}
          onSave={async (data) => {
            if (editing?.id) await updateItem(editing.id, data)
            else await addItem(data)
            setShowForm(false)
          }}
          onDelete={async () => {
            if (editing?.id && window.confirm(t('confirmDelete'))) {
              await deleteItem(editing.id)
              setShowForm(false)
            }
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function ItemForm({ initial, cur, t, onSave, onDelete, onClose }) {
  const initStatus = itemStatus(initial ?? {})
  const [name,         setName]        = useState(initial?.name ?? '')
  const [cost,         setCost]        = useState(initial?.cost?.toString() ?? '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? today())
  const [note,         setNote]        = useState(initial?.note ?? '')
  const [retired,      setRetired]     = useState(initStatus === 'retired')
  const [retiredDate,  setRetiredDate] = useState(initial?.retiredDate ?? initial?.disposeDate ?? '')
  const [sold,         setSold]        = useState(initStatus === 'sold')
  const [salePrice,    setSalePrice]   = useState(initial?.salePrice?.toString() ?? '')
  const [saleDate,     setSaleDate]    = useState(initial?.saleDate ?? '')
  const [saving,       setSaving]      = useState(false)

  function toggleRetired(on) {
    setRetired(on)
    if (on) setSold(false)
  }

  function toggleSold(on) {
    setSold(on)
    if (on) setRetired(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const status = retired ? 'retired' : sold ? 'sold' : 'active'
    await onSave({
      name,
      cost: Number(cost),
      purchaseDate,
      status,
      retiredDate: retired ? (retiredDate || today()) : null,
      salePrice:   sold    ? Number(salePrice)        : null,
      saleDate:    sold    ? (saleDate || today())     : null,
      disposeDate: retired ? (retiredDate || today())  : null,
      note,
    })
  }

  return (
    <div className="jsave-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="jsave-modal glass-card">
        <h2 className="jsave-modal-title">{initial?.id ? t('itemEdit') : t('addItem')}</h2>
        <form onSubmit={handleSubmit} className="jsave-form">

          <label className="jsave-label">{t('itemName')}</label>
          <input className="jsave-input" placeholder={t('itemNamePh')} value={name} onChange={e => setName(e.target.value)} required />

          <label className="jsave-label">{t('itemCost')} ({cur})</label>
          <input className="jsave-input" type="number" min="0" step="0.01" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} required />

          <label className="jsave-label">{t('itemPurchaseDate')}</label>
          <input className="jsave-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />

          <label className="jsave-label">{t('itemNote')}</label>
          <input className="jsave-input" value={note} onChange={e => setNote(e.target.value)} />

          {/* Retired toggle */}
          <div className="jsave-setting-row" style={{ marginTop: 8 }}>
            <span className="jsave-label">{t('itemRetiredToggle')}</span>
            <label className="jsave-toggle">
              <input type="checkbox" checked={retired} onChange={e => toggleRetired(e.target.checked)} />
              <span className="jsave-toggle-track" />
            </label>
          </div>
          {retired && (
            <>
              <label className="jsave-label">{t('itemRetiredDate')}</label>
              <input className="jsave-input" type="date" value={retiredDate} onChange={e => setRetiredDate(e.target.value)} />
            </>
          )}

          {/* Sold toggle */}
          <div className="jsave-setting-row" style={{ marginTop: 4 }}>
            <span className="jsave-label">{t('itemSoldToggle')}</span>
            <label className="jsave-toggle">
              <input type="checkbox" checked={sold} onChange={e => toggleSold(e.target.checked)} />
              <span className="jsave-toggle-track" />
            </label>
          </div>
          {sold && (
            <>
              <label className="jsave-label">{t('itemSalePrice')} ({cur})</label>
              <input className="jsave-input" type="number" min="0" step="0.01" placeholder="0.00" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
              <label className="jsave-label">{t('itemSaleDate')}</label>
              <input className="jsave-input" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
            </>
          )}

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
