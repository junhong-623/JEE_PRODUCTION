import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc, writeBatch } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

function getProdCatIds(p) {
  if (p.categoryIds?.length) return p.categoryIds
  return p.categoryId ? [p.categoryId] : []
}

export default function AdminProductsPage() {
  const { t } = useLang()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTrip, setActiveTrip] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  async function load() {
    const settingsSnap = await getDoc(doc(db, 'cheers_settings', 'global'))
    const tripId = settingsSnap.data()?.activeTripId
    setActiveTrip(tripId)
    const [prodSnap, catSnap] = await Promise.all([
      getDocs(collection(db, 'cheers_products')),
      getDocs(collection(db, 'cheers_categories')),
    ])
    setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('确认删除此商品？')) return
    await deleteDoc(doc(db, 'cheers_products', id))
    load()
  }

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSelectAll() {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))
  }

  async function handleBulk(field, value) {
    if (!selected.size) return
    setBulkLoading(true)
    const batch = writeBatch(db)
    selected.forEach(id => batch.update(doc(db, 'cheers_products', id), { [field]: value }))
    await batch.commit()
    setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, [field]: value } : p))
    setSelected(new Set())
    setBulkLoading(false)
  }

  const filtered = filter === 'all' ? products : products.filter(p => getProdCatIds(p).includes(filter))
  const activeCats = categories.filter(c => c.tripId === activeTrip)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{t('admin.products')}</h1>
        <Link to="/admin/products/new" className="btn-primary">+ {t('admin.add')}</Link>
      </div>

      {/* Category filter + select all */}
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        <button onClick={() => { setFilter('all'); setSelected(new Set()) }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'}`}>
          全部 ({products.length})
        </button>
        {activeCats.map(cat => (
          <button key={cat.id} onClick={() => { setFilter(cat.id); setSelected(new Set()) }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === cat.id ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'}`}>
            {cat.name?.zh} ({products.filter(p => getProdCatIds(p).includes(cat.id)).length})
          </button>
        ))}
        <button onClick={toggleSelectAll}
          className="ml-auto text-xs text-cheers-brown/60 hover:text-cheers-brown border border-cheers-brown/20 px-2.5 py-1 rounded-full">
          {selected.size === filtered.length && filtered.length > 0 ? '取消全选' : `全选 (${filtered.length})`}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-cheers-brown/40">{t('common.loading')}</div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-cheers-brown/40">暂无商品</div>
          ) : (
            <div className="divide-y divide-cheers-cream">
              {filtered.map(product => {
                const catNames = getProdCatIds(product)
                  .map(id => categories.find(c => c.id === id)?.name?.zh)
                  .filter(Boolean).join('、') || '未分类'
                return (
                  <div key={product.id} className="p-4 flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 accent-cheers-brown flex-shrink-0 cursor-pointer"
                      checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)} />
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-cheers-cream/40 flex items-center justify-center text-2xl flex-shrink-0">🛍</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-cheers-dark-brown text-sm truncate">{product.name?.zh}</p>
                      <p className="text-xs text-cheers-brown/50 mt-0.5">
                        RM {product.price?.toFixed(2)} · {catNames} ·
                        <span className={product.inStock ? ' text-green-600' : ' text-red-500'}>
                          {product.inStock ? ' 接单中' : ' 已截单'}
                        </span>
                        {product.featured && <span className="text-cheers-brown"> · ⭐精选</span>}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link to={`/admin/products/${product.id}`} className="btn-ghost text-xs py-1 px-3">{t('admin.edit')}</Link>
                      <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-600 text-xs px-2">{t('admin.delete')}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-cheers-cream px-4 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-cheers-dark-brown">已选 {selected.size} 件</span>
          <button onClick={() => handleBulk('inStock', true)} disabled={bulkLoading}
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">接单中</button>
          <button onClick={() => handleBulk('inStock', false)} disabled={bulkLoading}
            className="text-xs py-1.5 px-3 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50">停止接单</button>
          <button onClick={() => handleBulk('featured', true)} disabled={bulkLoading}
            className="text-xs py-1.5 px-3 rounded-lg border border-cheers-brown/30 text-cheers-brown hover:bg-cheers-cream disabled:opacity-50">⭐ 精选</button>
          <button onClick={() => handleBulk('featured', false)} disabled={bulkLoading}
            className="text-xs py-1.5 px-3 rounded-lg border border-cheers-brown/20 text-cheers-brown/60 hover:bg-cheers-cream disabled:opacity-50">取消精选</button>
          <button onClick={() => setSelected(new Set())}
            className="text-sm text-cheers-brown/50 hover:text-cheers-brown ml-1">取消</button>
        </div>
      )}
    </div>
  )
}
