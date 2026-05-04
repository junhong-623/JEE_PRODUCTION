import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

const db = getFirestore(app)

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `CHEERS-${date}-${rand}`
}

export default function CheckoutPage() {
  const { t, lang } = useLang()
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [settings, setSettings] = useState(null)
  const [deliveryType, setDeliveryType] = useState('shipping')
  const [region, setRegion] = useState('west')
  const [location, setLocation] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', address: '', postcode: '', city: '', state: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (items.length === 0) navigate('/cart')
  }, [items])

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) {
        setSettings(snap.data())
        if (!snap.data().faceToFaceEnabled) setDeliveryType('shipping')
      }
    })
    if (user) {
      setForm(f => ({
        ...f,
        name: user.displayName || '',
      }))
    }
  }, [user])

  const shippingFee = deliveryType === 'face-to-face' ? 0
    : region === 'east' ? (settings?.shippingFeeEast || 0)
    : (settings?.shippingFeeWest ?? settings?.shippingFee ?? 0)
  const total = subtotal + shippingFee

  async function handleSubmit(e) {
    e.preventDefault()
    if (deliveryType === 'face-to-face' && !location) { setError(t('checkout.selectLocation')); return }
    setLoading(true)
    setError('')
    try {
      const orderId = generateOrderId()
      const orderData = {
        orderId,
        userId: user.uid,
        userEmail: user.email,
        userName: form.name,
        items: items.map(i => ({ ...i })),
        delivery: deliveryType === 'face-to-face'
          ? { type: 'face-to-face', location }
          : { type: 'shipping', region, ...form },
        subtotal,
        shippingFee,
        total,
        status: 'pending',
        paymentMode: settings?.paymentMode || 'full',
        createdAt: serverTimestamp(),
      }
      const ref = await addDoc(collection(db, 'cheers_orders'), orderData)
      await clearCart()
      navigate(`/payment/${ref.id}`, { state: { orderId, total, paymentMode: settings?.paymentMode } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!settings) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('checkout.title')}</h1>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Delivery method */}
          <div className="card p-4">
            <h2 className="font-medium text-cheers-dark-brown mb-3">{t('checkout.delivery')}</h2>
            <div className="space-y-2">
              {settings.faceToFaceEnabled && (
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === 'face-to-face' ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream hover:border-cheers-brown/40'}`}>
                  <input type="radio" name="delivery" value="face-to-face"
                    checked={deliveryType === 'face-to-face'} onChange={() => setDeliveryType('face-to-face')}
                    className="text-cheers-brown" />
                  <div>
                    <p className="text-sm font-medium text-cheers-dark-brown">{t('checkout.faceToFace')}</p>
                    <p className="text-xs text-green-600">{t('checkout.faceToFaceHint')}</p>
                  </div>
                </label>
              )}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === 'shipping' ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream hover:border-cheers-brown/40'}`}>
                <input type="radio" name="delivery" value="shipping"
                  checked={deliveryType === 'shipping'} onChange={() => setDeliveryType('shipping')}
                  className="text-cheers-brown" />
                <div>
                  <p className="text-sm font-medium text-cheers-dark-brown">{t('checkout.shipping')}</p>
                  <p className="text-xs text-cheers-brown/60">
                    {lang === 'zh' ? '西马' : 'West MY'} RM {(settings.shippingFeeWest ?? settings.shippingFee ?? 0).toFixed(2)}
                    {' · '}
                    {lang === 'zh' ? '东马' : 'East MY'} RM {(settings.shippingFeeEast || 0).toFixed(2)}
                  </p>
                </div>
              </label>
            </div>

            {/* Region selector — only shown for shipping */}
            {deliveryType === 'shipping' && (
              <div className="mt-3">
                <p className="text-xs font-medium text-cheers-brown mb-2">{lang === 'zh' ? '配送地区' : 'Delivery Region'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'west', zh: '🇲🇾 西马', en: '🇲🇾 West Malaysia' },
                    { value: 'east', zh: '🏝️ 东马 (沙巴/砂拉越)', en: '🏝️ East Malaysia (Sabah/Sarawak)' },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${region === opt.value ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream hover:border-cheers-brown/40'}`}>
                      <input type="radio" name="region" value={opt.value}
                        checked={region === opt.value} onChange={() => setRegion(opt.value)}
                        className="text-cheers-brown" />
                      <span className="text-cheers-dark-brown font-medium">{lang === 'zh' ? opt.zh : opt.en}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Face-to-face location select */}
            {deliveryType === 'face-to-face' && (
              <div className="mt-3">
                <label className="label">{t('checkout.location')}</label>
                <select value={location} onChange={e => setLocation(e.target.value)} className="input" required>
                  <option value="">{t('checkout.selectLocation')}</option>
                  {(settings.faceToFaceLocations || []).map((loc, i) => (
                    <option key={i} value={loc.name?.[lang] || loc.name?.zh || loc.name}>
                      {loc.name?.[lang] || loc.name?.zh || loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Contact & address */}
          <div className="card p-4 space-y-3">
            <h2 className="font-medium text-cheers-dark-brown">{lang === 'zh' ? '联系信息' : 'Contact Info'}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">{t('checkout.name')}</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">{t('checkout.phone')}</label>
                <input className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              </div>
            </div>

            {deliveryType === 'shipping' && (
              <>
                <div>
                  <label className="label">{t('checkout.address')}</label>
                  <textarea className="input resize-none" rows={2}
                    value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">{t('checkout.postcode')}</label>
                    <input className="input" value={form.postcode} onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">{t('checkout.city')}</label>
                    <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">{t('checkout.state')}</label>
                    <input className="input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} required />
                  </div>
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? t('checkout.submitting') : t('checkout.submit')}
          </button>
        </form>

        {/* Order summary */}
        <div className="card p-4 h-fit">
          <h2 className="font-medium text-cheers-dark-brown mb-3">{t('checkout.orderSummary')}</h2>
          <div className="space-y-2 mb-3">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-cheers-dark-brown/70 truncate flex-1 mr-2">{item.name} × {item.quantity}</span>
                <span className="text-cheers-dark-brown flex-shrink-0">{t('common.rmPrefix')} {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-cheers-cream pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-cheers-brown/70">
              <span>{t('cart.subtotal')}</span>
              <span>{t('common.rmPrefix')} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-cheers-brown/70">
              <span>{t('cart.shipping')}</span>
              <span>{shippingFee === 0 ? t('cart.free') : `${t('common.rmPrefix')} ${shippingFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-cheers-dark-brown pt-1 border-t border-cheers-cream">
              <span>{t('cart.total')}</span>
              <span>{t('common.rmPrefix')} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
