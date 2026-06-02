import React, { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { useCart } from '../../contexts/CartContext'
import { effectivePriceFromMods, hasAdditiveModifiers, formatPriceDisplay, priceRange } from '../../lib/productPrice'
import { optimizeUrl } from '../../lib/cloudinary'

export default function SizePickerModal({ product, onClose }) {
  const { t, lang } = useLang()
  const { addToCart } = useCart()
  const [selectedMods, setSelectedMods] = useState({})  // { groupName: optionLabel }
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [errors, setErrors] = useState({})  // { groupName: true }

  const modifiers = product.modifiers || []
  const isAdditive = hasAdditiveModifiers(product)
  const hasAnyMods = modifiers.length > 0

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const name = product.name?.[lang] || product.name?.zh || product.name || ''

  // Check all required groups are selected
  const missingGroups = modifiers.filter(mod => !selectedMods[mod.name])

  function selectOption(groupName, optionLabel) {
    setSelectedMods(prev => ({ ...prev, [groupName]: optionLabel }))
    setErrors(prev => ({ ...prev, [groupName]: false }))
  }

  // Compute displayed price
  const displayPrice = (() => {
    if (!hasAnyMods) return `${t('common.rmPrefix')} ${(product.price || 0).toFixed(2)}`
    if (isAdditive) {
      const allSelected = missingGroups.length === 0
      if (allSelected) {
        return `${t('common.rmPrefix')} ${effectivePriceFromMods(product, selectedMods).toFixed(2)}`
      }
      const { min, max, isRange } = priceRange(product)
      return isRange
        ? `${t('common.rmPrefix')} ${min.toFixed(2)} - ${max.toFixed(2)}`
        : `${t('common.rmPrefix')} ${min.toFixed(2)}`
    }
    return formatPriceDisplay(product, t('common.rmPrefix'))
  })()

  function handleAdd() {
    if (missingGroups.length > 0) {
      const newErrors = {}
      missingGroups.forEach(m => { newErrors[m.name] = true })
      setErrors(newErrors)
      return
    }
    const modsToStore = hasAnyMods ? selectedMods : null
    addToCart({ ...product, name }, qty, modsToStore)
    setAdded(true)
    setTimeout(() => { onClose() }, 900)
  }

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

        {/* Product header */}
        <div className="flex gap-4 p-4 border-b border-cheers-cream">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-cheers-cream/30 flex-shrink-0">
            {product.imageUrl
              ? <img src={optimizeUrl(product.imageUrl, { width: 200 })} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl">🛍</div>}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-medium text-cheers-dark-brown text-sm leading-snug line-clamp-2">{name}</p>
            <p className="text-cheers-brown font-bold mt-1">{displayPrice}</p>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Modifier groups */}
          {modifiers.map(mod => (
            <div key={mod.name}>
              <p className="text-xs font-medium text-cheers-brown mb-2 flex items-center gap-1.5">
                {lang === 'zh' ? `选择${mod.name}` : `Select ${mod.name}`}
                <span className="text-red-400">*</span>
                {errors[mod.name] && (
                  <span className="text-red-400 font-normal">
                    {lang === 'zh' ? `请选择${mod.name}` : `Please select ${mod.name}`}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {mod.options.map((opt, i) => {
                  const isSelected = selectedMods[mod.name] === opt.label
                  const deltaStr = isAdditive && opt.priceDelta > 0 ? ` +RM${Number(opt.priceDelta).toFixed(2)}` : ''
                  return (
                    <button
                      key={i}
                      onClick={() => selectOption(mod.name, opt.label)}
                      className={`min-w-[3rem] px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-cheers-brown bg-cheers-brown text-cheers-cream'
                          : errors[mod.name]
                          ? 'border-red-300 text-cheers-dark-brown hover:border-cheers-brown/50'
                          : 'border-cheers-cream text-cheers-dark-brown hover:border-cheers-brown/50'
                      }`}
                    >
                      {opt.label}{deltaStr}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

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

          <button
            onClick={handleAdd}
            disabled={added}
            className={`btn-primary w-full py-3 transition-all ${added ? 'bg-green-600' : ''}`}
          >
            {added
              ? (lang === 'zh' ? '已加入 ✓' : 'Added ✓')
              : t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
