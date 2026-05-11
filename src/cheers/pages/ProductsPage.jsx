import React, { useEffect, useState } from 'react'
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
  // 'auto' = 默认（无展开但若 active 在隐藏区会自动展开）
  // 'open' = 用户手动展开
  // 'closed' = 用户手动收起（覆盖 auto，保持收起即使 active 在隐藏区）
  const [rootExpand, setRootExpand] = useState('auto')
  const [subExpand, setSubExpand] = useState('auto')
  const ROOT_LIMIT = 6
  const SUB_LIMIT = 6

  const activeCategory = searchParams.get('category') || 'all'

  function setActiveCategory(catId) {
    const next = new URLSearchParams(searchParams)
    if (catId === 'all') next.delete('category')
    else next.set('category', catId)
    setSearchParams(next, { replace: true })
    // 点击任何分类后自动收起两行（即使点的是「更多」展开后的项）
    setRootExpand('closed')
    setSubExpand('closed')
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

  // 自动展开仅在 rootExpand === 'auto' 时生效；
  // 'closed' 即使 active 在隐藏区也保持收起（点击副作用要的就是这个）
  const activeRootIdx = activeRootId ? rootCats.findIndex(c => c.id === activeRootId) : -1
  const activeSubIdx = (activeRootId && activeCategory !== activeRootId)
    ? activeSubCats.findIndex(c => c.id === activeCategory) : -1
  const fitsAllRoots = rootCats.length <= ROOT_LIMIT + 1
  const fitsAllSubs  = activeSubCats.length <= SUB_LIMIT + 1
  const showAllRoots = rootExpand === 'open' || fitsAllRoots || (rootExpand === 'auto' && activeRootIdx >= ROOT_LIMIT)
  const showAllSubs  = subExpand  === 'open' || fitsAllSubs  || (subExpand  === 'auto' && activeSubIdx  >= SUB_LIMIT)
  const visibleRoots = showAllRoots ? rootCats : rootCats.slice(0, ROOT_LIMIT)
  const visibleSubs  = showAllSubs  ? activeSubCats : activeSubCats.slice(0, SUB_LIMIT)
  const rootHidden = rootCats.length - visibleRoots.length
  const subHidden  = activeSubCats.length - visibleSubs.length

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
    const sq = search.toLowerCase()
    const matchSearch = !search
      || name.toLowerCase().includes(sq)
      || (p.colors || []).some(c => c.label.toLowerCase().includes(sq))
      || (p.sizes || []).some(s => s.toLowerCase().includes(sq))
      || (p.colors || []).flatMap(c => c.sizes || []).some(s => s.label?.toLowerCase().includes(sq))
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
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'all' ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'
              }`}>
              {t('common.all')}
            </button>
            {visibleRoots.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeRootId === cat.id ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'
                }`}>
                {cat.name?.[lang] || cat.name?.zh}
              </button>
            ))}
            {rootHidden > 0 && (
              <button onClick={() => setRootExpand('open')}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-cheers-brown/70 border border-dashed border-cheers-brown/30 hover:border-cheers-brown hover:text-cheers-brown transition-colors">
                {lang === 'zh' ? `更多 (${rootHidden}) ▾` : `More (${rootHidden}) ▾`}
              </button>
            )}
            {showAllRoots && !fitsAllRoots && (
              <button onClick={() => setRootExpand('closed')}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-cheers-brown/50 hover:text-cheers-brown transition-colors">
                {lang === 'zh' ? '收起 ▴' : 'Show less ▴'}
              </button>
            )}
          </div>

          {/* Sub-category row — only shown after clicking a root with children */}
          {activeSubCats.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-3 border-l-2 border-cheers-cream">
              <button onClick={() => setActiveCategory(activeRootId)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === activeRootId ? 'bg-cheers-brown/80 text-cheers-cream' : 'border border-cheers-brown/20 text-cheers-brown/70 hover:border-cheers-brown/50'
                }`}>
                {lang === 'zh' ? '全部' : 'All'}
              </button>
              {visibleSubs.map(sub => (
                <button key={sub.id} onClick={() => setActiveCategory(sub.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === sub.id ? 'bg-cheers-brown/80 text-cheers-cream' : 'border border-cheers-brown/20 text-cheers-brown/70 hover:border-cheers-brown/50'
                  }`}>
                  {sub.name?.[lang] || sub.name?.zh}
                </button>
              ))}
              {subHidden > 0 && (
                <button onClick={() => setSubExpand('open')}
                  className="px-3 py-1 rounded-full text-xs font-medium text-cheers-brown/60 border border-dashed border-cheers-brown/20 hover:border-cheers-brown/50 hover:text-cheers-brown transition-colors">
                  {lang === 'zh' ? `更多 (${subHidden}) ▾` : `More (${subHidden}) ▾`}
                </button>
              )}
              {showAllSubs && !fitsAllSubs && (
                <button onClick={() => setSubExpand('closed')}
                  className="px-3 py-1 rounded-full text-xs font-medium text-cheers-brown/40 hover:text-cheers-brown transition-colors">
                  {lang === 'zh' ? '收起 ▴' : 'Less ▴'}
                </button>
              )}
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
