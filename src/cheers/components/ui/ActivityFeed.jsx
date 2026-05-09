import React, { useState, useEffect, useCallback } from 'react'
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { optimizeUrl } from '../../lib/cloudinary'

const db = getFirestore(app)

const NAMES = [
  'W********', 'X*********', 'A*****', 'N*******', 'C***', 'S********',
  'H*****', 'R********', 'J*****', 'A**', 'K***', 'S********',
  'L*******', 'F******', 'Z********', 'H*******', 'X******', 'D*****',
  'M**', 'S****', 'J*********', 'A*******', 'S***', 'N*****',
]

const ACTIONS = ['addedToCart', 'purchased', 'watching']

function randomName() { return NAMES[Math.floor(Math.random() * NAMES.length)] }
function randomAction() { return ACTIONS[Math.floor(Math.random() * ACTIONS.length)] }

export default function ActivityFeed() {
  const { t, lang } = useLang()
  const [enabled, setEnabled] = useState(false)
  const [products, setProducts] = useState([])
  const [current, setCurrent] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const settingsSnap = await getDocs(query(collection(db, 'cheers_settings')))
        const settings = {}
        settingsSnap.forEach(d => Object.assign(settings, d.data()))
        if (!settings.activityFeedEnabled) return
        if (!cancelled) setEnabled(true)

        const activeTrip = settings.activeTripId
        if (!activeTrip) return

        const snap = await getDocs(
          query(collection(db, 'cheers_products'),
            where('tripId', '==', activeTrip),
            where('inStock', '==', true),
            limit(30))
        )
        if (!cancelled) {
          setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [])

  const showNext = useCallback(() => {
    if (!products.length) return
    const product = products[Math.floor(Math.random() * products.length)]
    const action = randomAction()
    const name = randomName()
    const minutesAgo = Math.floor(Math.random() * 10)

    setCurrent({ product, action, name, minutesAgo })
    setVisible(true)

    setTimeout(() => setVisible(false), 4000)
  }, [products])

  useEffect(() => {
    if (!enabled || !products.length) return
    const initial = setTimeout(showNext, 3000)
    const interval = setInterval(showNext, 8000 + Math.random() * 4000)
    return () => { clearTimeout(initial); clearInterval(interval) }
  }, [enabled, products, showNext])

  if (!enabled || !current || !visible) return null

  const { product, action, name, minutesAgo } = current

  const icon = action === 'addedToCart' ? '🛒'
    : action === 'purchased' ? '✅' : '👀'

  const watchingCount = Math.floor(Math.random() * 12) + 2

  function dismiss(e) { e.preventDefault(); e.stopPropagation(); setVisible(false) }

  return (
    <div
      className={`fixed z-[60] transition-all duration-500 ease-out
        left-1/2 -translate-x-1/2 top-3 w-72 max-w-[calc(100vw-3rem)]
        sm:translate-x-0 sm:left-4 sm:top-auto sm:bottom-4 sm:max-w-xs sm:w-auto
        ${visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-[120%] sm:opacity-0 sm:translate-y-3 sm:-translate-y-0'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="activity-feed-item bg-white/95 backdrop-blur-md border border-black/5 shadow-xl
        rounded-2xl px-4 py-3 flex items-center gap-3 relative
        sm:bg-white/95 sm:backdrop-blur-sm sm:border-cheers-cream sm:rounded-xl sm:shadow-lg sm:px-4 sm:py-3">

        <Link to={`/products/${product.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="leading-snug min-w-0 flex-1">
            <p className="text-xs sm:text-xs text-cheers-dark-brown truncate">
              {(() => {
                const productName = product.name?.[lang] || product.name?.zh || product.name?.en || product.name || ''
                return action === 'watching' ? (
                  <><span className="font-semibold">{watchingCount}</span> {t('activity.watching')} <span className="font-serif font-medium text-cheers-brown">{productName}</span></>
                ) : (
                  <><span className="font-semibold">{name}</span> {t(`activity.${action}`)} <span className="font-serif font-medium text-cheers-brown">{productName}</span></>
                )
              })()}
            </p>
            <p className="text-[11px] sm:text-[11px] text-cheers-brown/40 mt-0.5">
              {minutesAgo === 0 ? t('activity.justNow') : `${minutesAgo}${t('activity.minutesAgo')}`}
            </p>
          </div>
          {product.imageUrl && (
            <img src={optimizeUrl(product.imageUrl, { width: 80 })} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          )}
        </Link>

        {/* Mobile: inline X */}
        <button onClick={dismiss}
          className="sm:hidden opacity-30 hover:opacity-70 text-lg leading-none flex-shrink-0 px-1">×</button>

        {/* Desktop: corner X */}
        <button onClick={dismiss}
          className="hidden sm:flex absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-white border border-cheers-cream shadow-sm items-center justify-center opacity-40 hover:opacity-90 text-xs transition-opacity">×</button>
      </div>
    </div>
  )
}
