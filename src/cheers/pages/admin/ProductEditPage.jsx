import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { uploadProductImage, uploadProductMedia } from '../../lib/cloudinary'
import { modifiersToLegacy } from '../../lib/productPrice'

const db = getFirestore(app)
const MAX_IMAGES = 8

// ── Block Editor ─────────────────────────────────────────────────────────────
const BLOCK_LANG_TABS = ['zh', 'en']

function BlockEditor({ blocks, onChange, productImages = [] }) {
  const [editLang, setEditLang] = useState('zh')
  const [uploading, setUploading] = useState(null)
  const [pickerIdx, setPickerIdx] = useState(null)

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
                <div className="flex gap-2 flex-wrap">
                  <label className="btn-secondary text-xs cursor-pointer px-3 py-1.5 inline-block">
                    {uploading === idx ? '上传中…' : block.url ? '更换图片' : '上传图片'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading !== null}
                      onChange={e => e.target.files[0] && handleMediaUpload(idx, e.target.files[0])} />
                  </label>
                  {productImages.length > 0 && (
                    <button type="button"
                      onClick={() => setPickerIdx(pickerIdx === idx ? null : idx)}
                      className="btn-ghost text-xs py-1.5 px-3 border border-cheers-brown/20 hover:border-cheers-brown/50">
                      {pickerIdx === idx ? '收起' : '从商品图片选'}
                    </button>
                  )}
                </div>
                {pickerIdx === idx && (
                  <div className="flex gap-1.5 flex-wrap">
                    {productImages.map((url, i) => (
                      <button key={i} type="button"
                        onClick={() => { update(idx, { url }); setPickerIdx(null) }}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                          block.url === url ? 'border-cheers-brown' : 'border-transparent hover:border-cheers-brown/40'
                        }`}>
                        <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                      </button>
                    ))}
                  </div>
                )}
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

      <div className="flex gap-2 flex-wrap">
        {[['text', '+ 文字'], ['image', '+ 图片'], ['video', '+ 视频']].map(([type, label]) => (
          <button key={type} type="button" onClick={() => addBlock(type)}
            className="btn-ghost text-xs py-1.5 px-3 border border-cheers-brown/20 hover:border-cheers-brown/50">
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Modifier Editor ───────────────────────────────────────────────────────────
// modifiers: [{ name, withImage, options: [{label, imageUrl, price, costPrice}] }, ...]
// variantPrices: { "mod1Label|mod2Label": { price, costPrice } }

function ModifierEditor({ modifiers, variantPrices, onModifiers, onVariantPrices, productImages }) {
  const [optInputs, setOptInputs] = useState(['', '']) // input text per modifier group

  function updateMod(idx, patch) {
    onModifiers(modifiers.map((m, i) => i === idx ? { ...m, ...patch } : m))
  }

  function addOption(modIdx) {
    const label = optInputs[modIdx]?.trim()
    if (!label) return
    const newOpt = modIdx === 0
      ? { label, imageUrl: null, price: '', costPrice: '' }
      : { label }
    updateMod(modIdx, { options: [...(modifiers[modIdx].options || []), newOpt] })
    setOptInputs(prev => prev.map((v, i) => i === modIdx ? '' : v))
  }

  function removeOption(modIdx, optIdx) {
    const removedLabel = modifiers[modIdx].options[optIdx]?.label
    updateMod(modIdx, { options: modifiers[modIdx].options.filter((_, i) => i !== optIdx) })
    // Clean up variant prices if removing mod2 option
    if (modIdx === 1 && removedLabel) {
      const updated = { ...variantPrices }
      Object.keys(updated).forEach(k => { if (k.endsWith(`|${removedLabel}`)) delete updated[k] })
      onVariantPrices(updated)
    }
  }

  function updateOpt(modIdx, optIdx, patch) {
    updateMod(modIdx, {
      options: modifiers[modIdx].options.map((o, i) => i === optIdx ? { ...o, ...patch } : o)
    })
  }

  function setVariant(mod1Label, mod2Label, field, value) {
    const key = `${mod1Label}|${mod2Label}`
    onVariantPrices(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }))
  }

  const mod1 = modifiers[0]
  const mod2 = modifiers[1]

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-cheers-dark-brown">商品规格（可选）</h3>
          <p className="text-xs text-cheers-brown/50">自定义规格名称，如颜色、尺码、口味、规格等</p>
        </div>
        {modifiers.length < 2 && (
          <button type="button"
            onClick={() => onModifiers([...modifiers, { name: modifiers.length === 0 ? '规格' : '尺码', options: [] }])}
            className="btn-ghost text-xs py-1.5 px-3 border border-cheers-brown/30">
            + 添加规格组
          </button>
        )}
      </div>

      {modifiers.length === 0 && (
        <p className="text-xs text-cheers-brown/40 py-2 text-center">暂无规格，点击「添加规格组」开始设置</p>
      )}

      {modifiers.map((mod, modIdx) => (
        <div key={modIdx} className="border border-cheers-cream rounded-xl p-3 space-y-3">
          {/* Modifier group header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-cheers-brown/50 font-medium">规格 {modIdx + 1}</span>
            <input
              value={mod.name}
              onChange={e => updateMod(modIdx, { name: e.target.value })}
              placeholder="规格名称（如：颜色）"
              className="input text-sm flex-1 min-w-[120px]"
            />
            {modIdx === 0 && (
              <label className="flex items-center gap-1.5 text-xs text-cheers-brown/70 cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={!!mod.withImage} onChange={e => updateMod(0, { withImage: e.target.checked })}
                  className="accent-cheers-brown" />
                可关联图片
              </label>
            )}
            <button type="button"
              onClick={() => onModifiers(modifiers.filter((_, i) => i !== modIdx))}
              className="text-red-400 hover:text-red-600 text-xs px-2">删除规格组</button>
          </div>

          {/* Options list */}
          {modIdx === 0 && mod.options.length > 0 && !mod2 && (
            // Single modifier: show price per option
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 text-xs text-cheers-brown/50">
                <span>选项</span><span className="text-center">售价(RM)</span><span className="text-center">成本(RM)</span><span />
              </div>
              {mod.options.map((opt, optIdx) => (
                <div key={optIdx} className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center">
                  <div className="flex items-center gap-1.5">
                    <input value={opt.label} onChange={e => updateOpt(0, optIdx, { label: e.target.value })}
                      className="input text-sm flex-1" />
                    {mod.withImage && (
                      <select value={opt.imageUrl || ''} onChange={e => updateOpt(0, optIdx, { imageUrl: e.target.value || null })}
                        className="input text-xs py-1 w-24 flex-shrink-0">
                        <option value="">无图</option>
                        {productImages.map((url, i) => <option key={i} value={url}>图{i + 1}</option>)}
                      </select>
                    )}
                  </div>
                  <input type="number" step="0.01" min="0" placeholder="—"
                    value={opt.price} onChange={e => updateOpt(0, optIdx, { price: e.target.value })}
                    className="input text-xs text-center px-1 py-1" />
                  <input type="number" step="0.01" min="0" placeholder="—"
                    value={opt.costPrice} onChange={e => updateOpt(0, optIdx, { costPrice: e.target.value })}
                    className="input text-xs text-center px-1 py-1 bg-amber-50/50" />
                  <button type="button" onClick={() => removeOption(0, optIdx)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
                </div>
              ))}
            </div>
          )}

          {modIdx === 0 && mod.options.length > 0 && mod2 && (
            // Two modifiers: show image association for mod1 options (no per-option price, matrix handles it)
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {mod.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-1.5 bg-cheers-cream/40 px-2.5 py-1.5 rounded-lg">
                    <input value={opt.label} onChange={e => updateOpt(0, optIdx, { label: e.target.value })}
                      className="bg-transparent outline-none text-sm font-medium text-cheers-dark-brown w-20" />
                    {mod.withImage && (
                      <select value={opt.imageUrl || ''} onChange={e => updateOpt(0, optIdx, { imageUrl: e.target.value || null })}
                        className="text-xs bg-transparent outline-none text-cheers-brown/60 max-w-[60px]">
                        <option value="">无图</option>
                        {productImages.map((url, i) => <option key={i} value={url}>图{i + 1}</option>)}
                      </select>
                    )}
                    <button type="button" onClick={() => removeOption(0, optIdx)}
                      className="text-red-400 hover:text-red-600 text-base leading-none">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modIdx === 1 && mod.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mod.options.map((opt, optIdx) => (
                <span key={optIdx} className="inline-flex items-center gap-1 bg-cheers-cream text-cheers-dark-brown text-sm pl-3 pr-2 py-1 rounded-full">
                  <input value={opt.label} onChange={e => updateOpt(1, optIdx, { label: e.target.value })}
                    className="bg-transparent outline-none w-14 text-sm" />
                  <button type="button" onClick={() => removeOption(1, optIdx)}
                    className="text-cheers-brown/50 hover:text-cheers-brown leading-none">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Add option input */}
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder={modIdx === 0 ? `添加${mod.name || '规格'}选项` : `添加${mod.name || '尺码'}选项`}
              value={optInputs[modIdx] || ''}
              onChange={e => setOptInputs(prev => prev.map((v, i) => i === modIdx ? e.target.value : v))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(modIdx) } }}
            />
            <button type="button" className="btn-secondary px-4" onClick={() => addOption(modIdx)}>添加</button>
          </div>
        </div>
      ))}

      {/* Price matrix (mod1 × mod2) */}
      {mod1?.options?.length > 0 && mod2?.options?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-cheers-dark-brown">
            价格矩阵：{mod1.name} × {mod2.name}
          </p>
          <p className="text-xs text-cheers-brown/40">售价（上）/ 成本价（下，金色底）；留空表示沿用商品基础价格</p>
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-medium text-cheers-brown/60 py-1.5 pr-4 whitespace-nowrap">{mod1.name} ↓ / {mod2.name} →</th>
                  {mod2.options.map(o2 => (
                    <th key={o2.label} className="text-xs font-medium text-cheers-brown/60 py-1.5 px-2 text-center whitespace-nowrap">{o2.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mod1.options.map(o1 => (
                  <tr key={o1.label} className="border-t border-cheers-cream/60">
                    <td className="py-2 pr-4 font-medium text-cheers-dark-brown whitespace-nowrap">{o1.label}</td>
                    {mod2.options.map(o2 => {
                      const key = `${o1.label}|${o2.label}`
                      const vp = variantPrices[key] || {}
                      return (
                        <td key={o2.label} className="py-2 px-2">
                          <div className="flex flex-col gap-1">
                            <input type="number" step="0.01" min="0" placeholder="售—"
                              value={vp.price || ''}
                              onChange={e => setVariant(o1.label, o2.label, 'price', e.target.value)}
                              className="input text-xs w-20 text-center px-1 py-1" />
                            <input type="number" step="0.01" min="0" placeholder="本—"
                              value={vp.costPrice || ''}
                              onChange={e => setVariant(o1.label, o2.label, 'costPrice', e.target.value)}
                              className="input text-xs w-20 text-center px-1 py-1 bg-amber-50/50" />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

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
    costPrice: '',
    categoryIds: [],
    tripId: '',
    inStock: true,
    featured: false,
    imageUrls: [],
    descriptionBlocks: [],
  })
  // New modifier state (replaces form.sizes and form.colors)
  const [modifiers, setModifiers] = useState([])
  // Flat map: "mod1Label|mod2Label" → { price, costPrice }
  const [variantPrices, setVariantPrices] = useState({})

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
            costPrice: data.costPrice?.toString() || '',
            categoryIds: data.categoryIds || (data.categoryId ? [data.categoryId] : []),
            tripId: data.tripId || '',
            inStock: data.inStock ?? true,
            featured: data.featured ?? false,
            imageUrls,
            descriptionBlocks: data.descriptionBlocks || [],
          })

          // Load modifiers (new format or auto-convert from old)
          if (data.modifiers?.length) {
            const mods = data.modifiers.map(mod => ({
              ...mod,
              options: mod.options.map(opt => ({
                label: opt.label,
                imageUrl: opt.imageUrl ?? null,
                price: opt.price != null ? String(opt.price) : '',
                costPrice: opt.costPrice != null ? String(opt.costPrice) : '',
              })),
            }))
            setModifiers(mods)
            // Rebuild variantPrices from modifiers[0].options[].variants
            const vp = {}
            for (const opt of (data.modifiers[0]?.options || [])) {
              for (const v of (opt.variants || [])) {
                vp[`${opt.label}|${v.label}`] = {
                  price: v.price != null ? String(v.price) : '',
                  costPrice: v.costPrice != null ? String(v.costPrice) : '',
                }
              }
            }
            setVariantPrices(vp)
          } else {
            // Auto-convert from old colors/sizes format
            const mods = []
            if (data.colors?.length) {
              mods.push({
                name: '颜色', withImage: true,
                options: data.colors.map(c => ({
                  label: c.label,
                  imageUrl: c.imageUrl ?? null,
                  price: c.price != null ? String(c.price) : '',
                  costPrice: c.costPrice != null ? String(c.costPrice) : '',
                })),
              })
            }
            if (data.sizes?.length) {
              mods.push({
                name: '尺码',
                options: data.sizes.map(s => ({ label: typeof s === 'string' ? s : s.label })),
              })
            }
            setModifiers(mods)
            // Build variantPrices from old colors[].sizes
            const vp = {}
            for (const c of (data.colors || [])) {
              for (const s of (c.sizes || [])) {
                vp[`${c.label}|${s.label}`] = {
                  price: s.price != null ? String(s.price) : '',
                  costPrice: s.costPrice != null ? String(s.costPrice) : '',
                }
              }
            }
            setVariantPrices(vp)
          }

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

  function parseNum(v) {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    // Build final modifiers with variants from variantPrices
    const mod1 = modifiers[0]
    const mod2 = modifiers[1]
    const finalModifiers = modifiers.map((mod, modIdx) => {
      if (modIdx !== 0) return { name: mod.name, options: mod.options.map(o => ({ label: o.label })) }
      return {
        name: mod.name,
        withImage: !!mod.withImage,
        options: mod.options.map(opt => {
          const variants = mod2 ? mod2.options.map(o2 => {
            const vp = variantPrices[`${opt.label}|${o2.label}`] || {}
            return { label: o2.label, price: parseNum(vp.price), costPrice: parseNum(vp.costPrice) }
          }).filter(v => v.price != null || v.costPrice != null) : []
          return {
            label: opt.label,
            imageUrl: opt.imageUrl ?? null,
            price: parseNum(opt.price),
            costPrice: parseNum(opt.costPrice),
            variants,
          }
        }),
      }
    })

    // Also generate legacy colors/sizes for backward compat (order history, old code)
    const legacy = modifiersToLegacy(finalModifiers)

    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      costPrice: parseNum(form.costPrice),
      categoryIds: form.categoryIds,
      categoryId: form.categoryIds[0] || '',
      tripId: form.tripId,
      inStock: form.inStock,
      featured: form.featured,
      imageUrls: form.imageUrls,
      imageUrl: form.imageUrls[0] || '',
      modifiers: finalModifiers,
      ...legacy,  // colors + sizes (backward compat)
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">基础售价 (RM)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div>
              <label className="label">成本价 (RM)（可选）</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="—" value={form.costPrice}
                onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">行程</label>
              <select className="input" value={form.tripId} onChange={e => handleTripChange(e.target.value)} required>
                <option value="">请选择行程</option>
                {trips.map(tr => <option key={tr.id} value={tr.id}>{tr.country?.zh || tr.name?.zh || tr.id}</option>)}
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
                            : f.categoryIds.filter(cid => cid !== c.id),
                        }))} />
                      <span className="text-cheers-dark-brown">{c.name?.zh}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modifiers */}
        <ModifierEditor
          modifiers={modifiers}
          variantPrices={variantPrices}
          onModifiers={setModifiers}
          onVariantPrices={setVariantPrices}
          productImages={form.imageUrls}
        />

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
          productImages={form.imageUrls}
        />

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
