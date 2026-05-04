import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

export default function ActivitySettingsPage() {
  const { t } = useLang()
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) setEnabled(snap.data().activityFeedEnabled ?? false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await setDoc(doc(db, 'cheers_settings', 'global'), { activityFeedEnabled: enabled }, { merge: true })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.activity')}</h1>

      <div className="card p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-cheers-dark-brown">实时动态 Feed</p>
            <p className="text-sm text-cheers-brown/60 mt-1">
              在网站左下角显示随机生成的购买动态（如"Xiao Mei 刚刚购买了…"），营造热度感。
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-cheers-cream peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cheers-brown"></div>
          </label>
        </div>

        <div className="bg-cheers-light-cream rounded-xl p-4 text-sm text-cheers-brown/70 space-y-2">
          <p className="font-medium text-cheers-dark-brown">示例动态</p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <span>🛒</span>
            <span><strong>Wei Ling</strong> 加入了购物车 <strong>Tokyo Banana</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <span>✅</span>
            <span><strong>Ahmad</strong> 刚刚购买了 <strong>MLB Cap (Blue)</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <span>👀</span>
            <span><strong>5</strong> 人正在浏览 <strong>Laneige Lip Mask</strong></span>
          </div>
        </div>

        <p className="text-xs text-cheers-brown/50">
          ⚠️ 这些动态均为随机生成，非真实数据，仅供营造活跃氛围。
        </p>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
          {saving ? t('admin.saving') : saved ? '✓ ' + t('admin.saved') : t('admin.save')}
        </button>
      </div>
    </div>
  )
}
