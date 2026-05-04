import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'

export default function WishlistPage() {
  const { t, lang } = useLang()
  const { items, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">♡</div>
      <h2 className="font-serif text-2xl text-cheers-dark-brown mb-2">{t('wishlist.empty')}</h2>
      <p className="text-cheers-brown/60 mb-6">{t('wishlist.emptyHint')}</p>
      <Link to="/products" className="btn-primary">{lang === 'zh' ? '去逛逛' : 'Browse Products'}</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('wishlist.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.productId} className="card p-4 flex items-center gap-4">
            <Link to={`/products/${item.productId}`} className="flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-cheers-cream/40 flex items-center justify-center text-2xl">🛍</div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/products/${item.productId}`}>
                <p className="font-medium text-cheers-dark-brown text-sm line-clamp-2 hover:text-cheers-brown">{item.name}</p>
              </Link>
              <p className="text-cheers-brown text-sm mt-0.5">{t('common.rmPrefix')} {item.price?.toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => addToCart(item)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                {t('wishlist.moveToCart')}
              </button>
              <button
                onClick={() => removeFromWishlist(item.productId)}
                className="text-xs text-red-400 hover:text-red-600 text-center"
              >
                {t('wishlist.remove')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
