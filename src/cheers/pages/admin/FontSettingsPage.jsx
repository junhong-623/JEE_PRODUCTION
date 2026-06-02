import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { FONTS_EN, FONTS_ZH, applyFonts, preloadAllFonts } from '../../lib/fontConfig'

const db = getFirestore(app)

const PAIRINGS = [
  { label: '优雅风 Elegant', fontEn: 'Cormorant Garamond', fontZh: 'Noto Serif SC' },
  { label: '现代风 Modern',  fontEn: 'Jost',               fontZh: 'Noto Sans SC'  },
  { label: '温暖风 Warm',    fontEn: 'Lora',               fontZh: 'Noto Serif SC'  },
  { label: '当前 Default',   fontEn: 'Inter',              fontZh: 'Noto Sans SC'  },
]

export default function FontSettingsPage() {
  const [fontEn, setFontEn] = useState('Inter')
  const [fontZh, setFontZh] = useState('Noto Sans SC')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    preloadAllFonts()
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.fontEn) setFontEn(data.fontEn)
        if (data.fontZh) setFontZh(data.fontZh)
      }
    })
  }, [])

  // Preview: apply fonts live as user clicks without saving
  function handleSelectEn(id) {
    setFontEn(id)
    applyFonts(id, fontZh)
  }
  function handleSelectZh(id) {
    setFontZh(id)
    applyFonts(fontEn, id)
  }
  function handlePairing(p) {
    setFontEn(p.fontEn)
    setFontZh(p.fontZh)
    applyFonts(p.fontEn, p.fontZh)
  }

  async function handleSave() {
    setSaving(true)
    await setDoc(doc(db, 'cheers_settings', 'global'), { fontEn, fontZh }, { merge: true })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-cheers-dark-brown">字体设置</h1>
        <button onClick={handleSave} disabled={saving}
          className={`btn-primary px-6 ${saved ? 'bg-green-600' : ''}`}>
          {saved ? '已保存 ✓' : saving ? '保存中…' : '保存'}
        </button>
      </div>

      <p className="text-sm text-cheers-brown/60">
        选择字体后可实时预览效果，满意后点击「保存」生效。
      </p>

      {/* Quick pairings */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-medium text-cheers-dark-brown">快速搭配推荐</h2>
        <div className="grid grid-cols-2 gap-2">
          {PAIRINGS.map(p => (
            <button key={p.label} type="button"
              onClick={() => handlePairing(p)}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                fontEn === p.fontEn && fontZh === p.fontZh
                  ? 'border-cheers-brown bg-cheers-cream/30'
                  : 'border-cheers-cream hover:border-cheers-brown/40'
              }`}>
              <p className="text-xs font-medium text-cheers-dark-brown mb-1">{p.label}</p>
              <p className="text-[11px] text-cheers-brown/60 truncate">{p.fontEn}</p>
              <p className="text-[11px] text-cheers-brown/60 truncate">{p.fontZh}</p>
            </button>
          ))}
        </div>
      </div>

      {/* English font picker */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-medium text-cheers-dark-brown">英文字体 (A–Z)</h2>
        <div className="space-y-2">
          {FONTS_EN.map(f => (
            <button key={f.id} type="button"
              onClick={() => handleSelectEn(f.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                fontEn === f.id
                  ? 'border-cheers-brown bg-cheers-cream/30'
                  : 'border-cheers-cream hover:border-cheers-brown/40'
              }`}>
              <div className="text-left">
                <p className="text-xs text-cheers-brown/50 mb-0.5">{f.desc.zh}</p>
                <p className="text-sm font-medium text-cheers-dark-brown" style={{ fontFamily: `'${f.id}', sans-serif` }}>
                  {f.label}
                </p>
              </div>
              <p className="text-xl text-cheers-dark-brown/70 flex-shrink-0 ml-4"
                style={{ fontFamily: `'${f.id}', sans-serif` }}>
                {f.preview}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chinese font picker */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-medium text-cheers-dark-brown">中文字体（汉字）</h2>
        <div className="space-y-2">
          {FONTS_ZH.map(f => (
            <button key={f.id} type="button"
              onClick={() => handleSelectZh(f.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                fontZh === f.id
                  ? 'border-cheers-brown bg-cheers-cream/30'
                  : 'border-cheers-cream hover:border-cheers-brown/40'
              }`}>
              <div className="text-left">
                <p className="text-xs text-cheers-brown/50 mb-0.5">{f.desc.zh}</p>
                <p className="text-sm font-medium text-cheers-dark-brown" style={{ fontFamily: `'${f.id}', sans-serif` }}>
                  {f.label}
                </p>
              </div>
              <p className="text-2xl text-cheers-dark-brown/70 flex-shrink-0 ml-4"
                style={{ fontFamily: `'${f.id}', sans-serif` }}>
                {f.preview}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="card p-5 space-y-2">
        <p className="text-xs text-cheers-brown/50 mb-3">实时预览 Live Preview</p>
        <h3 className="text-2xl text-cheers-dark-brown">国际精选代购 Cheers.co</h3>
        <p className="text-cheers-dark-brown/70">精选全球好物，直送到您手中。Curated global products, delivered to you.</p>
        <p className="text-cheers-brown font-semibold">RM 99.90</p>
      </div>
    </div>
  )
}
