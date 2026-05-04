import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const FLAGS = { japan: '🇯🇵', korea: '🇰🇷', thailand: '🇹🇭', hongkong: '🇭🇰', taiwan: '🇹🇼', other: '🌍' }

function TripModal({ trip, onSave, onClose }) {
  const { t } = useLang()
  const [form, setForm] = useState({
    country: trip?.country || { zh: '', en: '' },
    flag: trip?.flag || '🇯🇵',
    startDate: trip?.startDate?.toDate?.()?.toISOString().slice(0, 10) || '',
    endDate: trip?.endDate?.toDate?.()?.toISOString().slice(0, 10) || '',
    status: trip?.status || 'active',
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      country: form.country,
      flag: form.flag,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      status: form.status,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="font-serif text-lg text-cheers-dark-brown mb-4">{trip ? t('admin.edit') : t('admin.add')} {t('admin.trips')}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">国家名（中文）</label>
              <input className="input" value={form.country.zh}
                onChange={e => setForm(f => ({ ...f, country: { ...f.country, zh: e.target.value } }))} required />
            </div>
            <div>
              <label className="label">Country (EN)</label>
              <input className="input" value={form.country.en}
                onChange={e => setForm(f => ({ ...f, country: { ...f.country, en: e.target.value } }))} required />
            </div>
          </div>
          <div>
            <label className="label">Flag Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(FLAGS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setForm(f => ({ ...f, flag: v }))}
                  className={`text-2xl p-1.5 rounded-lg border transition-colors ${form.flag === v ? 'border-cheers-brown bg-cheers-cream' : 'border-cheers-cream'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">开始日期</label>
              <input type="date" className="input" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">截单日期</label>
              <input type="date" className="input" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">状态</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">接单中</option>
              <option value="closed">已截单</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{t('admin.save')}</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('admin.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TripsPage() {
  const { t } = useLang()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [activeId, setActiveId] = useState(null)

  async function load() {
    const [snap, settingsSnap] = await Promise.all([
      getDocs(collection(db, 'cheers_trips')),
      getDoc(doc(db, 'cheers_settings', 'global')),
    ])
    setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setActiveId(settingsSnap.data()?.activeTripId || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(data) {
    if (modal.trip?.id) {
      await updateDoc(doc(db, 'cheers_trips', modal.trip.id), data)
    } else {
      await addDoc(collection(db, 'cheers_trips'), { ...data, createdAt: serverTimestamp() })
    }
    setModal(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此行程？')) return
    await deleteDoc(doc(db, 'cheers_trips', id))
    load()
  }

  async function setActiveTrip(id) {
    await setDoc(doc(db, 'cheers_settings', 'global'), { activeTripId: id }, { merge: true })
    setActiveId(id)
  }

  return (
    <div>
      {modal && <TripModal trip={modal.trip} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{t('admin.trips')}</h1>
        <button className="btn-primary" onClick={() => setModal({ trip: null })}>+ {t('admin.add')}</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-cheers-brown/40">{t('common.loading')}</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-10 text-cheers-brown/40">暂无行程</div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => (
            <div key={trip.id} className={`card p-4 flex items-center gap-4 ${activeId === trip.id ? 'ring-2 ring-cheers-brown' : ''}`}>
              <span className="text-3xl">{trip.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-cheers-dark-brown">{trip.country?.zh} · {trip.country?.en}</p>
                  {activeId === trip.id && (
                    <span className="text-xs bg-cheers-brown text-cheers-cream px-2 py-0.5 rounded-full">当前行程</span>
                  )}
                </div>
                <p className="text-xs text-cheers-brown/50 mt-0.5">
                  {trip.endDate?.toDate?.()?.toLocaleDateString('zh-MY') || '无截单日期'} ·
                  <span className={trip.status === 'active' ? ' text-green-600' : ' text-red-500'}>
                    {trip.status === 'active' ? ' 接单中' : ' 已截单'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {activeId !== trip.id && (
                  <button onClick={() => setActiveTrip(trip.id)} className="btn-secondary text-xs py-1 px-3">设为当前</button>
                )}
                <button onClick={() => setModal({ trip })} className="btn-ghost text-xs py-1 px-3">{t('admin.edit')}</button>
                <button onClick={() => handleDelete(trip.id)} className="text-red-400 hover:text-red-600 text-xs px-2">{t('admin.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
