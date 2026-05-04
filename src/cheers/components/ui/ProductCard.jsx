import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useAuth } from '../../contexts/AuthContext'

export default function ProductCard({ product }) {
  const { t, lang } = useLang()
  const { addToCart } = useCart()
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist()
  const { user } = useAuth()

  const name = product.name?.[lang] || product.name?.zh || product.name || ''
  const wishlisted = isWishlisted(product.id)

  function handleWishlist(e) {
    e.preventDefault()
    if (!user) return
    wishlisted ? removeFromWishlist(product.id) : addToWishlist(product)
  }

  function handleAddToCart(e) {
    e.preventDefault()
    if (!product.inStock) return
    addToCart({ ...product, name: product.name?.[lang] || product.name?.zh || product.name || '' })
  }

  return (
    <Link to={`/products/${product.id}`} className="group block card hover:shadow-md transition-shadow duration-200">
      <div className="relative aspect-square overflow-hidden bg-cheers-cream/20">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
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
        {user && (
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            title={wishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
          >
            <span className={wishlisted ? 'text-cheers-red' : 'text-cheers-brown/40'}>
              {wishlisted ? '♥' : '♡'}
            </span>
          </button>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-cheers-dark-brown line-clamp-2 leading-snug">{name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-cheers-brown font-semibold text-sm">
            {t('common.rmPrefix')} {product.price?.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="text-xs btn-primary py-1 px-2 disabled:opacity-40"
          >
            {t('product.addToCart')}
          </button>
        </div>
      </div>
    </Link>
  )
}
