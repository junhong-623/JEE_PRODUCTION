import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useJSave } from '../hooks/useJSave'
import GlassCard from '../components/GlassCard'

function daysSince(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.max(1, Math.floor((now - d) / 86400000))
}

function daysTotal(purchaseDate, disposeDate) {
  if (!disposeDate) return daysSince(purchaseDate)
  const from = new Date(purchaseDate)
  const to = new Date(disposeDate)
  return Math.max(1, Math.floor((to - from) / 86400000))
}

const today = () => new Date().toISOString().split('T')[0]

export default function ItemsPage() {
  const { t } = useLang()
  const { items, addItem, updateItem, deleteItem, settings } = useJSave()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const cur = settings?.currency ?? 'MYR'

  const sortedItems = [...items].sort((a, b) => {
    const cpdA = a.cost / daysTotal(a.purchaseDate, a.disposeDate)
    const cpdB = b.cost / daysTotal(b.purchaseDate, b.disposeDate)
    return cpdB - cpdA
  })

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

      {items.length === 0 ? (
        <p className="jsave-empty-msg">{t('noItems')}</p>
      ) : (
        <div className="jsave-items-list">
          {sortedItems.map(item => {
            const days = daysTotal(item.purchaseDate, item.disposeDate)
            const cpd = item.cost / days
            const isGreat = cpd < 1

            return (
              <GlassCard key={item.id} className="jsave-item-card" onClick={() => openEdit(item)}>
                <div className="jsave-item-top">
                  <div>
                    <span className="jsave-item-name">{item.name}</span>
                    {isGreat && <span className="jsave-badge-green">{t('itemGreatValue')}</span>}
                    <span className={`jsave-badge ${item.disposeDate ? 'jsave-badge-dim' : 'jsave-badge-blue'}`}>
                      {item.disposeDate ? t('itemDisposed') : t('itemActive')}
                    </span>
                  </div>
                  <span className="jsave-item-cost">
                    {new Intl.NumberFormat('en-MY', { style: 'currency', currency: cur }).format(item.cost)}
                  </span>
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
  const [name, setName] = useState(initial?.name ?? '')
  const [cost, setCost] = useState(initial?.cost?.toString() ?? '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? today())
  const [disposeDate, setDisposeDate] = useState(initial?.disposeDate ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, cost: Number(cost), purchaseDate, disposeDate: disposeDate || null, note })
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

          <label className="jsave-label">{t('itemDisposeDate')}</label>
          <input className="jsave-input" type="date" value={disposeDate} onChange={e => setDisposeDate(e.target.value)} />

          <label className="jsave-label">{t('itemNote')}</label>
          <input className="jsave-input" value={note} onChange={e => setNote(e.target.value)} />

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
