import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

export default function AdminProductsPage() {
  const { t } = useLang()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTrip, setActiveTrip] = useState(null)

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

  const filtered = filter === 'all' ? products : products.filter(p => p.categoryId === filter)
  const activeCats = categories.filter(c => c.tripId === activeTrip)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{t('admin.products')}</h1>
        <Link to="/admin/products/new" className="btn-primary">+ {t('admin.add')}</Link>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'}`}>
          全部 ({products.length})
        </button>
        {activeCats.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === cat.id ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'}`}>
            {cat.name?.zh} ({products.filter(p => p.categoryId === cat.id).length})
          </button>
        ))}
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
                const cat = categories.find(c => c.id === product.categoryId)
                return (
                  <div key={product.id} className="p-4 flex items-center gap-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-cheers-cream/40 flex items-center justify-center text-2xl flex-shrink-0">🛍</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-cheers-dark-brown text-sm truncate">{product.name?.zh}</p>
                      <p className="text-xs text-cheers-brown/50 mt-0.5">
                        RM {product.price?.toFixed(2)} · {cat?.name?.zh || '未分类'} ·
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
    </div>
  )
}
