import React, { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { useCart } from '../../contexts/CartContext'

export default function SizePickerModal({ product, onClose }) {
  const { t, lang } = useLang()
  const { addToCart } = useCart()
  const [selectedSize, setSelectedSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  // Close on backdrop click or Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const name = product.name?.[lang] || product.name?.zh || product.name || ''

  function handleAdd() {
    if (!selectedSize) return
    addToCart({ ...product, name }, qty, selectedSize)
    setAdded(true)
    setTimeout(() => { onClose() }, 900)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-cheers-cream/60 flex items-center justify-center text-cheers-brown hover:bg-cheers-cream transition-colors z-10"
        >
          ✕
        </button>

        <div className="flex gap-4 p-4 border-b border-cheers-cream">
          {/* Thumbnail */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-cheers-cream/30 flex-shrink-0">
            {product.imageUrl
              ? <img src={product.imageUrl} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl">🛍</div>}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-medium text-cheers-dark-brown text-sm leading-snug line-clamp-2">{name}</p>
            <p className="text-cheers-brown font-bold mt-1">{t('common.rmPrefix')} {product.price?.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Size grid */}
          <div>
            <p className="text-xs font-medium text-cheers-brown mb-2">
              {lang === 'zh' ? '选择尺码' : 'Select Size'}
              {!selectedSize && <span className="text-red-400 ml-1">*</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {(product.sizes || []).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[3rem] px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
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

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-cheers-brown">{t('cart.quantity')}</p>
            <div className="flex items-center border border-cheers-cream rounded-lg overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-cheers-brown hover:bg-cheers-cream/50 transition-colors text-sm">−</button>
              <span className="px-4 py-1.5 text-cheers-dark-brown font-medium min-w-[2.5rem] text-center text-sm">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="px-3 py-1.5 text-cheers-brown hover:bg-cheers-cream/50 transition-colors text-sm">+</button>
            </div>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!selectedSize || added}
            className={`btn-primary w-full py-3 transition-all ${added ? 'bg-green-600' : ''} disabled:opacity-40`}
          >
            {added
              ? (lang === 'zh' ? '已加入 ✓' : 'Added ✓')
              : !selectedSize
                ? (lang === 'zh' ? '请先选择尺码' : 'Select a size first')
                : t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
