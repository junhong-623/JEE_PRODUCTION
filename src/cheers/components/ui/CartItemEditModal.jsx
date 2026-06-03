import React, { useState, useEffect } from 'react'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'
import { useCart } from '../../contexts/CartContext'
import { effectivePriceFromMods, hasAdditiveModifiers, formatPriceDisplay } from '../../lib/productPrice'

const db = getFirestore(app)

export default function CartItemEditModal({ item, onClose }) {
  const { lang } = useLang()
  const { updateCartItemVariant } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedMods, setSelectedMods] = useState(item.selectedMods ? { ...item.selectedMods } : {})
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

  const modifiers = product.modifiers || []
  const isAdditive = hasAdditiveModifiers(product)
  const price = isAdditive
    ? effectivePriceFromMods(product, selectedMods)
    : Number(product.price) || 0

  const unchanged = JSON.stringify(selectedMods) === JSON.stringify(item.selectedMods || {})

  function handleConfirm() {
    if (unchanged) { onClose(); return }
    const modsToStore = modifiers.length > 0 ? selectedMods : null
    updateCartItemVariant(item.productId, item.selectedMods || null, modsToStore, price)
    onClose()
  }

  const editTitle = modifiers.map(m => m.name).join(' / ') || (lang === 'zh' ? '规格' : 'Variant')

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

        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {modifiers.map(mod => (
            <div key={mod.name}>
              <p className="text-xs font-medium text-cheers-brown mb-2">{mod.name}</p>
              <div className="flex flex-wrap gap-2">
                {mod.options.map(opt => (
                  <button key={opt.label}
                    onClick={() => setSelectedMods(prev => ({ ...prev, [mod.name]: opt.label }))}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedMods[mod.name] === opt.label
                        ? 'bg-cheers-brown text-cheers-cream border-cheers-brown'
                        : 'border-cheers-brown/30 text-cheers-dark-brown hover:border-cheers-brown'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Price preview */}
        <p className="text-sm text-cheers-brown mt-4 mb-5">
          {lang === 'zh' ? '单价：' : 'Price: '}
          <span className="font-semibold text-cheers-dark-brown">RM {price.toFixed(2)}</span>
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button onClick={handleConfirm} className="btn-primary flex-1">
            {lang === 'zh' ? '确认' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
