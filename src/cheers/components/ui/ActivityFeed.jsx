import React, { useState, useEffect, useCallback } from 'react'
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

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
  const { t } = useLang()
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

  return (
    <div
      className={`fixed z-50 transition-all duration-500
        left-1/2 -translate-x-1/2 top-16 w-max max-w-[calc(100vw-2rem)]
        sm:translate-x-0 sm:left-4 sm:top-auto sm:bottom-4 sm:max-w-xs sm:w-auto
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 sm:translate-y-3'}`}
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="activity-feed-item bg-white/95 backdrop-blur-sm border border-cheers-cream rounded-full shadow-lg
          px-3 py-1.5 flex items-center gap-2
          sm:rounded-xl sm:px-4 sm:py-3 sm:gap-3">
          <span className="text-base sm:text-2xl flex-shrink-0">{icon}</span>
          <p className="text-[11px] sm:text-xs text-cheers-dark-brown leading-snug whitespace-nowrap">
            {action === 'watching' ? (
              <><span className="font-semibold">{watchingCount}</span> {t('activity.watching')} <span className="font-medium text-cheers-brown">{product.name?.zh || product.name}</span></>
            ) : (
              <><span className="font-semibold">{name}</span> {t(`activity.${action}`)} <span className="font-medium text-cheers-brown">{product.name?.zh || product.name}</span></>
            )}
            <span className="text-cheers-brown/50 ml-1">· {minutesAgo === 0 ? t('activity.justNow') : `${minutesAgo}${t('activity.minutesAgo')}`}</span>
          </p>
          {product.imageUrl && (
            <img src={product.imageUrl} alt="" className="w-6 h-6 sm:w-10 sm:h-10 rounded-full sm:rounded-lg object-cover flex-shrink-0" />
          )}
        </div>
      </Link>
    </div>
  )
}
