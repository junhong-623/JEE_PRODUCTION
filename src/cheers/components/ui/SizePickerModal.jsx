import React, { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { useCart } from '../../contexts/CartContext'
import { effectivePrice, formatPriceDisplay, getModifier1Options, getModifier2Options, colorPriceRange } from '../../lib/productPrice'
import { optimizeUrl } from '../../lib/cloudinary'

export default function SizePickerModal({ product, onClose }) {
  const { t, lang } = useLang()
  const { addToCart } = useCart()
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const mod1Options = getModifier1Options(product)   // colors or modifiers[0].options
  const hasMod1 = mod1Options.length > 0
  const mod1Name = product.modifiers?.[0]?.name || (lang === 'zh' ? '颜色' : 'Color')
  const mod2Name = product.modifiers?.[1]?.name || (lang === 'zh' ? '尺码' : 'Size')

  // Compute available sizes/mod2 options for the selected mod1
  const availableSizes = (() => {
    if (hasMod1 && selectedColor) {
      const mod2 = getModifier2Options(product, selectedColor.label)
      if (mod2.length > 0) return mod2
      // Backward compat: fall back to global sizes (old products without color.sizes)
      return (product.sizes || []).map(s => ({ label: typeof s === 'string' ? s : s.label }))
    }
    if (!hasMod1) {
      return (product.modifiers?.[1]?.options || product.sizes || []).map(s =>
        typeof s === 'string' ? { label: s } : s
      )
    }
    return []
  })()
  const hasSizes = availableSizes.length > 0

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const name = product.name?.[lang] || product.name?.zh || product.name || ''

  function handleAdd() {
    if (hasMod1 && !selectedColor) return
    if (hasSizes && !selectedSize) return
    addToCart({ ...product, name }, qty, selectedSize ?? undefined, selectedColor?.label ?? undefined)
    setAdded(true)
    setTimeout(() => { onClose() }, 900)
  }

  const missingVariant = (hasMod1 && !selectedColor)
    ? (lang === 'zh' ? `请先选择${mod1Name}` : `Select ${mod1Name} first`)
    : (hasSizes && !selectedSize)
    ? (lang === 'zh' ? `请先选择${mod2Name}` : `Select ${mod2Name} first`)
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-cheers-cream/60 flex items-center justify-center text-cheers-brown hover:bg-cheers-cream transition-colors z-10"
        >
          ✕
        </button>

        <div className="flex gap-4 p-4 border-b border-cheers-cream">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-cheers-cream/30 flex-shrink-0">
            {product.imageUrl
              ? <img src={optimizeUrl(product.imageUrl, { width: 200 })} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl">🛍</div>}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-medium text-cheers-dark-brown text-sm leading-snug line-clamp-2">{name}</p>
            <p className="text-cheers-brown font-bold mt-1">
              {(() => {
                if (!selectedColor?.label) return formatPriceDisplay(product, t('common.rmPrefix'))
                if (selectedSize) return `${t('common.rmPrefix')} ${effectivePrice(product, selectedColor.label, selectedSize).toFixed(2)}`
                const { min, max, isRange } = colorPriceRange(product, selectedColor.label)
                return isRange
                  ? `${t('common.rmPrefix')} ${min.toFixed(2)} - ${max.toFixed(2)}`
                  : `${t('common.rmPrefix')} ${min.toFixed(2)}`
              })()}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {hasMod1 && (
            <div>
              <p className="text-xs font-medium text-cheers-brown mb-2">
                {lang === 'zh' ? `选择${mod1Name}` : `Select ${mod1Name}`}
                {!selectedColor && <span className="text-red-400 ml-1">*</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {mod1Options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedColor(opt); setSelectedSize(null) }}
                    className={`min-w-[3rem] px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      selectedColor?.label === opt.label
                        ? 'border-cheers-brown bg-cheers-brown text-cheers-cream'
                        : 'border-cheers-cream text-cheers-dark-brown hover:border-cheers-brown/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasSizes && (
            <div>
              <p className="text-xs font-medium text-cheers-brown mb-2">
                {lang === 'zh' ? `选择${mod2Name}` : `Select ${mod2Name}`}
                {!selectedSize && <span className="text-red-400 ml-1">*</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(s => (
                  <button
                    key={s.label}
                    onClick={() => setSelectedSize(s.label)}
                    className={`min-w-[3rem] px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      selectedSize === s.label
                        ? 'border-cheers-brown bg-cheers-brown text-cheers-cream'
                        : 'border-cheers-cream text-cheers-dark-brown hover:border-cheers-brown/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          <button
            onClick={handleAdd}
            disabled={!!missingVariant || added}
            className={`btn-primary w-full py-3 transition-all ${added ? 'bg-green-600' : ''} disabled:opacity-40`}
          >
            {added
              ? (lang === 'zh' ? '已加入 ✓' : 'Added ✓')
              : missingVariant || t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
