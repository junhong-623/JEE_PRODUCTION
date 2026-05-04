import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { uploadProductImage } from '../../lib/cloudinary'

const db = getFirestore(app)
const MAX_IMAGES = 8

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
    categoryId: '',
    tripId: '',
    inStock: true,
    featured: false,
    imageUrls: [],
    sizes: [],
  })
  const [sizeInput, setSizeInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

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
            categoryId: data.categoryId || '',
            tripId: data.tripId || '',
            inStock: data.inStock ?? true,
            featured: data.featured ?? false,
            imageUrls,
            sizes: data.sizes || [],
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
    setForm(f => ({ ...f, tripId, categoryId: '' }))
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
      categoryId: form.categoryId,
      tripId: form.tripId,
      inStock: form.inStock,
      featured: form.featured,
      imageUrls: form.imageUrls,
      imageUrl: form.imageUrls[0] || '',
      sizes: form.sizes,
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
              <div key={idx} className="relative aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-cheers-cream" />
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
              <label className="label">分类</label>
              <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">未分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name?.zh}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-4 space-y-3">
          <div>
            <label className="label">商品描述（中文）</label>
            <textarea className="input resize-none" rows={3}
              value={form.description.zh} onChange={e => setForm(f => ({ ...f, description: { ...f.description, zh: e.target.value } }))} />
          </div>
          <div>
            <label className="label">Description (EN)</label>
            <textarea className="input resize-none" rows={3}
              value={form.description.en} onChange={e => setForm(f => ({ ...f, description: { ...f.description, en: e.target.value } }))} />
          </div>
        </div>

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
