import React, { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import app from '../../../lib/firebase'

const db = getFirestore(app)

const ANNOUNCE_COLORS = [
  { key: 'yellow', label: '黄', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { key: 'orange', label: '橙', bg: 'bg-orange-100', text: 'text-orange-800' },
  { key: 'blue',   label: '蓝', bg: 'bg-blue-100',   text: 'text-blue-800'   },
  { key: 'green',  label: '绿', bg: 'bg-green-100',  text: 'text-green-800'  },
  { key: 'red',    label: '红', bg: 'bg-red-100',    text: 'text-red-800'    },
]

async function uploadImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', 'H-Agency')
  const res = await fetch('https://api.cloudinary.com/v1_1/db2ixn8zh/image/upload', { method: 'POST', body: fd })
  return (await res.json()).secure_url
}

export default function HomeSettingsPage() {
  const [hero, setHero] = useState({
    iconType: 'emoji', emoji: '🗾', imageUrl: '',
    title: { zh: '日本代购', en: 'Japan Proxy Shopping' },
    subtitle: { zh: '精选日本好物，专业代购服务直送到您手中', en: 'Curated Japanese goods, delivered to your door' },
    cta: { zh: '浏览商品', en: 'Shop Now' },
  })
  const [announcement, setAnnouncement] = useState({
    active: false, color: 'yellow', text: { zh: '', en: '' },
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [allCategories, setAllCategories] = useState([])
  const [homepageCatIds, setHomepageCatIds] = useState([])
  const [social, setSocial] = useState({
    instagram: '', facebook: '', tiktok: '', youtube: '', xiaohongshu: '', whatsapp: '', twitter: '',
  })

  useEffect(() => {
    async function load() {
      const [settingsSnap, catsSnap] = await Promise.all([
        getDoc(doc(db, 'cheers_settings', 'global')),
        getDocs(query(collection(db, 'cheers_categories'), orderBy('order'))),
      ])
      if (settingsSnap.exists()) {
        const d = settingsSnap.data()
        if (d.hero) setHero(h => ({ ...h, ...d.hero }))
        if (d.announcement) setAnnouncement(a => ({ ...a, ...d.announcement }))
        setHomepageCatIds(d.homepageCategoryIds || [])
        if (d.social) setSocial(s => ({ ...s, ...d.social }))
      }
      setAllCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  async function handleHeroImage(file) {
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setHero(h => ({ ...h, imageUrl: url, iconType: 'image' }))
    } finally { setUploading(false) }
  }

  async function handleSave() {
    setSaving(true)
    await setDoc(doc(db, 'cheers_settings', 'global'), { hero, announcement, homepageCategoryIds: homepageCatIds, social }, { merge: true })
    setSaving(false)
    setMsg('已保存')
    setTimeout(() => setMsg(''), 3000)
  }

  const annoColor = ANNOUNCE_COLORS.find(c => c.key === announcement.color) || ANNOUNCE_COLORS[0]

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl text-cheers-dark-brown">主页设置</h1>

      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>}

      {/* Hero Icon */}
      <div className="card p-4 space-y-4">
        <h2 className="font-medium text-cheers-dark-brown">主页图标</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="iconType" value="emoji" checked={hero.iconType === 'emoji'}
              onChange={() => setHero(h => ({ ...h, iconType: 'emoji' }))} className="accent-cheers-brown" />
            <span className="text-sm">Emoji</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="iconType" value="image" checked={hero.iconType === 'image'}
              onChange={() => setHero(h => ({ ...h, iconType: 'image' }))} className="accent-cheers-brown" />
            <span className="text-sm">图片</span>
          </label>
        </div>

        {hero.iconType === 'emoji' ? (
          <div>
            <label className="label">Emoji 符号</label>
            <input className="input w-32 text-2xl" value={hero.emoji}
              onChange={e => setHero(h => ({ ...h, emoji: e.target.value }))} placeholder="🗾" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {hero.imageUrl
              ? <img src={hero.imageUrl} className="w-20 h-20 rounded-xl object-cover border border-cheers-cream" />
              : <div className="w-20 h-20 rounded-xl bg-cheers-cream flex items-center justify-center text-cheers-brown/40 text-xs">未上传</div>
            }
            <div className="space-y-2">
              <label className="btn-secondary text-sm cursor-pointer px-4 py-2">
                {uploading ? '上传中…' : '上传图片'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={e => e.target.files[0] && handleHeroImage(e.target.files[0])} />
              </label>
              {hero.imageUrl && (
                <button onClick={() => setHero(h => ({ ...h, imageUrl: '', iconType: 'emoji' }))}
                  className="block text-xs text-red-400 hover:text-red-600">移除图片</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hero Text */}
      <div className="card p-4 space-y-4">
        <h2 className="font-medium text-cheers-dark-brown">主页文案</h2>
        {[
          { label: '主标题', key: 'title' },
          { label: '副标题', key: 'subtitle' },
          { label: '按钮文字', key: 'cta' },
        ].map(({ label, key }) => (
          <div key={key}>
            <p className="label">{label}</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="input text-sm" placeholder="中文" value={hero[key]?.zh || ''}
                onChange={e => setHero(h => ({ ...h, [key]: { ...h[key], zh: e.target.value } }))} />
              <input className="input text-sm" placeholder="English" value={hero[key]?.en || ''}
                onChange={e => setHero(h => ({ ...h, [key]: { ...h[key], en: e.target.value } }))} />
            </div>
          </div>
        ))}
      </div>

      {/* Announcement Banner */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-cheers-dark-brown">公告横幅</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={announcement.active}
              onChange={e => setAnnouncement(a => ({ ...a, active: e.target.checked }))}
              className="w-4 h-4 accent-cheers-brown" />
            <span className="text-sm text-cheers-brown">{announcement.active ? '显示中' : '已隐藏'}</span>
          </label>
        </div>

        <div>
          <label className="label">公告文字</label>
          <div className="grid grid-cols-2 gap-2">
            <input className="input text-sm" placeholder="中文公告" value={announcement.text?.zh || ''}
              onChange={e => setAnnouncement(a => ({ ...a, text: { ...a.text, zh: e.target.value } }))} />
            <input className="input text-sm" placeholder="English announcement" value={announcement.text?.en || ''}
              onChange={e => setAnnouncement(a => ({ ...a, text: { ...a.text, en: e.target.value } }))} />
          </div>
        </div>

        <div>
          <label className="label">颜色</label>
          <div className="flex gap-2">
            {ANNOUNCE_COLORS.map(c => (
              <button key={c.key} onClick={() => setAnnouncement(a => ({ ...a, color: c.key }))}
                className={`w-8 h-8 rounded-full ${c.bg} ${c.text} text-xs font-bold flex items-center justify-center border-2 transition-all ${announcement.color === c.key ? 'border-cheers-brown scale-110' : 'border-transparent'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {(announcement.text?.zh || announcement.text?.en) && (
          <div className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center ${annoColor.bg} ${annoColor.text}`}>
            {announcement.text?.zh || announcement.text?.en}
          </div>
        )}
      </div>

      {/* Social media links */}
      <div className="card p-4 space-y-3">
        <div>
          <h2 className="font-medium text-cheers-dark-brown mb-1">社交媒体 · Follow Us</h2>
          <p className="text-xs text-cheers-brown/50 mb-3">填写链接后显示在 Footer。留空则不显示。</p>
          <div className="space-y-2">
            {[
              { key: 'instagram',    label: 'Instagram',  placeholder: 'https://instagram.com/yourpage' },
              { key: 'facebook',     label: 'Facebook',   placeholder: 'https://facebook.com/yourpage' },
              { key: 'tiktok',       label: 'TikTok',     placeholder: 'https://tiktok.com/@yourpage' },
              { key: 'youtube',      label: 'YouTube',    placeholder: 'https://youtube.com/@yourchannel' },
              { key: 'xiaohongshu',  label: '小红书',     placeholder: 'https://xiaohongshu.com/user/...' },
              { key: 'whatsapp',     label: 'WhatsApp',   placeholder: 'https://wa.me/601234567890' },
              { key: 'twitter',      label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="grid grid-cols-[100px_1fr] items-center gap-2">
                <label className="text-sm text-cheers-brown">{label}</label>
                <input className="input text-sm" placeholder={placeholder}
                  value={social[key] || ''}
                  onChange={e => setSocial(s => ({ ...s, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Homepage category cards */}
      <div className="card p-4 space-y-3">
        <div>
          <h2 className="font-medium text-cheers-dark-brown mb-1">首页分类展示</h2>
          <p className="text-xs text-cheers-brown/50 mb-3">勾选后在主页显示为分类卡片，顾客点击「去逛逛」直接进入该分类商品页。</p>
          {allCategories.filter(c => !c.parentId).length === 0 ? (
            <p className="text-xs text-cheers-brown/40">暂无根分类</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {allCategories.filter(c => !c.parentId).map(cat => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-cheers-brown"
                    checked={homepageCatIds.includes(cat.id)}
                    onChange={e => setHomepageCatIds(prev =>
                      e.target.checked ? [...prev, cat.id] : prev.filter(id => id !== cat.id)
                    )} />
                  {cat.coverImage && <img src={cat.coverImage} className="w-8 h-8 rounded object-cover" />}
                  <span className="text-sm text-cheers-dark-brown">{cat.name?.zh || cat.name?.en}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-8">
        {saving ? '保存中…' : '保存设置'}
      </button>
    </div>
  )
}
