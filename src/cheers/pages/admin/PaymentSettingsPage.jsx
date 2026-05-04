import React, { useEffect, useState, useRef } from 'react'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { uploadPaymentQr } from '../../lib/cloudinary'

const db = getFirestore(app)

export default function PaymentSettingsPage() {
  const { t } = useLang()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    paymentMode: 'full',
    depositAmount: '',
    paymentQrUrl: '',
    paymentNote: { zh: '', en: '' },
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setForm({
          paymentMode: d.paymentMode || 'full',
          depositAmount: d.depositAmount?.toString() || '',
          paymentQrUrl: d.paymentQrUrl || '',
          paymentNote: d.paymentNote || { zh: '', en: '' },
        })
      }
    })
  }, [])

  async function handleQrUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPaymentQr(file)
      setForm(f => ({ ...f, paymentQrUrl: url }))
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await setDoc(doc(db, 'cheers_settings', 'global'), {
      paymentMode: form.paymentMode,
      depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : null,
      paymentQrUrl: form.paymentQrUrl,
      paymentNote: form.paymentNote,
    }, { merge: true })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.payment')}</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Payment mode */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-cheers-dark-brown">付款模式</h2>
          <div className="space-y-2">
            {[{ value: 'full', label: '全款' }, { value: 'deposit', label: '定金' }].map(opt => (
              <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.paymentMode === opt.value ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream'}`}>
                <input type="radio" name="mode" value={opt.value}
                  checked={form.paymentMode === opt.value} onChange={() => setForm(f => ({ ...f, paymentMode: opt.value }))} />
                <span className="text-sm font-medium text-cheers-dark-brown">{opt.label}</span>
              </label>
            ))}
          </div>
          {form.paymentMode === 'deposit' && (
            <div>
              <label className="label">定金金额 (RM)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.depositAmount}
                onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))} placeholder="例：50" />
              <p className="text-xs text-cheers-brown/50 mt-1">留空则使用订单总额作为定金</p>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-cheers-dark-brown">付款二维码</h2>
          {form.paymentQrUrl && (
            <img src={form.paymentQrUrl} alt="QR" className="w-40 h-40 object-contain rounded-xl border border-cheers-cream" />
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={uploading} className="btn-secondary text-sm">
            {uploading ? '上传中…' : (form.paymentQrUrl ? '更换二维码' : '上传二维码')}
          </button>
        </div>

        {/* Payment note */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-cheers-dark-brown">付款说明</h2>
          <div>
            <label className="label">说明（中文）</label>
            <textarea className="input resize-none" rows={2}
              value={form.paymentNote.zh} onChange={e => setForm(f => ({ ...f, paymentNote: { ...f.paymentNote, zh: e.target.value } }))}
              placeholder="例：请转账定金 RM50 至以上账号" />
          </div>
          <div>
            <label className="label">Note (EN)</label>
            <textarea className="input resize-none" rows={2}
              value={form.paymentNote.en} onChange={e => setForm(f => ({ ...f, paymentNote: { ...f.paymentNote, en: e.target.value } }))}
              placeholder="e.g. Please transfer RM50 deposit to the account above" />
          </div>
        </div>

        <button type="submit" disabled={saving || uploading} className="btn-primary w-full py-3">
          {saving ? t('admin.saving') : saved ? '✓ ' + t('admin.saved') : t('admin.save')}
        </button>
      </form>
    </div>
  )
}
