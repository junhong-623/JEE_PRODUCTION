import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getFirestore, collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { optimizeUrl } from '../../lib/cloudinary'
import { formatPriceDisplay } from '../../lib/productPrice'
import { trackSearch } from '../../lib/tracking'

const db = getFirestore(app)

export default function SearchOverlay({ onClose }) {
  const { lang } = useLang()
  const [q, setQ] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  // Load products once on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const settingsSnap = await getDoc(doc(db, 'cheers_settings', 'global'))
        const tripId = settingsSnap.data()?.activeTripId
        if (!tripId) { setLoading(false); return }
        const snap = await getDocs(query(collection(db, 'cheers_products'), where('tripId', '==', tripId), where('inStock', '==', true)))
        if (!cancelled) setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Auto focus input
  useEffect(() => { inputRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = q.trim().length < 1 ? [] : products.filter(p => {
    const sq = q.toLowerCase()
    const name = (p.name?.[lang] || p.name?.zh || '').toLowerCase()
    const colors = (p.colors || []).map(c => c.label.toLowerCase())
    const sizes = [
      ...(p.sizes || []),
      ...(p.colors || []).flatMap(c => (c.sizes || []).map(s => s.label))
    ].map(s => String(s).toLowerCase())
    return name.includes(sq) || colors.some(c => c.includes(sq)) || sizes.some(s => s.includes(sq))
  }).slice(0, 8)

  // 搜索埋点：用户停止打字 1 秒后记一次
  const trimmed = q.trim()
  // 过滤掉只增删字符的过渡态：当 q 稳定 1 秒 + 长度合理时才 log
  useEffect(() => {
    if (loading || trimmed.length < 2) return
    const t = setTimeout(() => {
      // 用 filter 的完整结果数（不是 slice 后的 8）
      const fullCount = products.filter(p => {
        const sq = trimmed.toLowerCase()
        const name = (p.name?.[lang] || p.name?.zh || '').toLowerCase()
        const colors = (p.colors || []).map(c => c.label.toLowerCase())
        const sizes = [
          ...(p.sizes || []),
          ...(p.colors || []).flatMap(c => (c.sizes || []).map(s => s.label))
        ].map(s => String(s).toLowerCase())
        return name.includes(sq) || colors.some(c => c.includes(sq)) || sizes.some(s => s.includes(sq))
      }).length
      trackSearch(trimmed, fullCount, lang)
    }, 1000)
    return () => clearTimeout(t)
  }, [trimmed, loading, lang, products])

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 bg-cheers-light-cream/98 backdrop-blur-md shadow-2xl border-b border-cheers-cream animate-slide-down">
        <div className="max-w-7xl mx-auto px-5 py-4">
          {/* Search input */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cheers-brown/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={lang === 'zh' ? '搜索商品、颜色、尺寸…' : 'Search products, colors, sizes…'}
              className="flex-1 bg-transparent outline-none text-cheers-dark-brown placeholder-cheers-brown/40 text-base"
            />
            <button onClick={onClose} className="text-cheers-brown/50 hover:text-cheers-brown transition-colors text-xl leading-none px-1">✕</button>
          </div>

          {/* Results */}
          {q.trim().length > 0 && (
            <div className="mt-3 pb-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <p className="text-sm text-cheers-brown/40 py-4 text-center">{lang === 'zh' ? '加载中…' : 'Loading…'}</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-cheers-brown/40 py-4 text-center">{lang === 'zh' ? '没有找到相关商品' : 'No products found'}</p>
              ) : results.map(p => {
                const name = p.name?.[lang] || p.name?.zh || ''
                const img = p.imageUrls?.[0] || p.imageUrl
                return (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-cheers-cream/60 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-cheers-cream flex-shrink-0">
                      {img
                        ? <img src={optimizeUrl(img, { width: 96 })} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🛍</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-cheers-dark-brown truncate">{name}</p>
                      <p className="text-xs text-cheers-brown/60">{formatPriceDisplay(p, lang === 'zh' ? 'RM' : 'RM')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
