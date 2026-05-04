import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

export default function ContactSettingsPage() {
  const { t } = useLang()
  const [form, setForm] = useState({
    chatTool: 'whatsapp',
    whatsappNumber: '',
    telegramLink: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setForm({
          chatTool: d.chatTool || 'whatsapp',
          whatsappNumber: d.whatsappNumber || '',
          telegramLink: d.telegramLink || '',
        })
      }
    })
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await setDoc(doc(db, 'cheers_settings', 'global'), {
      chatTool: form.chatTool,
      whatsappNumber: form.whatsappNumber,
      telegramLink: form.telegramLink,
    }, { merge: true })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.contact')}</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card p-4 space-y-4">
          <h2 className="font-medium text-cheers-dark-brown">显示聊天工具</h2>
          <div className="space-y-2">
            {[
              { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
              { value: 'telegram', label: 'Telegram', icon: '✈️' },
              { value: 'both', label: '两个都显示', icon: '💬✈️' },
            ].map(opt => (
              <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.chatTool === opt.value ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream'}`}>
                <input type="radio" name="chatTool" value={opt.value}
                  checked={form.chatTool === opt.value} onChange={() => setForm(f => ({ ...f, chatTool: opt.value }))} />
                <span className="text-sm font-medium text-cheers-dark-brown">{opt.icon} {opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {(form.chatTool === 'whatsapp' || form.chatTool === 'both') && (
          <div className="card p-4">
            <label className="label">WhatsApp 号码</label>
            <input className="input" value={form.whatsappNumber}
              onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
              placeholder="例：601XXXXXXXX（含国家代码）" />
            <p className="text-xs text-cheers-brown/50 mt-1">格式：60123456789（不含 + 号）</p>
          </div>
        )}

        {(form.chatTool === 'telegram' || form.chatTool === 'both') && (
          <div className="card p-4">
            <label className="label">Telegram 链接 / 用户名</label>
            <input className="input" value={form.telegramLink}
              onChange={e => setForm(f => ({ ...f, telegramLink: e.target.value }))}
              placeholder="例：@yourname 或 https://t.me/yourname" />
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? t('admin.saving') : saved ? '✓ ' + t('admin.saved') : t('admin.save')}
        </button>
      </form>
    </div>
  )
}
