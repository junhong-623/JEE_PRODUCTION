import React, { useEffect, useState } from 'react'
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
  const [added, setAdded] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'cheers_products', id))
      .then(snap => { if (snap.exists()) setProduct({ id: snap.id, ...snap.data() }) })
      .finally(() => setLoading(false))
  }, [id])

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
  const wishlisted = isWishlisted(product.id)

  function handleAddToCart() {
    addToCart({ ...product, name }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleWishlist() {
    wishlisted ? removeFromWishlist(product.id) : addToWishlist({ ...product, name })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/products" className="text-sm text-cheers-brown/60 hover:text-cheers-brown mb-6 inline-flex items-center gap-1">
        ← {t('common.back')}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-cheers-cream/20">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🛍</div>
          )}
        </div>

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

          {description && (
            <div className="prose prose-sm text-cheers-dark-brown/70 mb-6 leading-relaxed whitespace-pre-line">
              {description}
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
              className={`btn-primary flex-1 py-3 transition-all ${added ? 'bg-green-600' : ''}`}
            >
              {added ? (lang === 'zh' ? '已加入 ✓' : 'Added ✓') : t('product.addToCart')}
            </button>
            {user && (
              <button
                onClick={handleWishlist}
                className="btn-secondary px-4 py-3 text-xl"
                title={wishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
              >
                {wishlisted ? '♥' : '♡'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
