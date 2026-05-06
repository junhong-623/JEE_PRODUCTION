import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const POLICIES = [
  { key: 'tos', label: '服务条款 / Terms of Service' },
  { key: 'privacy', label: '隐私政策 / Privacy Policy' },
  { key: 'refund', label: '退款政策 / Refund Policy' },
]

export default function PoliciesPage() {
  const { t } = useLang()
  const [policies, setPolicies] = useState({
    tos: { zh: '', en: '' },
    privacy: { zh: '', en: '' },
    refund: { zh: '', en: '' },
  })
  const [activeTab, setActiveTab] = useState('tos')
  const [activeLang, setActiveLang] = useState('zh')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'policies')).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setPolicies({
          tos: d.tos || { zh: '', en: '' },
          privacy: d.privacy || { zh: '', en: '' },
          refund: d.refund || { zh: '', en: '' },
        })
      }
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await setDoc(doc(db, 'cheers_settings', 'policies'), policies)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.policies')}</h1>

      {/* Policy tabs */}
      <div className="flex gap-2 mb-4">
        {POLICIES.map(p => (
          <button key={p.key} onClick={() => setActiveTab(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === p.key ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'
            }`}>
            {p.key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Lang tabs */}
      <div className="flex gap-2 mb-4">
        {[{ key: 'zh', label: '中文' }, { key: 'en', label: 'English' }].map(l => (
          <button key={l.key} onClick={() => setActiveLang(l.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeLang === l.key ? 'bg-cheers-cream border border-cheers-brown text-cheers-brown' : 'border border-cheers-cream text-cheers-brown/60'
            }`}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <p className="text-xs text-cheers-brown/60 mb-2">{POLICIES.find(p => p.key === activeTab)?.label} · {activeLang === 'zh' ? '中文' : 'English'}</p>
        <textarea
          className="input resize-y font-mono text-sm"
          rows={16}
          value={policies[activeTab]?.[activeLang] || ''}
          onChange={e => setPolicies(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], [activeLang]: e.target.value }
          }))}
          placeholder={activeLang === 'zh' ? '在此输入条款内容…' : 'Enter policy content here…'}
        />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 mt-4">
        {saving ? t('admin.saving') : saved ? '✓ ' + t('admin.saved') : t('admin.save')}
      </button>
    </div>
  )
}
