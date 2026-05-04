import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import ProductCard from '../components/ui/ProductCard'

const db = getFirestore(app)

export default function HomePage() {
  const { t, lang } = useLang()
  const [activeTrip, setActiveTrip] = useState(null)
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const settingsDoc = await getDoc(doc(db, 'cheers_settings', 'global'))
        const settings = settingsDoc.exists() ? settingsDoc.data() : {}
        const activeTripId = settings.activeTripId

        if (activeTripId) {
          const tripDoc = await getDoc(doc(db, 'cheers_trips', activeTripId))
          if (tripDoc.exists()) setActiveTrip({ id: tripDoc.id, ...tripDoc.data() })

          const snap = await getDocs(
            query(collection(db, 'cheers_products'),
              where('tripId', '==', activeTripId),
              where('featured', '==', true),
              where('inStock', '==', true),
              limit(8))
          )
          setFeatured(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cheers-cream via-cheers-light-cream to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-4">🗾</div>
          <h1 className="font-serif text-4xl md:text-5xl text-cheers-dark-brown font-bold mb-4 leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-cheers-brown/70 text-lg mb-8 max-w-xl mx-auto">
            {t('home.hero.subtitle')}
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
            {t('home.hero.cta')}
          </Link>
        </div>

        {/* Decorative Japanese circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cheers-cream/40 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-cheers-cream/30 blur-2xl" />
      </section>

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
