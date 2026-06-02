import React, { useState, useEffect } from 'react'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { useCart } from '../../contexts/CartContext'
import { effectivePrice, getModifier1Options, getModifier2Options } from '../../lib/productPrice'

const db = getFirestore(app)

export default function CartItemEditModal({ item, onClose }) {
  const { lang } = useLang()
  const { updateCartItemVariant } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedColor, setSelectedColor] = useState(item.color ?? null)
  const [selectedSize, setSelectedSize] = useState(item.size ?? null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'cheers_products', item.productId)).then(snap => {
      if (!cancelled && snap.exists()) setProduct({ id: snap.id, ...snap.data() })
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [item.productId])

  if (loading || !product) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 animate-slide-up text-center">
          <p className="text-cheers-brown/50 text-sm">{lang === 'zh' ? '加载中…' : 'Loading…'}</p>
        </div>
      </div>
    )
  }

  const mod1Options = getModifier1Options(product)
  const hasMod1 = mod1Options.length > 0
  const mod1Name = product.modifiers?.[0]?.name || (lang === 'zh' ? '颜色' : 'Color')
  const mod2Name = product.modifiers?.[1]?.name || (lang === 'zh' ? '尺寸' : 'Size')

  const rawSizes = selectedColor
    ? getModifier2Options(product, selectedColor)
    : (product.modifiers?.[1]?.options || (product.sizes || []).map(s => ({ label: typeof s === 'string' ? s : s.label })))
  const hasSizes = rawSizes.length > 0

  const price = effectivePrice(product, selectedColor, selectedSize)
  const unchanged = selectedColor === item.color && selectedSize === item.size

  // Title: dynamically describe what can be changed
  const editTitle = [hasMod1 ? mod1Name : '', hasSizes ? mod2Name : ''].filter(Boolean).join(' / ')

  function handleConfirm() {
    if (unchanged) { onClose(); return }
    updateCartItemVariant(item.productId, item.size, item.color, selectedSize, selectedColor, price)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-cheers-dark-brown">
            {lang === 'zh' ? `修改${editTitle}` : `Change ${editTitle}`}
          </p>
          <button onClick={onClose} className="text-cheers-brown/40 hover:text-cheers-brown text-xl leading-none">✕</button>
        </div>

        <p className="text-sm text-cheers-brown/60 truncate mb-4">{item.name}</p>

        {/* Modifier 1 picker */}
        {hasMod1 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-cheers-brown mb-2">{mod1Name}</p>
            <div className="flex flex-wrap gap-2">
              {mod1Options.map(opt => (
                <button key={opt.label}
                  onClick={() => { setSelectedColor(opt.label); setSelectedSize(null) }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedColor === opt.label
                      ? 'bg-cheers-brown text-cheers-cream border-cheers-brown'
                      : 'border-cheers-brown/30 text-cheers-dark-brown hover:border-cheers-brown'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modifier 2 picker */}
        {hasSizes && (
          <div className="mb-4">
            <p className="text-xs font-medium text-cheers-brown mb-2">{mod2Name}</p>
            <div className="flex flex-wrap gap-2">
              {rawSizes.map(s => (
                <button key={s.label}
                  onClick={() => setSelectedSize(s.label)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedSize === s.label
                      ? 'bg-cheers-brown text-cheers-cream border-cheers-brown'
                      : 'border-cheers-brown/30 text-cheers-dark-brown hover:border-cheers-brown'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price preview */}
        {(!hasSizes || selectedSize) && (
          <p className="text-sm text-cheers-brown mb-5">
            {lang === 'zh' ? '单价：' : 'Price: '}
            <span className="font-semibold text-cheers-dark-brown">RM {price.toFixed(2)}</span>
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={hasSizes && !selectedSize}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
            {lang === 'zh' ? '确认' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
