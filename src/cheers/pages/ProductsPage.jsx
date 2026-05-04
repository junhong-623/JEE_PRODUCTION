import React, { useEffect, useState } from 'react'
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import ProductCard from '../components/ui/ProductCard'

const db = getFirestore(app)

export default function ProductsPage() {
  const { t, lang } = useLang()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [activeTripId, setActiveTripId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const settingsDoc = await getDoc(doc(db, 'cheers_settings', 'global'))
        const tripId = settingsDoc.data()?.activeTripId
        setActiveTripId(tripId)

        if (!tripId) return

        const [prodSnap, catSnap] = await Promise.all([
          getDocs(query(collection(db, 'cheers_products'), where('tripId', '==', tripId))),
          getDocs(query(collection(db, 'cheers_categories'), where('tripId', '==', tripId), orderBy('order'))),
        ])

        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.categoryId === activeCategory
    const name = p.name?.[lang] || p.name?.zh || ''
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{t('nav.products')}</h1>
        <input
          type="search"
          placeholder={t('common.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-cheers-brown text-cheers-cream'
                : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'
            }`}
          >
            {t('common.all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-cheers-brown text-cheers-cream'
                  : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'
              }`}
            >
              {cat.name?.[lang] || cat.name?.zh || cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-cheers-cream/40" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-cheers-cream/60 rounded w-3/4" />
                <div className="h-3 bg-cheers-cream/40 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-cheers-brown/50">
          <div className="text-5xl mb-3">🔍</div>
          <p>{lang === 'zh' ? '暂无商品' : 'No products found'}</p>
        </div>
      )}
    </div>
  )
}
