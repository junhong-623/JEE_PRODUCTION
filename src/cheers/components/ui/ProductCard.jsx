import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useAuth } from '../../contexts/AuthContext'
import SizePickerModal from './SizePickerModal'
import { optimizeUrl } from '../../lib/cloudinary'

export default function ProductCard({ product }) {
  const { t, lang } = useLang()
  const { addToCart } = useCart()
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist()
  const { user } = useAuth()

  const [sizeModal, setSizeModal] = useState(false)
  const [added, setAdded] = useState(false)
  const [cartAnim, setCartAnim] = useState(false)
  const [heartAnim, setHeartAnim] = useState(false)
  const [loginHint, setLoginHint] = useState(false)
  const nameRef = useRef(null)
  const [nameOverflows, setNameOverflows] = useState(false)

  const name = product.name?.[lang] || product.name?.zh || product.name || ''
  const wishlisted = isWishlisted(product.id)
  const hasSizes = product.sizes?.length > 0
  const hasColors = product.colors?.length > 0

  useEffect(() => {
    const el = nameRef.current
    if (el) setNameOverflows(el.scrollWidth > el.clientWidth)
  }, [name])

  function handleWishlist(e) {
    e.preventDefault()
    if (!user) {
      setLoginHint(true)
      setTimeout(() => setLoginHint(false), 2000)
      return
    }
    wishlisted ? removeFromWishlist(product.id) : addToWishlist(product)
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 400)
  }

  function handleAddToCart(e) {
    e.preventDefault()
    if (!product.inStock) return
    if (hasSizes || hasColors) { setSizeModal(true); return }
    addToCart({ ...product, name: product.name?.[lang] || product.name?.zh || product.name || '' })
    setAdded(true)
    setCartAnim(true)
    setTimeout(() => setAdded(false), 1500)
    setTimeout(() => setCartAnim(false), 400)
  }

  return (
    <>
      {sizeModal && <SizePickerModal product={product} onClose={() => setSizeModal(false)} />}
      <Link to={`/products/${product.id}`} className="group block card hover:shadow-md transition-shadow duration-200">
        <div className="relative aspect-square overflow-hidden bg-cheers-cream/20">
          {product.imageUrl ? (
            <img
              src={optimizeUrl(product.imageUrl, { width: 400 })}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cheers-brown/20 text-5xl">🛍</div>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 bg-cheers-dark-brown/40 flex items-center justify-center">
              <span className="bg-cheers-dark-brown text-cheers-cream text-xs px-3 py-1 rounded-full font-medium">
                {t('product.outOfStock')}
              </span>
            </div>
          )}

          {product.featured && (
            <span className="absolute top-2 left-2 bg-cheers-brown text-cheers-cream text-[10px] font-medium px-2 py-0.5 rounded-full">
              ⭐ {lang === 'zh' ? '精选' : 'Featured'}
            </span>
          )}

          <div className="absolute top-2 right-2">
            <button
              onClick={handleWishlist}
              className={`w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform ${heartAnim ? 'animate-[heartPop_0.4s_ease]' : ''}`}
              title={wishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
            >
              <span className={wishlisted && user ? 'text-cheers-red' : 'text-cheers-brown/40'}>
                {wishlisted && user ? '♥' : '♡'}
              </span>
            </button>
            {loginHint && (
              <span className="absolute top-9 right-0 bg-cheers-dark-brown text-cheers-cream text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow z-10">
                {lang === 'zh' ? '请先登录' : 'Please log in'}
              </span>
            )}
          </div>
        </div>

        <div className="p-3">
          <div className="overflow-hidden">
            {nameOverflows ? (
              <div
                className="animate-marquee inline-flex whitespace-nowrap text-sm font-medium text-cheers-dark-brown leading-snug"
                style={{ animationDuration: `${Math.max(6, name.length * 0.35)}s` }}
              >
                <span className="pr-10">{name}</span>
                <span className="pr-10" aria-hidden="true">{name}</span>
              </div>
            ) : (
              <h3 ref={nameRef} className="text-sm font-medium text-cheers-dark-brown truncate leading-snug">
                {name}
              </h3>
            )}
          </div>

          <div className="mt-2">
            <span className="text-cheers-brown font-semibold text-sm">
              {t('common.rmPrefix')} {product.price?.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`mt-1.5 w-full text-xs btn-primary py-1.5 disabled:opacity-40 ${added ? 'bg-green-600' : ''} ${cartAnim ? 'animate-[cartBounce_0.4s_ease]' : ''}`}
          >
            {added ? (lang === 'zh' ? '已加入 ✓' : 'Added ✓') : t('product.addToCart')}
          </button>
        </div>
      </Link>
    </>
  )
}
