import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import ProductCard from '../components/ui/ProductCard'

const db = getFirestore(app)

export default function HomePage() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const [activeTrip, setActiveTrip] = useState(null)
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [hero, setHero] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const settingsDoc = await getDoc(doc(db, 'cheers_settings', 'global'))
        const settings = settingsDoc.exists() ? settingsDoc.data() : {}
        const activeTripId = settings.activeTripId
        if (settings.hero) setHero(settings.hero)

        if (activeTripId) {
          const [tripDoc, productsSnap, catsSnap] = await Promise.all([
            getDoc(doc(db, 'cheers_trips', activeTripId)),
            getDocs(query(collection(db, 'cheers_products'),
              where('tripId', '==', activeTripId),
              where('featured', '==', true),
              where('inStock', '==', true),
              limit(8))),
            getDocs(query(collection(db, 'cheers_categories'),
              where('tripId', '==', activeTripId),
              orderBy('order'))),
          ])

          if (tripDoc.exists()) setActiveTrip({ id: tripDoc.id, ...tripDoc.data() })
          setFeatured(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
          // Only root categories (no parentId) for nav bar
          setCategories(catsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(c => !c.parentId))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tripName = activeTrip?.country?.[lang] || activeTrip?.country?.zh || ''
  const deadline = activeTrip?.endDate?.toDate?.()?.toLocaleDateString(lang === 'zh' ? 'zh-MY' : 'en-MY') || ''

  const heroTitle    = hero?.title?.[lang]    || hero?.title?.zh    || t('home.hero.title')
  const heroSubtitle = hero?.subtitle?.[lang] || hero?.subtitle?.zh || t('home.hero.subtitle')
  const heroCta      = hero?.cta?.[lang]      || hero?.cta?.zh      || t('home.hero.cta')

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cheers-cream via-cheers-light-cream to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Icon — emoji or image */}
          {hero?.iconType === 'image' && hero?.imageUrl ? (
            <img src={hero.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-sm" />
          ) : (
            <div className="text-6xl mb-4">{hero?.emoji || '🗾'}</div>
          )}

          <h1 className="font-serif text-4xl md:text-5xl text-cheers-dark-brown font-bold mb-4 leading-tight">
            {heroTitle}
          </h1>
          <p className="text-cheers-brown/70 text-lg mb-8 max-w-xl mx-auto">
            {heroSubtitle}
          </p>

          {activeTrip && (
            <div className="inline-flex items-center gap-2 bg-white border border-cheers-cream rounded-full px-4 py-2 text-sm text-cheers-brown mb-8 shadow-sm">
              <span className="text-base">{activeTrip.flag || '🇯🇵'}</span>
              <span className="font-medium">{tripName}</span>
              {activeTrip.status === 'active' ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('home.active')}</span>
              ) : (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{t('home.closed')}</span>
              )}
              {deadline && (
                <span className="text-cheers-brown/50">· {t('home.deadline')}: {deadline}</span>
              )}
            </div>
          )}

          <Link to="/products" className="btn-primary text-base px-8 py-3 inline-block">
            {heroCta}
          </Link>
        </div>

        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cheers-cream/40 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-cheers-cream/30 blur-2xl" />
      </section>

      {/* Category nav bar */}
      {categories.length > 0 && (
        <div className="border-b border-cheers-cream bg-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              <button onClick={() => navigate('/products')}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-cheers-brown/20 text-sm text-cheers-brown hover:border-cheers-brown hover:bg-cheers-cream/30 transition-colors">
                {lang === 'zh' ? '全部' : 'All'}
              </button>
              {categories.map(cat => {
                const name = cat.name?.[lang] || cat.name?.zh || cat.name?.en
                return (
                  <button key={cat.id} onClick={() => navigate(`/products?category=${cat.id}`)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cheers-brown/20 text-sm text-cheers-brown hover:border-cheers-brown hover:bg-cheers-cream/30 transition-colors whitespace-nowrap">
                    {cat.coverImage
                      ? <img src={cat.coverImage} className="w-5 h-5 rounded-full object-cover" />
                      : <span className="text-base leading-none">{cat.name?.zh?.[0] || '◆'}</span>
                    }
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-cheers-dark-brown">{t('home.featured')}</h2>
          <Link to="/products" className="text-sm text-cheers-brown hover:text-cheers-dark-brown transition-colors">
            {t('home.viewAll')} →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-cheers-cream/40" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-cheers-cream/60 rounded w-3/4" />
                  <div className="h-3 bg-cheers-cream/40 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-cheers-brown/50">
            <div className="text-5xl mb-3">🛍️</div>
            <p>{lang === 'zh' ? '商品即将上架，敬请期待' : 'Products coming soon, stay tuned!'}</p>
          </div>
        )}
      </section>
    </div>
  )
}
