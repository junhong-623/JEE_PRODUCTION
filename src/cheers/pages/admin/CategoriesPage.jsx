import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

export default function CategoriesPage() {
  const { t } = useLang()
  const [categories, setCategories] = useState([])
  const [trips, setTrips] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ zh: '', en: '', tripId: '' })
  const [editing, setEditing] = useState(null)

  async function load() {
    const [catSnap, tripSnap, settingsSnap] = await Promise.all([
      getDocs(query(collection(db, 'cheers_categories'), orderBy('order'))),
      getDocs(collection(db, 'cheers_trips')),
      getDoc(doc(db, 'cheers_settings', 'global')),
    ])
    setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    const tripList = tripSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    setTrips(tripList)
    const aid = settingsSnap.data()?.activeTripId
    setActiveTrip(aid)
    if (aid && !form.tripId) setForm(f => ({ ...f, tripId: aid }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const order = categories.filter(c => c.tripId === form.tripId).length
    await addDoc(collection(db, 'cheers_categories'), {
      name: { zh: form.zh, en: form.en },
      tripId: form.tripId,
      order,
    })
    setForm(f => ({ ...f, zh: '', en: '' }))
    load()
  }

  async function handleUpdate(id, data) {
    await updateDoc(doc(db, 'cheers_categories', id), data)
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此分类？商品不会被删除')) return
    await deleteDoc(doc(db, 'cheers_categories', id))
    load()
  }

  const activeCats = categories.filter(c => c.tripId === (form.tripId || activeTrip))

  return (
    <div>
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.categories')}</h1>

      {/* Add form */}
      <div className="card p-4 mb-6">
        <h2 className="font-medium text-cheers-dark-brown mb-3">新增分类</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="label">行程</label>
            <select className="input" value={form.tripId} onChange={e => setForm(f => ({ ...f, tripId: e.target.value }))} required>
              <option value="">请选择行程</option>
              {trips.map(t => <option key={t.id} value={t.id}>{t.country?.zh}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">分类名（中文）</label>
              <input className="input" value={form.zh} onChange={e => setForm(f => ({ ...f, zh: e.target.value }))} required placeholder="例：零食" />
            </div>
            <div>
              <label className="label">Category (EN)</label>
              <input className="input" value={form.en} onChange={e => setForm(f => ({ ...f, en: e.target.value }))} required placeholder="e.g. Snacks" />
            </div>
          </div>
          <button type="submit" className="btn-primary">+ {t('admin.add')}</button>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-6 text-cheers-brown/40">{t('common.loading')}</div>
      ) : (
        <div className="card overflow-hidden">
          {categories.length === 0 ? (
            <div className="py-10 text-center text-cheers-brown/40">暂无分类</div>
          ) : (
            <div className="divide-y divide-cheers-cream">
              {categories.map(cat => (
                <div key={cat.id} className="px-4 py-3 flex items-center gap-4">
                  {editing === cat.id ? (
                    <EditCatRow cat={cat} trips={trips} onSave={handleUpdate} onCancel={() => setEditing(null)} />
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cheers-dark-brown">{cat.name?.zh}</p>
                        <p className="text-xs text-cheers-brown/50">{cat.name?.en} · {trips.find(t => t.id === cat.tripId)?.country?.zh}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(cat.id)} className="btn-ghost text-xs py-1 px-2">{t('admin.edit')}</button>
                        <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 text-xs">{t('admin.delete')}</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditCatRow({ cat, trips, onSave, onCancel }) {
  const [zh, setZh] = useState(cat.name?.zh || '')
  const [en, setEn] = useState(cat.name?.en || '')
  const [tripId, setTripId] = useState(cat.tripId || '')
  return (
    <div className="flex-1 flex items-center gap-2 flex-wrap">
      <input className="input flex-1 text-sm py-1" value={zh} onChange={e => setZh(e.target.value)} placeholder="中文" />
      <input className="input flex-1 text-sm py-1" value={en} onChange={e => setEn(e.target.value)} placeholder="EN" />
      <select className="input text-sm py-1" value={tripId} onChange={e => setTripId(e.target.value)}>
        {trips.map(t => <option key={t.id} value={t.id}>{t.country?.zh}</option>)}
      </select>
      <button onClick={() => onSave(cat.id, { name: { zh, en }, tripId })} className="btn-primary text-xs py-1 px-3">保存</button>
      <button onClick={onCancel} className="btn-ghost text-xs py-1 px-3">取消</button>
    </div>
  )
}
