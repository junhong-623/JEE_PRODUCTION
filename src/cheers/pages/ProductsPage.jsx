import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import ProductCard from '../components/ui/ProductCard'

const db = getFirestore(app)

function getProdCatIds(p) {
  if (p.categoryIds?.length) return p.categoryIds
  return p.categoryId ? [p.categoryId] : []
}

export default function ProductsPage() {
  const { t, lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTripId, setActiveTripId] = useState(null)
  const [search, setSearch] = useState('')
  const rootCatRef = useRef(null)
  const subCatRef  = useRef(null)

  const activeCategory = searchParams.get('category') || 'all'

  function setActiveCategory(catId) {
    const next = new URLSearchParams(searchParams)
    if (catId === 'all') next.delete('category')
    else next.set('category', catId)
    setSearchParams(next, { replace: true })
  }

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

  const rootCats = categories.filter(c => !c.parentId)
  function getChildren(parentId) { return categories.filter(c => c.parentId === parentId) }

  // Determine which root is active (even when a sub-category is selected)
  const activeCatObj = categories.find(c => c.id === activeCategory)
  const activeRootId = activeCategory === 'all' ? null
    : activeCatObj?.parentId || activeCategory   // sub → parent; root → itself
  const activeSubCats = activeRootId ? getChildren(activeRootId) : []

  useEffect(() => {
    function attach(el) {
      if (!el) return
      const fn = e => { e.preventDefault(); el.scrollLeft += e.deltaY + e.deltaX }
      el.addEventListener('wheel', fn, { passive: false })
      return () => el.removeEventListener('wheel', fn)
    }
    const d1 = attach(rootCatRef.current)
    const d2 = attach(subCatRef.current)
    return () => { d1?.(); d2?.() }
  }, [activeSubCats.length])

  // Products to show: include all sub-category products when root is selected
  const matchingCatIds = (() => {
    if (activeCategory === 'all') return null
    // If a sub-category is directly selected, show only that sub
    if (activeCatObj?.parentId) return new Set([activeCategory])
    // Root selected: include root + all its children
    const childIds = getChildren(activeCategory).map(c => c.id)
    return new Set([activeCategory, ...childIds])
  })()

  const filtered = products.filter(p => {
    const matchCat = !matchingCatIds || getProdCatIds(p).some(id => matchingCatIds.has(id))
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

      {/* Category filter — root row */}
      {rootCats.length > 0 && (
        <div className="space-y-2 mb-6">
          <div ref={rootCatRef} className="flex gap-2 overflow-x-auto no-scrollbar touch-pan-x pb-1">
            <button onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'all' ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'
              }`}>
              {t('common.all')}
            </button>
            {rootCats.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeRootId === cat.id ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'
                }`}>
                {cat.name?.[lang] || cat.name?.zh}
              </button>
            ))}
          </div>

          {/* Sub-category row — only shown after clicking a root with children */}
          {activeSubCats.length > 0 && (
            <div ref={subCatRef} className="flex gap-2 overflow-x-auto no-scrollbar touch-pan-x pb-1 pl-3 border-l-2 border-cheers-cream">
              <button onClick={() => setActiveCategory(activeRootId)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === activeRootId ? 'bg-cheers-brown/80 text-cheers-cream' : 'border border-cheers-brown/20 text-cheers-brown/70 hover:border-cheers-brown/50'
                }`}>
                {lang === 'zh' ? '全部' : 'All'}
              </button>
              {activeSubCats.map(sub => (
                <button key={sub.id} onClick={() => setActiveCategory(sub.id)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === sub.id ? 'bg-cheers-brown/80 text-cheers-cream' : 'border border-cheers-brown/20 text-cheers-brown/70 hover:border-cheers-brown/50'
                  }`}>
                  {sub.name?.[lang] || sub.name?.zh}
                </button>
              ))}
            </div>
          )}
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
