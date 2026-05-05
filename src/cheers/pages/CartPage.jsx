import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

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
  const [confirmItem, setConfirmItem] = useState(null) // { productId, size, name }

  function handleCheckout() {
    if (!user) { navigate('/login', { state: { from: { pathname: '/checkout' } } }); return }
    navigate('/checkout')
  }

  function requestRemove(item) {
    setConfirmItem(item)
  }

  function confirmRemove() {
    if (confirmItem) removeFromCart(confirmItem.productId, confirmItem.size)
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {confirmItem && (
        <ConfirmModal
          itemName={confirmItem.name}
          lang={lang}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmItem(null)}
        />
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
          <div key={`${item.productId}-${item.size || ''}`} className="card p-4 flex items-center gap-4">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-cheers-cream/40 flex items-center justify-center text-2xl flex-shrink-0">🛍</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-cheers-dark-brown text-sm line-clamp-2">{item.name}</p>
              {item.size && <p className="text-xs text-cheers-brown/60 mt-0.5">{lang === 'zh' ? '尺码' : 'Size'}: {item.size}</p>}
              <p className="text-cheers-brown text-sm mt-0.5">{t('common.rmPrefix')} {item.price?.toFixed(2)}</p>
            </div>
            <div className="flex items-center border border-cheers-cream rounded-lg overflow-hidden flex-shrink-0">
              <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
                className="px-2.5 py-1.5 text-cheers-brown hover:bg-cheers-cream/50 text-sm">−</button>
              <span className="px-3 py-1.5 text-cheers-dark-brown text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                className="px-2.5 py-1.5 text-cheers-brown hover:bg-cheers-cream/50 text-sm">+</button>
            </div>
            <div className="text-right flex-shrink-0 min-w-[80px]">
              <p className="font-semibold text-cheers-dark-brown text-sm">{t('common.rmPrefix')} {(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => requestRemove(item)}
                className="text-xs text-red-400 hover:text-red-600 mt-0.5">{t('cart.remove')}</button>
            </div>
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
