import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useLang } from '../../contexts/LangContext'

export default function CartDrawer() {
  const { items, totalItems, subtotal, removeFromCart, updateQuantity } = useCart()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  if (totalItems === 0 && !isOpen) return null

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-cheers-brown text-cheers-cream shadow-xl flex items-center justify-center hover:bg-cheers-dark-brown transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel: full-screen on mobile, right sidebar on sm+ */}
          <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-96 z-50 flex flex-col bg-white shadow-2xl animate-slide-up sm:animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cheers-cream flex-shrink-0">
              <h2 className="font-serif text-lg text-cheers-dark-brown">
                {lang === 'zh' ? '购物车' : 'My Cart'}
                {totalItems > 0 && (
                  <span className="text-sm font-normal text-cheers-brown/50 ml-2">({totalItems})</span>
                )}
              </h2>
              <button onClick={() => setIsOpen(false)}
                className="text-cheers-brown/50 hover:text-cheers-brown text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-cheers-brown/40">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="text-sm">{lang === 'zh' ? '购物车是空的' : 'Your cart is empty'}</p>
                </div>
              ) : items.map(item => (
                <div key={`${item.productId}-${item.size ?? ''}`} className="flex gap-3">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-16 h-16 rounded-xl bg-cheers-cream/40 flex items-center justify-center text-2xl flex-shrink-0">🛍</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cheers-dark-brown truncate">{item.name}</p>
                    {item.size && <p className="text-xs text-cheers-brown/50 mt-0.5">{item.size}</p>}
                    <p className="text-sm font-semibold text-cheers-brown mt-1">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-cheers-cream rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
                          className="px-2.5 py-1 text-cheers-brown hover:bg-cheers-cream/50 transition-colors text-sm">−</button>
                        <span className="px-3 py-1 text-cheers-dark-brown text-sm min-w-[2rem] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                          className="px-2.5 py-1 text-cheers-brown hover:bg-cheers-cream/50 transition-colors text-sm">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId, item.size)}
                        className="text-xs text-red-400 hover:text-red-600 ml-auto">
                        {lang === 'zh' ? '删除' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-cheers-cream space-y-3 flex-shrink-0">
                <div className="flex justify-between text-sm">
                  <span className="text-cheers-brown/60">{lang === 'zh' ? '小计' : 'Subtotal'}</span>
                  <span className="font-bold text-cheers-dark-brown">RM {subtotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setIsOpen(false); navigate('/checkout') }}
                  className="w-full btn-primary py-3 text-base font-semibold">
                  {lang === 'zh' ? '去结账' : 'Checkout'}
                </button>
                <Link to="/cart" onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-cheers-brown/60 hover:text-cheers-brown transition-colors">
                  {lang === 'zh' ? '查看完整购物车 →' : 'View full cart →'}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
