import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { uploadProductImage, uploadProductMedia } from '../../lib/cloudinary'

const db = getFirestore(app)
const MAX_IMAGES = 8

// ── Block Editor ─────────────────────────────────────────────────────────────
const BLOCK_LANG_TABS = ['zh', 'en']

function BlockEditor({ blocks, onChange }) {
  const [editLang, setEditLang] = useState('zh')
  const [uploading, setUploading] = useState(null) // block index or 'images' for multi-upload

  function addBlock(type) {
    const b = type === 'text'
      ? { type: 'text', content: { zh: '', en: '' } }
      : type === 'image'
      ? { type: 'image', url: '' }
      : { type: 'video', url: '', source: 'url' }
    onChange([...blocks, b])
  }

  function update(idx, patch) {
    onChange(blocks.map((b, i) => i === idx ? { ...b, ...patch } : b))
  }

  function move(idx, dir) {
    const arr = [...blocks]
    const swap = idx + (dir === 'up' ? -1 : 1)
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    onChange(arr)
  }

  async function handleMediaUpload(idx, file) {
    setUploading(idx)
    try {
      const url = await uploadProductMedia(file)
      update(idx, { url, source: 'upload' })
    } finally { setUploading(null) }
  }

  async function handleAddImageBlocks(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading('images')
    try {
      const urls = await Promise.all(files.map(f => uploadProductMedia(f)))
      onChange([...blocks, ...urls.map(url => ({ type: 'image', url }))])
    } finally { setUploading(null); e.target.value = '' }
  }

  function getYouTubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/\s]+)/)
    return m?.[1] || null
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-cheers-dark-brown">富媒体内容</h3>
          <p className="text-xs text-cheers-brown/50">图片、视频、补充说明，显示在商品描述下方</p>
        </div>
        <div className="flex gap-1 text-xs">
          {BLOCK_LANG_TABS.map(l => (
            <button key={l} type="button" onClick={() => setEditLang(l)}
              className={`px-2 py-1 rounded font-medium transition-colors ${editLang === l ? 'bg-cheers-brown text-cheers-cream' : 'text-cheers-brown/60 hover:text-cheers-brown'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Block list */}
      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <div key={idx} className="border border-cheers-cream rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-cheers-brown/60 uppercase tracking-wide">
                {block.type === 'text' ? '文字' : block.type === 'image' ? '图片' : '视频'}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(idx, 'up')} disabled={idx === 0}
                  className="text-cheers-brown/40 hover:text-cheers-brown disabled:opacity-20 px-1 text-xs">▲</button>
                <button type="button" onClick={() => move(idx, 'down')} disabled={idx === blocks.length - 1}
                  className="text-cheers-brown/40 hover:text-cheers-brown disabled:opacity-20 px-1 text-xs">▼</button>
                <button type="button" onClick={() => onChange(blocks.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600 px-1 text-sm ml-1">×</button>
              </div>
            </div>

            {block.type === 'text' && (
              <textarea className="input resize-y w-full text-sm" rows={3}
                placeholder={editLang === 'zh' ? '中文内容…' : 'English content…'}
                value={block.content?.[editLang] || ''}
                onChange={e => update(idx, { content: { ...block.content, [editLang]: e.target.value } })} />
            )}

            {block.type === 'image' && (
              <div className="space-y-2">
                {block.url && <img src={block.url} className="max-h-40 rounded-lg object-cover" />}
                <label className="btn-secondary text-xs cursor-pointer px-3 py-1.5 inline-block">
                  {uploading === idx ? '上传中…' : block.url ? '更换图片' : '上传图片'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading !== null}
                    onChange={e => e.target.files[0] && handleMediaUpload(idx, e.target.files[0])} />
                </label>
              </div>
            )}

            {block.type === 'video' && (
              <div className="space-y-2">
                <div className="flex gap-2 text-xs">
                  {['url', 'upload'].map(src => (
                    <label key={src} className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name={`vsrc-${idx}`} checked={block.source === src}
                        onChange={() => update(idx, { source: src, url: '' })} className="accent-cheers-brown" />
                      {src === 'url' ? '输入链接' : '上传视频'}
                    </label>
                  ))}
                </div>
                {block.source === 'url' ? (
                  <input className="input text-sm" placeholder="YouTube / 视频链接"
                    value={block.url || ''} onChange={e => update(idx, { url: e.target.value })} />
                ) : (
                  <label className="btn-secondary text-xs cursor-pointer px-3 py-1.5 inline-block">
                    {uploading === idx ? '上传中…' : block.url ? '更换视频' : '上传视频'}
                    <input type="file" accept="video/*" className="hidden" disabled={uploading !== null}
                      onChange={e => e.target.files[0] && handleMediaUpload(idx, e.target.files[0])} />
                  </label>
                )}
                {block.url && block.source === 'url' && getYouTubeId(block.url) && (
                  <div className="text-xs text-green-600">✓ YouTube 视频已识别</div>
                )}
                {block.url && block.source === 'upload' && (
                  <video src={block.url} controls className="max-h-32 rounded-lg w-full" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex gap-2 flex-wrap">
        {[['text', '+ 文字'], ['video', '+ 视频']].map(([type, label]) => (
          <button key={type} type="button" onClick={() => addBlock(type)}
            className="btn-ghost text-xs py-1.5 px-3 border border-cheers-brown/20 hover:border-cheers-brown/50">
            {label}
          </button>
        ))}
        <label className={`btn-ghost text-xs py-1.5 px-3 border border-cheers-brown/20 hover:border-cheers-brown/50 cursor-pointer ${uploading !== null ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading === 'images' ? '上传中…' : '+ 图片'}
          <input type="file" accept="image/*" multiple className="hidden"
            disabled={uploading !== null} onChange={handleAddImageBlocks} />
        </label>
      </div>
    </div>
  )
}

export default function ProductEditPage() {
  const { id } = useParams()
  const { t } = useLang()
  const navigate = useNavigate()
  const isNew = id === undefined
  const fileRef = useRef(null)

  const [trips, setTrips] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: { zh: '', en: '' },
    description: { zh: '', en: '' },
    price: '',
    categoryIds: [],
    tripId: '',
    inStock: true,
    featured: false,
    imageUrls: [],
    sizes: [],
    descriptionBlocks: [],
  })
  const [sizeInput, setSizeInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dragImgIdx, setDragImgIdx] = useState(null)
  const [dragOverImgIdx, setDragOverImgIdx] = useState(null)

  useEffect(() => {
    async function load() {
      const [tripSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'cheers_trips')),
        getDoc(doc(db, 'cheers_settings', 'global')),
      ])
      setTrips(tripSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      const aid = settingsSnap.data()?.activeTripId

      if (!isNew) {
        const snap = await getDoc(doc(db, 'cheers_products', id))
        if (snap.exists()) {
          const data = snap.data()
          const imageUrls = data.imageUrls?.length ? data.imageUrls : data.imageUrl ? [data.imageUrl] : []
          setForm({
            name: data.name || { zh: '', en: '' },
            description: data.description || { zh: '', en: '' },
            price: data.price?.toString() || '',
            categoryIds: data.categoryIds || (data.categoryId ? [data.categoryId] : []),
            tripId: data.tripId || '',
            inStock: data.inStock ?? true,
            featured: data.featured ?? false,
            imageUrls,
            sizes: data.sizes || [],
            descriptionBlocks: data.descriptionBlocks || [],
          })
          if (data.tripId) {
            const catSnap = await getDocs(query(collection(db, 'cheers_categories'), orderBy('order')))
            setCategories(catSnap.docs.filter(d => d.data().tripId === data.tripId).map(d => ({ id: d.id, ...d.data() })))
          }
        }
      } else if (aid) {
        setForm(f => ({ ...f, tripId: aid }))
        const catSnap = await getDocs(query(collection(db, 'cheers_categories'), orderBy('order')))
        setCategories(catSnap.docs.filter(d => d.data().tripId === aid).map(d => ({ id: d.id, ...d.data() })))
      }
    }
    load()
  }, [id, isNew])

  async function handleTripChange(tripId) {
    setForm(f => ({ ...f, tripId, categoryIds: [] }))
    const catSnap = await getDocs(query(collection(db, 'cheers_categories'), orderBy('order')))
    setCategories(catSnap.docs.filter(d => d.data().tripId === tripId).map(d => ({ id: d.id, ...d.data() })))
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(f => uploadProductImage(f)))
      setForm(f => ({ ...f, imageUrls: [...f.imageUrls, ...urls].slice(0, MAX_IMAGES) }))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeImage(idx) {
    setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      categoryIds: form.categoryIds,
      categoryId: form.categoryIds[0] || '',
      tripId: form.tripId,
      inStock: form.inStock,
      featured: form.featured,
      imageUrls: form.imageUrls,
      imageUrl: form.imageUrls[0] || '',
      sizes: form.sizes,
      descriptionBlocks: form.descriptionBlocks,
    }
    try {
      if (isNew) {
        await addDoc(collection(db, 'cheers_products'), data)
      } else {
        await setDoc(doc(db, 'cheers_products', id), data, { merge: true })
      }
      navigate('/admin/products')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/products')} className="text-cheers-brown/60 hover:text-cheers-brown text-sm">← 返回</button>
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{isNew ? '新增商品' : '编辑商品'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Images */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">商品图片</label>
            <span className="text-xs text-cheers-brown/50">{form.imageUrls.length}/{MAX_IMAGES} 张 · 第一张为主图</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {form.imageUrls.map((url, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => setDragImgIdx(idx)}
                onDragOver={e => { e.preventDefault(); setDragOverImgIdx(idx) }}
                onDrop={e => {
                  e.preventDefault()
                  if (dragImgIdx === null || dragImgIdx === idx) return
                  setForm(f => {
                    const urls = [...f.imageUrls]
                    const [item] = urls.splice(dragImgIdx, 1)
                    urls.splice(idx, 0, item)
                    return { ...f, imageUrls: urls }
                  })
                  setDragImgIdx(null); setDragOverImgIdx(null)
                }}
                onDragEnd={() => { setDragImgIdx(null); setDragOverImgIdx(null) }}
                className={`relative aspect-square cursor-grab active:cursor-grabbing transition-opacity
                  ${dragImgIdx === idx ? 'opacity-40' : ''}
                  ${dragOverImgIdx === idx && dragImgIdx !== idx ? 'ring-2 ring-cheers-brown ring-offset-1 rounded-xl' : ''}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-cheers-cream" draggable={false} />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-cheers-brown text-cheers-cream px-1.5 py-0.5 rounded-full">主图</span>
                )}
                <button type="button" onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600">×</button>
              </div>
            ))}
            {form.imageUrls.length < MAX_IMAGES && (
              <button type="button" onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-cheers-cream flex flex-col items-center justify-center text-cheers-brown/40 hover:border-cheers-brown/40 hover:text-cheers-brown/60 transition-colors">
                {uploading ? <div className="w-5 h-5 border-2 border-cheers-brown/30 border-t-cheers-brown rounded-full animate-spin" /> : <><span className="text-2xl">+</span><span className="text-[10px] mt-0.5">上传</span></>}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </div>

        {/* Basic info */}
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">商品名（中文）</label>
              <input className="input" value={form.name.zh}
                onChange={e => setForm(f => ({ ...f, name: { ...f.name, zh: e.target.value } }))} required />
            </div>
            <div>
              <label className="label">Product Name (EN)</label>
              <input className="input" value={form.name.en}
                onChange={e => setForm(f => ({ ...f, name: { ...f.name, en: e.target.value } }))} />
            </div>
          </div>
          <div>
            <label className="label">价格 (RM)</label>
            <input type="number" step="0.01" min="0" className="input" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">行程</label>
              <select className="input" value={form.tripId} onChange={e => handleTripChange(e.target.value)} required>
                <option value="">请选择行程</option>
                {trips.map(tr => <option key={tr.id} value={tr.id}>{tr.country?.zh}</option>)}
              </select>
            </div>
            <div>
              <label className="label">分类（可多选）</label>
              {categories.length === 0 ? (
                <p className="text-xs text-cheers-brown/40 mt-1">请先选择行程</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto border border-cheers-cream rounded-lg p-2">
                  {categories.map(c => (
                    <label key={c.id} className={`flex items-center gap-2 cursor-pointer py-0.5 ${c.parentId ? 'pl-4 text-xs' : 'text-sm font-medium'}`}>
                      <input type="checkbox" className="w-3.5 h-3.5 accent-cheers-brown flex-shrink-0"
                        checked={form.categoryIds.includes(c.id)}
                        onChange={e => setForm(f => ({
                          ...f,
                          categoryIds: e.target.checked
                            ? [...f.categoryIds, c.id]
                            : f.categoryIds.filter(id => id !== c.id),
                        }))} />
                      <span className="text-cheers-dark-brown">{c.name?.zh}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-4 space-y-3">
          <div>
            <label className="label">商品描述（中文）</label>
            <textarea className="input resize-y" rows={3}
              value={form.description.zh} onChange={e => setForm(f => ({ ...f, description: { ...f.description, zh: e.target.value } }))} />
          </div>
          <div>
            <label className="label">Description (EN)</label>
            <textarea className="input resize-y" rows={3}
              value={form.description.en} onChange={e => setForm(f => ({ ...f, description: { ...f.description, en: e.target.value } }))} />
          </div>
        </div>

        {/* Rich media blocks */}
        <BlockEditor
          blocks={form.descriptionBlocks}
          onChange={blocks => setForm(f => ({ ...f, descriptionBlocks: blocks }))}
        />

        {/* Sizes */}
        <div className="card p-4 space-y-3">
          <label className="label mb-0">尺码（可选）</label>
          <p className="text-xs text-cheers-brown/50">留空表示无需选码，适用于食品、日用品等</p>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="如：S / M / L / 37 / 38" value={sizeInput}
              onChange={e => setSizeInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const v = sizeInput.trim()
                  if (v && !form.sizes.includes(v)) setForm(f => ({ ...f, sizes: [...f.sizes, v] }))
                  setSizeInput('')
                }
              }} />
            <button type="button" className="btn-secondary px-4" onClick={() => {
              const v = sizeInput.trim()
              if (v && !form.sizes.includes(v)) setForm(f => ({ ...f, sizes: [...f.sizes, v] }))
              setSizeInput('')
            }}>添加</button>
          </div>
          {form.sizes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.sizes.map(size => (
                <span key={size} className="inline-flex items-center gap-1.5 bg-cheers-cream text-cheers-dark-brown text-sm px-3 py-1 rounded-full">
                  {size}
                  <button type="button" onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter(s => s !== size) }))}
                    className="text-cheers-brown/50 hover:text-cheers-brown leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="card p-4 flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))}
              className="w-4 h-4 rounded accent-cheers-brown" />
            <span className="text-sm font-medium text-cheers-dark-brown">接单中（可加入购物车）</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
              className="w-4 h-4 rounded accent-cheers-brown" />
            <span className="text-sm font-medium text-cheers-dark-brown">⭐ 精选商品（显示在首页）</span>
          </label>
        </div>

        <button type="submit" disabled={saving || uploading} className="btn-primary w-full py-3">
          {saving ? t('admin.saving') : t('admin.save')}
        </button>
      </form>
    </div>
  )
}
