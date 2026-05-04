import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

export default function DeliverySettingsPage() {
  const { t } = useLang()
  const [shippingFee, setShippingFee] = useState('')
  const [faceToFaceEnabled, setFaceToFaceEnabled] = useState(true)
  const [locations, setLocations] = useState([])
  const [newLoc, setNewLoc] = useState({ zh: '', en: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setShippingFee(d.shippingFee?.toString() || '')
        setFaceToFaceEnabled(d.faceToFaceEnabled ?? true)
        setLocations(d.faceToFaceLocations || [])
      }
    })
  }, [])

  function addLocation(e) {
    e.preventDefault()
    if (!newLoc.zh) return
    setLocations(prev => [...prev, { name: { zh: newLoc.zh, en: newLoc.en || newLoc.zh }, id: Date.now().toString() }])
    setNewLoc({ zh: '', en: '' })
  }

  function removeLocation(id) {
    setLocations(prev => prev.filter(l => l.id !== id))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await setDoc(doc(db, 'cheers_settings', 'global'), {
      shippingFee: shippingFee ? parseFloat(shippingFee) : 0,
      faceToFaceEnabled,
      faceToFaceLocations: locations,
    }, { merge: true })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.delivery')}</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Shipping fee */}
        <div className="card p-4">
          <h2 className="font-medium text-cheers-dark-brown mb-3">邮费</h2>
          <label className="label">统一邮费 (RM)</label>
          <input type="number" step="0.01" min="0" className="input" value={shippingFee}
            onChange={e => setShippingFee(e.target.value)} placeholder="例：10" />
          <p className="text-xs text-cheers-brown/50 mt-1">面交订单不收邮费</p>
        </div>

        {/* Face-to-face */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-cheers-dark-brown">面交选项</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={faceToFaceEnabled} onChange={e => setFaceToFaceEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-cheers-cream peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cheers-brown"></div>
            </label>
          </div>

          {faceToFaceEnabled && (
            <>
              <div>
                <p className="text-xs font-medium text-cheers-brown mb-2">面交地点列表</p>
                {locations.length === 0 ? (
                  <p className="text-xs text-cheers-brown/40">暂无面交地点</p>
                ) : (
                  <div className="space-y-2">
                    {locations.map(loc => (
                      <div key={loc.id} className="flex items-center justify-between bg-cheers-light-cream rounded-lg px-3 py-2">
                        <span className="text-sm text-cheers-dark-brown">{loc.name?.zh}</span>
                        <button type="button" onClick={() => removeLocation(loc.id)}
                          className="text-red-400 hover:text-red-600 text-xs ml-3">移除</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-cheers-brown mb-2">新增地点</p>
                <div className="flex gap-2">
                  <input className="input flex-1 text-sm" value={newLoc.zh}
                    onChange={e => setNewLoc(f => ({ ...f, zh: e.target.value }))} placeholder="中文地点名" />
                  <input className="input flex-1 text-sm" value={newLoc.en}
                    onChange={e => setNewLoc(f => ({ ...f, en: e.target.value }))} placeholder="EN (optional)" />
                  <button type="button" onClick={addLocation} className="btn-primary text-sm px-3 flex-shrink-0">+</button>
                </div>
              </div>
            </>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? t('admin.saving') : saved ? '✓ ' + t('admin.saved') : t('admin.save')}
        </button>
      </form>
    </div>
  )
}
