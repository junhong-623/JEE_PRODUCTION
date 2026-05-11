import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, writeBatch } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { optimizeUrl } from '../../lib/cloudinary'

const db = getFirestore(app)

function getProdCatIds(p) {
  if (p.categoryIds?.length) return p.categoryIds
  return p.categoryId ? [p.categoryId] : []
}

async function uploadCoverImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', 'H-Agency')
  const res = await fetch('https://api.cloudinary.com/v1_1/db2ixn8zh/image/upload', { method: 'POST', body: fd })
  return (await res.json()).secure_url
}

export default function CategoriesPage() {
  const { t } = useLang()
  const [categories, setCategories] = useState([])
  const [trips, setTrips] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [filterTripId, setFilterTripId] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ zh: '', en: '', tripId: '', parentId: '' })
  const [editing, setEditing] = useState(null)
  const [uploadingFor, setUploadingFor] = useState(null)
  // DnD
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  // Bulk category → product operations
  const [selectedCats, setSelectedCats] = useState(new Set())
  const [bulkCatLoading, setBulkCatLoading] = useState(false)

  async function load() {
    const [catSnap, tripSnap, settingsSnap] = await Promise.all([
      getDocs(query(collection(db, 'cheers_categories'), orderBy('order'))),
      getDocs(collection(db, 'cheers_trips')),
      getDoc(doc(db, 'cheers_settings', 'global')),
    ])
    setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    const tripList = tripSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    setTrips(tripList)
    const aid = settingsSnap.data()?.activeTripId
    setActiveTrip(aid)
    setFilterTripId(prev => prev || aid || '')
    setForm(f => ({ ...f, tripId: f.tripId || aid || '' }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const parentId = form.parentId || null
    const siblings = categories.filter(c => c.tripId === form.tripId && (c.parentId || null) === parentId)
    await addDoc(collection(db, 'cheers_categories'), {
      name: { zh: form.zh, en: form.en },
      tripId: form.tripId,
      parentId,
      order: siblings.length,
      coverImage: null,
    })
    setForm(f => ({ ...f, zh: '', en: '', parentId: '' }))
    load()
  }

  async function handleUpdate(id, data) {
    await updateDoc(doc(db, 'cheers_categories', id), data)
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (categories.some(c => c.parentId === id)) { alert('请先删除子分类'); return }
    if (!confirm('确认删除此分类？商品不会被删除')) return
    await deleteDoc(doc(db, 'cheers_categories', id))
    load()
  }

  async function handleCoverImage(id, file) {
    setUploadingFor(id)
    try {
      const url = await uploadCoverImage(file)
      await updateDoc(doc(db, 'cheers_categories', id), { coverImage: url })
      load()
    } finally { setUploadingFor(null) }
  }

  function getSiblings(tripId, parentId) {
    return categories
      .filter(c => c.tripId === tripId && (c.parentId || null) === (parentId || null))
      .sort((a, b) => a.order - b.order)
  }

  async function handleDrop(targetCat) {
    if (!draggedId || draggedId === targetCat.id) { setDraggedId(null); setDragOverId(null); return }
    const dragged = categories.find(c => c.id === draggedId)
    if (!dragged) { setDraggedId(null); setDragOverId(null); return }
    // Only allow drag within same parent level
    if ((dragged.parentId || null) !== (targetCat.parentId || null) || dragged.tripId !== targetCat.tripId) {
      setDraggedId(null); setDragOverId(null); return
    }
    const siblings = getSiblings(targetCat.tripId, targetCat.parentId)
    const fromIdx = siblings.findIndex(c => c.id === draggedId)
    const toIdx = siblings.findIndex(c => c.id === targetCat.id)
    if (fromIdx === toIdx) { setDraggedId(null); setDragOverId(null); return }
    const reordered = [...siblings]
    const [item] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, item)
    const batch = writeBatch(db)
    reordered.forEach((cat, i) => {
      if (cat.order !== i) batch.update(doc(db, 'cheers_categories', cat.id), { order: i })
    })
    await batch.commit()
    setDraggedId(null); setDragOverId(null)
    load()
  }

  function toggleCat(id) {
    setSelectedCats(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleCatBulkProducts(field, value) {
    if (!selectedCats.size) return
    setBulkCatLoading(true)
    const snap = await getDocs(collection(db, 'cheers_products'))
    const allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const toUpdate = allProducts.filter(p => getProdCatIds(p).some(id => selectedCats.has(id)))
    if (toUpdate.length) {
      const batch = writeBatch(db)
      toUpdate.forEach(p => batch.update(doc(db, 'cheers_products', p.id), { [field]: value }))
      await batch.commit()
    }
    setSelectedCats(new Set())
    setBulkCatLoading(false)
  }

  function CatRow({ cat, depth, siblings }) {
    const children = getSiblings(cat.tripId, cat.id)
    const isDragging = draggedId === cat.id
    const isDragOver = dragOverId === cat.id && draggedId !== cat.id
    return (
      <>
        <div
          className={`px-4 py-2.5 flex items-center gap-3 transition-colors border-t-2
            ${depth > 0 ? 'bg-cheers-light-cream/60 border-l-2 border-cheers-cream ml-4' : ''}
            ${isDragging ? 'opacity-40' : ''}
            ${isDragOver ? 'border-t-cheers-brown bg-cheers-cream/30' : 'border-t-transparent'}`}
          onDragOver={e => { e.preventDefault(); setDragOverId(cat.id) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null) }}
          onDrop={e => { e.preventDefault(); handleDrop(cat) }}
          onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
        >
          {/* Drag handle — only this element is draggable */}
          <span
            draggable
            onDragStart={e => { e.stopPropagation(); setDraggedId(cat.id) }}
            className="flex-shrink-0 text-cheers-brown/30 hover:text-cheers-brown/70 cursor-grab active:cursor-grabbing text-base select-none leading-none px-0.5"
          >⠿</span>

          {/* Bulk checkbox */}
          <input type="checkbox" className="w-4 h-4 accent-cheers-brown flex-shrink-0 cursor-pointer"
            checked={selectedCats.has(cat.id)} onChange={() => toggleCat(cat.id)}
            onClick={e => e.stopPropagation()} />

          {/* Cover image */}
          <label htmlFor={`cov-${cat.id}`} className="relative flex-shrink-0 cursor-pointer group">
            {cat.coverImage
              ? <img src={optimizeUrl(cat.coverImage, { width: 80 })} className="w-9 h-9 rounded-lg object-cover" />
              : <div className="w-9 h-9 rounded-lg bg-cheers-cream flex items-center justify-center text-cheers-brown/30 text-[10px]">封面</div>
            }
            <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              {uploadingFor === cat.id && <span className="text-white text-[10px]">…</span>}
            </div>
            <input id={`cov-${cat.id}`} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && handleCoverImage(cat.id, e.target.files[0])} />
          </label>

          {editing === cat.id ? (
            <EditCatRow cat={cat} trips={trips} categories={categories} onSave={handleUpdate} onCancel={() => setEditing(null)} />
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cheers-dark-brown leading-tight">{cat.name?.zh}</p>
                <p className="text-xs text-cheers-brown/50">{cat.name?.en}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing(cat.id)} className="btn-ghost text-xs py-1 px-2">{t('admin.edit')}</button>
                <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 text-xs">{t('admin.delete')}</button>
              </div>
            </>
          )}
        </div>
        {children.map(child => (
          <CatRow key={child.id} cat={child} depth={depth + 1} siblings={children} />
        ))}
      </>
    )
  }

  const displayTrips = trips.filter(trip => !filterTripId || trip.id === filterTripId)
  const rootCatsForForm = categories.filter(c => c.tripId === form.tripId && !c.parentId)

  return (
    <div>
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.categories')}</h1>

      {/* Add form */}
      <div className="card p-4 mb-5">
        <h2 className="font-medium text-cheers-dark-brown mb-3">新增分类</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">行程</label>
              <select className="input" value={form.tripId}
                onChange={e => setForm(f => ({ ...f, tripId: e.target.value, parentId: '' }))} required>
                <option value="">请选择行程</option>
                {trips.map(tr => <option key={tr.id} value={tr.id}>{tr.country?.zh}</option>)}
              </select>
            </div>
            <div>
              <label className="label">父分类（留空 = 根分类）</label>
              <select className="input" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                <option value="">根分类</option>
                {rootCatsForForm.map(c => <option key={c.id} value={c.id}>{c.name?.zh}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">分类名（中文）</label>
              <input className="input" value={form.zh} onChange={e => setForm(f => ({ ...f, zh: e.target.value }))}
                required placeholder="例：零食" />
            </div>
            <div>
              <label className="label">Category (EN)</label>
              <input className="input" value={form.en} onChange={e => setForm(f => ({ ...f, en: e.target.value }))}
                required placeholder="e.g. Snacks" />
            </div>
          </div>
          <button type="submit" className="btn-primary">+ {t('admin.add')}</button>
        </form>
      </div>

      {/* Trip filter tabs */}
      <div className="flex gap-1 mb-3 border-b border-cheers-cream">
        {trips.map(trip => (
          <button key={trip.id} onClick={() => setFilterTripId(trip.id)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors ${filterTripId === trip.id ? 'border-cheers-brown text-cheers-brown' : 'border-transparent text-cheers-brown/50 hover:text-cheers-brown'}`}>
            {trip.country?.zh}
          </button>
        ))}
      </div>

      {/* Category tree */}
      {loading ? (
        <div className="text-center py-6 text-cheers-brown/40">{t('common.loading')}</div>
      ) : (
        <div className="card overflow-hidden">
          {displayTrips.every(trip => getSiblings(trip.id, null).length === 0) ? (
            <div className="py-10 text-center text-cheers-brown/40">暂无分类</div>
          ) : (
            <div className="divide-y divide-cheers-cream">
              {displayTrips.map(trip => {
                const roots = getSiblings(trip.id, null)
                if (!roots.length) return null
                return (
                  <React.Fragment key={trip.id}>
                    {trips.length > 1 && !filterTripId && (
                      <div className="px-4 py-2 bg-cheers-cream/40">
                        <p className="text-xs font-semibold text-cheers-brown/60">{trip.country?.zh}</p>
                      </div>
                    )}
                    {roots.map(cat => <CatRow key={cat.id} cat={cat} depth={0} siblings={roots} />)}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating bulk action bar */}
      {selectedCats.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-cheers-cream px-4 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-cheers-dark-brown">已选 {selectedCats.size} 个分类的商品</span>
          <button onClick={() => handleCatBulkProducts('inStock', true)} disabled={bulkCatLoading}
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">接单中</button>
          <button onClick={() => handleCatBulkProducts('inStock', false)} disabled={bulkCatLoading}
            className="text-xs py-1.5 px-3 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50">停止接单</button>
          <button onClick={() => handleCatBulkProducts('featured', true)} disabled={bulkCatLoading}
            className="text-xs py-1.5 px-3 rounded-lg border border-cheers-brown/30 text-cheers-brown hover:bg-cheers-cream disabled:opacity-50">⭐ 精选</button>
          <button onClick={() => handleCatBulkProducts('featured', false)} disabled={bulkCatLoading}
            className="text-xs py-1.5 px-3 rounded-lg border border-cheers-brown/20 text-cheers-brown/60 hover:bg-cheers-cream disabled:opacity-50">取消精选</button>
          <button onClick={() => setSelectedCats(new Set())}
            className="text-sm text-cheers-brown/50 hover:text-cheers-brown ml-1">取消</button>
        </div>
      )}
    </div>
  )
}

function EditCatRow({ cat, trips, categories, onSave, onCancel }) {
  const [zh, setZh] = useState(cat.name?.zh || '')
  const [en, setEn] = useState(cat.name?.en || '')
  const [tripId, setTripId] = useState(cat.tripId || '')
  const [parentId, setParentId] = useState(cat.parentId || '')
  const rootCats = categories.filter(c => c.tripId === tripId && !c.parentId && c.id !== cat.id)
  return (
    <div className="flex-1 flex items-center gap-2 flex-wrap">
      <input className="input flex-1 text-sm py-1" value={zh} onChange={e => setZh(e.target.value)} placeholder="中文" />
      <input className="input flex-1 text-sm py-1" value={en} onChange={e => setEn(e.target.value)} placeholder="EN" />
      <select className="input text-sm py-1" value={tripId} onChange={e => { setTripId(e.target.value); setParentId('') }}>
        {trips.map(tr => <option key={tr.id} value={tr.id}>{tr.country?.zh}</option>)}
      </select>
      <select className="input text-sm py-1" value={parentId} onChange={e => setParentId(e.target.value)}>
        <option value="">根分类</option>
        {rootCats.map(c => <option key={c.id} value={c.id}>{c.name?.zh}</option>)}
      </select>
      <button onClick={() => onSave(cat.id, { name: { zh, en }, tripId, parentId: parentId || null })}
        className="btn-primary text-xs py-1 px-3">保存</button>
      <button onClick={onCancel} className="btn-ghost text-xs py-1 px-3">取消</button>
    </div>
  )
}
