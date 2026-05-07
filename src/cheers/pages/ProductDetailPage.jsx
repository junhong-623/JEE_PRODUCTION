import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'

const db = getFirestore(app)

export default function ProductDetailPage() {
  const { id } = useParams()
  const { t, lang } = useLang()
  const { addToCart } = useCart()
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [sizeError, setSizeError] = useState(false)
  const [selectedColor, setSelectedColor] = useState(null)
  const [colorError, setColorError] = useState(false)
  const [added, setAdded] = useState(false)
  const [selectedImg, setSelectedImg] = useState(0)
  const [heartAnim, setHeartAnim] = useState(false)
  const [cartAnim, setCartAnim] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomIdx, setZoomIdx] = useState(0)
  const touchStartX = useRef(null)
  const zoomTouchStartX = useRef(null)
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const skipTrackEffect = useRef(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_products', id))
      .then(snap => { if (snap.exists()) setProduct({ id: snap.id, ...snap.data() }) })
      .finally(() => setLoading(false))
  }, [id])

  // Sync carousel track when selectedImg changes (e.g. thumbnail click)
  useEffect(() => {
    if (!trackRef.current || !containerRef.current) return
    if (skipTrackEffect.current) { skipTrackEffect.current = false; return }
    const w = containerRef.current.clientWidth
    if (!w) return
    trackRef.current.style.transition = 'transform 0.35s ease'
    trackRef.current.style.transform = `translateX(${-selectedImg * w}px)`
  }, [selectedImg])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!product) return (
    <div className="text-center py-20 text-cheers-brown/50">
      <p>{lang === 'zh' ? '商品不存在' : 'Product not found'}</p>
      <Link to="/products" className="btn-primary mt-4 inline-block">{lang === 'zh' ? '返回目录' : 'Back to Products'}</Link>
    </div>
  )

  const name = product.name?.[lang] || product.name?.zh || ''
  const description = product.description?.[lang] || product.description?.zh || ''
  const blocks = product.descriptionBlocks || []
  const imgs = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []

  function getYouTubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/\s]+)/)
    return m?.[1] || null
  }

  function renderBlock(block, idx) {
    if (block.type === 'text') {
      const text = block.content?.[lang] || block.content?.zh || ''
      if (!text) return null
      return <p key={idx} className="text-cheers-dark-brown/70 leading-relaxed whitespace-pre-line">{text}</p>
    }
    if (block.type === 'image') {
      if (!block.url) return null
      return <img key={idx} src={block.url} alt="" className="w-full rounded-xl object-cover" />
    }
    if (block.type === 'video') {
      if (!block.url) return null
      const ytId = getYouTubeId(block.url)
      if (ytId) {
        return (
          <div key={idx} className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title="video" />
          </div>
        )
      }
      return <video key={idx} src={block.url} controls className="w-full rounded-xl" />
    }
    return null
  }

  const wishlisted = isWishlisted(product.id)
  const hasSizes = product?.sizes?.length > 0
  const hasColors = product?.colors?.length > 0

  function handleSelectColor(color) {
    setSelectedColor(color)
    setColorError(false)
    if (!color.imageUrl) return
    const idx = imgs.indexOf(color.imageUrl)
    if (idx !== -1) setSelectedImg(idx)
  }

  function handleAddToCart() {
    if (hasColors && !selectedColor) { setColorError(true); return }
    if (hasSizes && !selectedSize) { setSizeError(true); return }
    addToCart({ ...product, name }, qty, selectedSize ?? undefined, selectedColor?.label ?? undefined)
    setAdded(true)
    setCartAnim(true)
    setTimeout(() => setAdded(false), 2000)
    setTimeout(() => setCartAnim(false), 400)
  }

  function handleWishlist() {
    wishlisted ? removeFromWishlist(product.id) : addToWishlist({ ...product, name })
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 400)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/products" className="text-sm text-cheers-brown/60 hover:text-cheers-brown mb-6 inline-flex items-center gap-1">
        ← {t('common.back')}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        {/* Images — swipe carousel */}
        {(() => {
          const n = imgs.length

          function onTouchStart(e) {
            if (n <= 1) return
            touchStartX.current = e.touches[0].clientX
            if (trackRef.current) trackRef.current.style.transition = 'none'
          }

          function onTouchMove(e) {
            if (touchStartX.current === null || !trackRef.current || !containerRef.current || n <= 1) return
            const delta = e.touches[0].clientX - touchStartX.current
            const w = containerRef.current.clientWidth
            // Rubber-band resistance at first/last image
            const atStart = selectedImg === 0 && delta > 0
            const atEnd = selectedImg === n - 1 && delta < 0
            const offset = (atStart || atEnd) ? delta * 0.2 : delta
            trackRef.current.style.transform = `translateX(${-selectedImg * w + offset}px)`
          }

          function onTouchEnd(e) {
            if (touchStartX.current === null || !containerRef.current || n <= 1) return
            const delta = e.changedTouches[0].clientX - touchStartX.current
            const w = containerRef.current.clientWidth
            let newIdx = selectedImg
            if (delta < -50 && selectedImg < n - 1) newIdx = selectedImg + 1
            else if (delta > 50 && selectedImg > 0) newIdx = selectedImg - 1
            // Animate to final position directly — skip the useEffect to avoid double-fire
            if (trackRef.current) {
              trackRef.current.style.transition = 'transform 0.35s ease'
              trackRef.current.style.transform = `translateX(${-newIdx * w}px)`
            }
            skipTrackEffect.current = true
            setSelectedImg(newIdx)
            touchStartX.current = null
          }

          return (
            <div className="flex flex-col gap-3 min-w-0">
              <div
                ref={containerRef}
                className="aspect-square rounded-2xl overflow-hidden bg-cheers-cream/20 select-none cursor-zoom-in"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => { if (n > 0) { setZoomIdx(selectedImg); setZoomOpen(true) } }}
              >
                {n === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-8xl">🛍</div>
                ) : n === 1 ? (
                  <img src={imgs[0]} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    ref={trackRef}
                    className="flex h-full"
                    style={{ width: `${n * 100}%` }}
                  >
                    {imgs.map((url, i) => (
                      <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / n}%` }}>
                        <img src={url} alt={name} className="w-full h-full object-cover" draggable={false} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {n > 1 && (
                <div className="overflow-hidden w-full">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {imgs.map((url, i) => (
                      <button key={i} onClick={() => setSelectedImg(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${selectedImg === i ? 'border-cheers-brown' : 'border-transparent'}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Info */}
        <div className="flex flex-col">
          {!product.inStock && (
            <span className="inline-flex items-center self-start bg-cheers-dark-brown/10 text-cheers-dark-brown text-xs px-3 py-1 rounded-full mb-3">
              {t('product.outOfStock')}
            </span>
          )}
          <h1 className="font-serif text-2xl md:text-3xl text-cheers-dark-brown leading-tight mb-3">{name}</h1>
          <p className="text-3xl font-bold text-cheers-brown mb-4">
            {t('common.rmPrefix')} {product.price?.toFixed(2)}
          </p>

          {hasColors && product.inStock && (
            <div className="mb-4">
              <p className="label mb-2">
                {lang === 'zh' ? '选择颜色' : 'Select Color'}
                {colorError && <span className="text-red-400 ml-2 text-xs">{lang === 'zh' ? '请选择颜色' : 'Please select a color'}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    className={`min-w-[3.5rem] px-4 py-2 rounded-lg border font-medium transition-colors ${
                      selectedColor?.label === color.label
                        ? 'border-cheers-brown bg-cheers-brown text-cheers-cream'
                        : 'border-cheers-cream text-cheers-dark-brown hover:border-cheers-brown/50'
                    }`}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasSizes && product.inStock && (
            <div className="mb-4">
              <p className="label mb-2">
                {lang === 'zh' ? '选择尺码' : 'Select Size'}
                {sizeError && <span className="text-red-400 ml-2 text-xs">{lang === 'zh' ? '请选择尺码' : 'Please select a size'}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false) }}
                    className={`min-w-[3.5rem] px-4 py-2 rounded-lg border font-medium transition-colors ${
                      selectedSize === size
                        ? 'border-cheers-brown bg-cheers-brown text-cheers-cream'
                        : 'border-cheers-cream text-cheers-dark-brown hover:border-cheers-brown/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.inStock && (
            <div className="flex items-center gap-3 mb-4">
              <label className="label mb-0">{t('cart.quantity')}</label>
              <div className="flex items-center border border-cheers-cream rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-cheers-brown hover:bg-cheers-cream/50 transition-colors">−</button>
                <span className="px-4 py-2 text-cheers-dark-brown font-medium min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="px-3 py-2 text-cheers-brown hover:bg-cheers-cream/50 transition-colors">+</button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`btn-primary flex-1 py-3 ${added ? 'bg-green-600' : ''} ${cartAnim ? 'animate-[cartBounce_0.4s_ease]' : ''}`}
            >
              {added ? (lang === 'zh' ? '已加入 ✓' : 'Added ✓') : t('product.addToCart')}
            </button>
            {user && (
              <button
                onClick={handleWishlist}
                className={`btn-secondary px-4 py-3 text-xl ${heartAnim ? 'animate-[heartPop_0.4s_ease]' : ''}`}
                title={wishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
              >
                {wishlisted ? '♥' : '♡'}
              </button>
            )}
          </div>

          {(description || blocks.length > 0) && (
            <div className="space-y-4 mt-6 pt-6 border-t border-cheers-cream">
              {description && (
                <p className="prose prose-sm text-cheers-dark-brown/70 leading-relaxed whitespace-pre-line">{description}</p>
              )}
              {blocks.map((b, i) => renderBlock(b, i))}
            </div>
          )}
        </div>
      </div>

      {zoomOpen && imgs.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center select-none"
          onClick={() => setZoomOpen(false)}
          onTouchStart={e => {
            zoomTouchStartX.current = e.touches.length === 1 ? e.touches[0].clientX : null
          }}
          onTouchEnd={e => {
            if (zoomTouchStartX.current === null) return
            const delta = e.changedTouches[0].clientX - zoomTouchStartX.current
            zoomTouchStartX.current = null
            if (delta < -50 && zoomIdx < imgs.length - 1) {
              const next = zoomIdx + 1; setZoomIdx(next); setSelectedImg(next)
            } else if (delta > 50 && zoomIdx > 0) {
              const next = zoomIdx - 1; setZoomIdx(next); setSelectedImg(next)
            }
          }}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center hover:text-white/70 z-10"
            onClick={() => setZoomOpen(false)}
          >×</button>
          {imgs.length > 1 && zoomIdx > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-4xl w-10 h-10 flex items-center justify-center hover:text-white/70 z-10"
              onClick={e => { e.stopPropagation(); const next = zoomIdx - 1; setZoomIdx(next); setSelectedImg(next) }}
            >‹</button>
          )}
          {imgs.length > 1 && zoomIdx < imgs.length - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-4xl w-10 h-10 flex items-center justify-center hover:text-white/70 z-10"
              onClick={e => { e.stopPropagation(); const next = zoomIdx + 1; setZoomIdx(next); setSelectedImg(next) }}
            >›</button>
          )}
          <img
            src={imgs[zoomIdx]}
            alt={name}
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
          {imgs.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === zoomIdx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
