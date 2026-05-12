import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { optimizeUrl } from '../lib/cloudinary'
import CartItemEditModal from '../components/ui/CartItemEditModal'
import { trackViewCart } from '../lib/tracking'

function ConfirmModal({ itemName, onConfirm, onCancel, lang }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 animate-slide-up">
        <p className="font-medium text-cheers-dark-brown mb-1">
          {lang === 'zh' ? '移除商品' : 'Remove Item'}
        </p>
        <p className="text-sm text-cheers-brown/70 mb-5">
          {lang === 'zh'
            ? `确认将「${itemName}」从购物车移除？`
            : `Remove "${itemName}" from your cart?`}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            {lang === 'zh' ? '移除' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { t, lang } = useLang()
  const { items, subtotal, removeFromCart, updateQuantity } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [confirmItem, setConfirmItem] = useState(null)
  const [editItem, setEditItem] = useState(null)

  // 进入购物车页 → GA4 埋点（仅当有商品才发，避免空车噪音）
  useEffect(() => {
    if (items.length > 0) trackViewCart(items, subtotal)
    // 仅在 mount 时触发一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCheckout() {
    if (!user) { navigate('/login', { state: { from: { pathname: '/checkout' } } }); return }
    navigate('/checkout')
  }

  function confirmRemove() {
    if (confirmItem) removeFromCart(confirmItem.productId, confirmItem.size, confirmItem.color)
    setConfirmItem(null)
  }

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="font-serif text-2xl text-cheers-dark-brown mb-2">{t('cart.empty')}</h2>
      <p className="text-cheers-brown/60 mb-6">{t('cart.emptyHint')}</p>
      <Link to="/products" className="btn-primary">{t('cart.continueShopping')}</Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {confirmItem && (
        <ConfirmModal
          itemName={confirmItem.name}
          lang={lang}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmItem(null)}
        />
      )}
      {editItem && (
        <CartItemEditModal item={editItem} onClose={() => setEditItem(null)} />
      )}

      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('cart.title')}</h1>

      {!user && (
        <div className="bg-cheers-cream/40 border border-cheers-cream rounded-xl px-4 py-3 mb-4 text-sm text-cheers-brown flex items-center gap-2">
          <span>ℹ️</span>
          <span>{t('cart.loginToSync')} </span>
          <Link to="/login" className="font-medium underline">{t('nav.login')}</Link>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={`${item.productId}-${item.size || ''}-${item.color || ''}`}
            className="flex items-center gap-3 py-3 border-b border-cheers-cream last:border-0">

            {/* Clickable image */}
            <Link to={`/products/${item.productId}`} className="flex-shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-cheers-cream/40">
                {item.imageUrl
                  ? <img src={optimizeUrl(item.imageUrl, { width: 128 })} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🛍</div>}
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link to={`/products/${item.productId}`}>
                <p className="text-sm font-medium text-cheers-dark-brown truncate">{item.name}</p>
              </Link>
              {(item.color || item.size) && (
                <p className="text-xs text-cheers-brown/50 mt-0.5">{[item.color, item.size].filter(Boolean).join(' · ')}</p>
              )}
              {/* Qty row */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center border border-cheers-cream rounded-lg overflow-hidden">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size, item.color)}
                    className="px-2 py-0.5 text-cheers-brown hover:bg-cheers-cream/50 text-sm leading-none">−</button>
                  <span className="px-2 py-0.5 text-cheers-dark-brown text-sm font-medium min-w-[1.5rem] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size, item.color)}
                    className="px-2 py-0.5 text-cheers-brown hover:bg-cheers-cream/50 text-sm leading-none">+</button>
                </div>
                {/* Edit variant button */}
                <button onClick={() => setEditItem(item)}
                  className="text-xs text-cheers-brown/50 hover:text-cheers-brown transition-colors px-1.5 py-0.5 rounded border border-cheers-cream hover:border-cheers-brown/40"
                  title={lang === 'zh' ? '修改颜色/尺寸' : 'Change color/size'}>
                  ✎
                </button>
                <button onClick={() => setConfirmItem(item)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors px-1">
                  {lang === 'zh' ? '删除' : 'Remove'}
                </button>
              </div>
            </div>

            {/* Total price */}
            <p className="text-sm font-semibold text-cheers-dark-brown flex-shrink-0">
              {t('common.rmPrefix')} {(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex justify-between text-sm text-cheers-brown/70 mb-2">
          <span>{t('cart.subtotal')}</span>
          <span>{t('common.rmPrefix')} {subtotal.toFixed(2)}</span>
        </div>
        <div className="border-t border-cheers-cream pt-3 flex justify-between font-semibold text-cheers-dark-brown">
          <span>{t('cart.total')}</span>
          <span>{t('common.rmPrefix')} {subtotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-cheers-brown/50 mt-1">{lang === 'zh' ? '（邮费在结账时计算）' : '(Shipping calculated at checkout)'}</p>
        <button onClick={handleCheckout} className="btn-primary w-full py-3 mt-4">
          {t('cart.checkout')}
        </button>
        <Link to="/products" className="block text-center text-sm text-cheers-brown/60 hover:text-cheers-brown mt-3">
          {t('cart.continueShopping')}
        </Link>
      </div>
    </div>
  )
}
