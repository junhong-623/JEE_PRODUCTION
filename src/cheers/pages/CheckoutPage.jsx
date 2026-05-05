import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, addDoc, getDocs, collection, query, where, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import emailjs from '@emailjs/browser'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import CouponTicket, { applyDiscount, formatDiscount, computeSavings, findBestCoupon, isCouponEligible } from '../components/ui/CouponTicket'

const db = getFirestore(app)

function detectRegion(postcode) {
  const n = parseInt(postcode, 10)
  if (!postcode || postcode.length < 5 || isNaN(n)) return null
  if (n >= 87000 && n <= 98999) return 'east'
  if (n >= 1000  && n <= 86999) return 'west'
  return null
}

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `CHEERS-${date}-${rand}`
}

// Popup shows best coupon in ticket style
function CouponModal({ coupon, savings, subtotal, lang, onApply, onSkip }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onSkip() }}>
      <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" onClick={onSkip} />
      <div className="relative bg-cheers-light-cream rounded-2xl shadow-2xl max-w-sm w-full px-4 pt-5 pb-5 text-center animate-slide-up">
        <p className="font-serif text-lg text-cheers-dark-brown mb-1">
          {lang === 'zh' ? '您有优惠券可用！' : 'You have a coupon!'}
        </p>
        <p className="text-xs text-cheers-brown/50 mb-4">
          {lang === 'zh' ? `可省 RM ${savings.toFixed(2)}` : `Save RM ${savings.toFixed(2)}`}
        </p>
        <CouponTicket coupon={coupon} lang={lang} subtotal={effectiveSubtotal} />
        <div className="flex gap-3 mt-4">
          <button onClick={onSkip} className="btn-secondary flex-1 py-2">{lang === 'zh' ? '不使用' : 'Skip'}</button>
          <button onClick={onApply} className="btn-primary flex-1 py-2">{lang === 'zh' ? '立即使用' : 'Apply'}</button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const { t, lang } = useLang()
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [settings, setSettings] = useState(null)
  const [deliveryType, setDeliveryType] = useState('shipping')
  const [location, setLocation] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', address: '', postcode: '', city: '', state: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Addon mode
  const [addonInfo, setAddonInfo] = useState(null) // { parentOrderId, delivery }
  const [parentOrderSubtotal, setParentOrderSubtotal] = useState(0)

  // Coupon state
  const [userCoupons, setUserCoupons] = useState([])       // personal unused coupons
  const [selectedCoupon, setSelectedCoupon] = useState(null) // { coupon data + id + _source }
  const [couponsExpanded, setCouponsExpanded] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeResult, setCodeResult] = useState(null) // coupon obj | 'not_found'
  const [codeChecking, setCodeChecking] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [popupCoupon, setPopupCoupon] = useState(null)

  useEffect(() => {
    if (items.length === 0) navigate('/cart')
  }, [items])

  useEffect(() => {
    async function load() {
      // Check addon mode first
      const addonRaw = sessionStorage.getItem('cheers_addon')
      const addon = addonRaw ? JSON.parse(addonRaw) : null
      if (addon) {
        setAddonInfo(addon)
        const d = addon.delivery || {}
        setDeliveryType(d.type === 'face-to-face' ? 'face-to-face' : 'shipping')
        if (d.type === 'face-to-face') {
          setLocation(d.location || '')
        } else {
          setForm(f => ({
            ...f,
            name: d.name || user?.displayName || '',
            phone: d.phone || '',
            address: d.address || '',
            postcode: d.postcode || '',
            city: d.city || '',
            state: d.state || '',
          }))
        }
      }

      const [settingsSnap, addressSnap, couponsSnap, parentSnap] = await Promise.all([
        getDoc(doc(db, 'cheers_settings', 'global')),
        (!addon && user) ? getDoc(doc(db, 'cheers_addresses', user.uid)) : Promise.resolve(null),
        user ? getDocs(query(collection(db, 'cheers_user_coupons'), where('userId', '==', user.uid), where('used', '==', false))) : Promise.resolve(null),
        addon ? getDocs(query(collection(db, 'cheers_orders'), where('orderId', '==', addon.parentOrderId))) : Promise.resolve(null),
      ])
      const parentSubtotal = (!parentSnap || parentSnap.empty) ? 0 : (parentSnap.docs[0].data().subtotal || 0)
      if (parentSubtotal > 0) setParentOrderSubtotal(parentSubtotal)

      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data())
        if (!settingsSnap.data().faceToFaceEnabled && !addon) setDeliveryType('shipping')
      }

      if (!addon) {
        if (addressSnap?.exists()) {
          const a = addressSnap.data()
          setForm(f => ({ ...f, name: a.name || user?.displayName || '', phone: a.phone || '', address: a.address || '', postcode: a.postcode || '', city: a.city || '', state: a.state || '' }))
        } else if (user) {
          setForm(f => ({ ...f, name: user.displayName || '' }))
        }
      }

      if (couponsSnap) {
        const coupons = couponsSnap.docs.map(d => ({ id: d.id, _source: 'personal', ...d.data() }))
        setUserCoupons(coupons)
        if (coupons.length > 0) {
          const best = findBestCoupon(coupons, subtotal + parentSubtotal)
          setPopupCoupon(best)
          setShowPopup(!!best)
        }
      }
    }
    load()
  }, [user])

  const region = detectRegion(form.postcode)
  const effectiveSubtotal = subtotal + parentOrderSubtotal  // combined for coupon minSpend check in addon mode
  const couponIsValid = selectedCoupon ? isCouponEligible(selectedCoupon, effectiveSubtotal) : false
  const isFreeShippingCoupon = couponIsValid && (selectedCoupon?.discountType || selectedCoupon?.type) === 'free_shipping'
  const shippingFee = addonInfo ? 0
    : deliveryType === 'face-to-face' ? 0
    : isFreeShippingCoupon ? 0
    : region === 'east' ? (settings?.shippingFeeEast || 0)
    : (settings?.shippingFeeWest ?? settings?.shippingFee ?? 0)
  const discountAmount = (couponIsValid && !isFreeShippingCoupon) ? computeSavings(subtotal, selectedCoupon) : 0
  const total = subtotal - discountAmount + shippingFee

  function selectCoupon(c) {
    if (!isCouponEligible(c, effectiveSubtotal)) return
    setSelectedCoupon(prev => prev?.id === c.id && prev?._source === c._source ? null : c)
    setCodeResult(null)
    setCodeInput('')
  }

  async function handleCodeSearch() {
    const code = codeInput.trim().toUpperCase()
    if (!code) return
    setCodeChecking(true)
    setCodeResult(null)
    try {
      // Search personal coupons first
      const personalSnap = await getDocs(
        query(collection(db, 'cheers_user_coupons'), where('userId', '==', user.uid), where('code', '==', code), where('used', '==', false))
      )
      if (!personalSnap.empty) {
        const d = personalSnap.docs[0]
        setCodeResult({ id: d.id, _source: 'personal', ...d.data() })
        return
      }
      // Search promo codes
      const promoSnap = await getDoc(doc(db, 'cheers_promo_codes', code))
      if (promoSnap.exists() && promoSnap.data().active) {
        const data = promoSnap.data()
        if (!data.maxUses || data.usedCount < data.maxUses) {
          setCodeResult({ _source: 'promo', ...data })
          return
        }
      }
      setCodeResult('not_found')
    } finally { setCodeChecking(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (deliveryType === 'face-to-face' && !location) { setError(t('checkout.selectLocation')); return }
    setLoading(true)
    setError('')
    try {
      const orderId = generateOrderId()
      const orderData = {
        orderId, userId: user.uid, userEmail: user.email, userName: form.name,
        items: items.map(i => ({ ...i })),
        delivery: deliveryType === 'face-to-face' ? { type: 'face-to-face', location } : { type: 'shipping', region, ...form },
        subtotal, shippingFee, total,
        status: 'pending',
        paymentMode: settings?.paymentMode || 'full',
        createdAt: serverTimestamp(),
        ...(addonInfo ? { isAddon: true, parentOrderId: addonInfo.parentOrderId } : {}),
        ...(couponIsValid && selectedCoupon ? {
          coupon: { code: selectedCoupon.code, discount: selectedCoupon.discount, discountType: selectedCoupon.discountType || 'percentage', title: selectedCoupon.title },
          discount: isFreeShippingCoupon ? 0 : discountAmount,
        } : {}),
      }
      const ref = await addDoc(collection(db, 'cheers_orders'), orderData)

      if (couponIsValid && selectedCoupon?._source === 'personal' && selectedCoupon?.id) {
        await updateDoc(doc(db, 'cheers_user_coupons', selectedCoupon.id), { used: true, usedAt: serverTimestamp(), usedOnOrder: orderId }).catch(() => {})
      }
      if (couponIsValid && selectedCoupon?._source === 'promo' && selectedCoupon?.code) {
        await updateDoc(doc(db, 'cheers_promo_codes', selectedCoupon.code), { usedCount: increment(1) }).catch(() => {})
      }

      await clearCart()
      if (addonInfo) sessionStorage.removeItem('cheers_addon')

      // Fire-and-forget admin notification (temporarily disabled)
      const { notificationEmail, emailjsTemplateId } = settings || {}
      if (false && notificationEmail && emailjsTemplateId) {
        const deliveryInfo = deliveryType === 'face-to-face' ? `面交 · ${location}` : `邮寄 · ${region === 'east' ? '东马' : '西马'} · ${form.postcode} ${form.city}, ${form.state}`
        emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, emailjsTemplateId, {
          to_email: notificationEmail, order_id: orderId, customer_name: form.name,
          customer_email: user.email, customer_phone: form.phone || '—',
          order_items: items.map(i => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}  RM${(i.price * i.quantity).toFixed(2)}`).join('\n'),
          order_total: `RM ${total.toFixed(2)}`, delivery_info: deliveryInfo,
          order_date: new Date().toLocaleString('zh-MY'),
        }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY).catch(() => {})
      }

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
      {showPopup && popupCoupon && (
        <CouponModal
          coupon={popupCoupon}
          savings={computeSavings(subtotal, popupCoupon)}
          subtotal={effectiveSubtotal}
          lang={lang}
          onApply={() => { setSelectedCoupon(popupCoupon); setShowPopup(false) }}
          onSkip={() => setShowPopup(false)}
        />
      )}

      {addonInfo && (
        <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <span className="text-xl">📦</span>
          <div>
            <p className="text-sm font-medium text-orange-800">
              {lang === 'zh' ? '加单模式' : 'Add-on Mode'}
            </p>
            <p className="text-xs text-orange-600">
              {lang === 'zh' ? '关联至' : 'Adding to'}: <span className="font-medium">{addonInfo.parentOrderId}</span>
              {' · '}{lang === 'zh' ? '邮费免收，地址与原订单相同' : 'Free shipping, same address as original order'}
            </p>
          </div>
          <button type="button" onClick={() => { sessionStorage.removeItem('cheers_addon'); setAddonInfo(null) }}
            className="ml-auto text-xs text-orange-400 hover:text-orange-600">
            {lang === 'zh' ? '取消加单' : 'Cancel'}
          </button>
        </div>
      )}

      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('checkout.title')}</h1>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Delivery — shipping first */}
          <div className="card p-4">
            <h2 className="font-medium text-cheers-dark-brown mb-3">{t('checkout.delivery')}</h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === 'shipping' ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream hover:border-cheers-brown/40'}`}>
                <input type="radio" name="delivery" value="shipping" checked={deliveryType === 'shipping'} onChange={() => setDeliveryType('shipping')} className="text-cheers-brown" />
                <div>
                  <p className="text-sm font-medium text-cheers-dark-brown">{t('checkout.shipping')}</p>
                  <p className="text-xs text-cheers-brown/60">
                    {lang === 'zh' ? '西马' : 'West MY'} RM {(settings.shippingFeeWest ?? settings.shippingFee ?? 0).toFixed(2)}
                    {' · '}{lang === 'zh' ? '东马' : 'East MY'} RM {(settings.shippingFeeEast || 0).toFixed(2)}
                    {' · '}{lang === 'zh' ? '根据邮编自动判断' : 'auto-detected from postcode'}
                  </p>
                </div>
              </label>
              {settings.faceToFaceEnabled && (
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === 'face-to-face' ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream hover:border-cheers-brown/40'}`}>
                  <input type="radio" name="delivery" value="face-to-face" checked={deliveryType === 'face-to-face'} onChange={() => setDeliveryType('face-to-face')} className="text-cheers-brown" />
                  <div>
                    <p className="text-sm font-medium text-cheers-dark-brown">{t('checkout.faceToFace')}</p>
                    <p className="text-xs text-green-600">{t('checkout.faceToFaceHint')}</p>
                  </div>
                </label>
              )}
            </div>
            {deliveryType === 'face-to-face' && (
              <div className="mt-3">
                <label className="label">{t('checkout.location')}</label>
                <select value={location} onChange={e => setLocation(e.target.value)} className="input" required>
                  <option value="">{t('checkout.selectLocation')}</option>
                  {(settings.faceToFaceLocations || []).map((loc, i) => (
                    <option key={i} value={loc.name?.[lang] || loc.name?.zh || loc.name}>{loc.name?.[lang] || loc.name?.zh || loc.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Contact & address */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-cheers-dark-brown">{lang === 'zh' ? '联系信息' : 'Contact Info'}</h2>
              {addonInfo && <span className="text-xs text-orange-500">{lang === 'zh' ? '地址与原订单一致' : 'Same as original order'}</span>}
            </div>
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
                  <textarea className={`input resize-none ${addonInfo ? 'bg-cheers-cream/20 cursor-not-allowed' : ''}`} rows={2} value={form.address}
                    onChange={e => !addonInfo && setForm(f => ({ ...f, address: e.target.value }))} readOnly={!!addonInfo} required />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">{t('checkout.postcode')}</label>
                    <input className={`input ${addonInfo ? 'bg-cheers-cream/20 cursor-not-allowed' : ''}`} value={form.postcode} maxLength={5}
                      onChange={e => !addonInfo && setForm(f => ({ ...f, postcode: e.target.value.replace(/\D/g, '') }))} readOnly={!!addonInfo} required />
                    {form.postcode.length === 5 && (
                      <p className={`text-xs mt-1 font-medium ${region ? 'text-green-600' : 'text-red-400'}`}>
                        {region === 'east' ? '🏝️ 东马' : region === 'west' ? '🇲🇾 西马' : (lang === 'zh' ? '无效邮编' : 'Invalid postcode')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">{t('checkout.city')}</label>
                    <input className={`input ${addonInfo ? 'bg-cheers-cream/20 cursor-not-allowed' : ''}`} value={form.city}
                      onChange={e => !addonInfo && setForm(f => ({ ...f, city: e.target.value }))} readOnly={!!addonInfo} required />
                  </div>
                  <div>
                    <label className="label">{t('checkout.state')}</label>
                    <input className={`input ${addonInfo ? 'bg-cheers-cream/20 cursor-not-allowed' : ''}`} value={form.state}
                      onChange={e => !addonInfo && setForm(f => ({ ...f, state: e.target.value }))} readOnly={!!addonInfo} required />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Coupon section — collapsible */}
          <div className="card overflow-hidden">
            <button type="button" onClick={() => setCouponsExpanded(v => !v)}
              className="w-full px-4 py-3 flex items-center justify-between text-left">
              <span className="text-sm font-medium text-cheers-dark-brown">
                🎫 {userCoupons.length > 0
                  ? (lang === 'zh' ? `我有 ${userCoupons.length} 张优惠券` : `${userCoupons.length} coupon${userCoupons.length > 1 ? 's' : ''} available`)
                  : (lang === 'zh' ? '优惠券 / 优惠码' : 'Coupon / Promo Code')}
              </span>
              <div className="flex items-center gap-2">
                {selectedCoupon && couponIsValid && (
                  <span className="text-xs text-green-600 font-medium">
                    {isFreeShippingCoupon ? (lang === 'zh' ? '🚚 免运费' : '🚚 Free Ship') : `−RM ${discountAmount.toFixed(2)}`}
                  </span>
                )}
                <span className="text-cheers-brown/40 text-sm">{couponsExpanded ? '▲' : '▼'}</span>
              </div>
            </button>

            {couponsExpanded && (
              <div className="border-t border-cheers-cream px-2 py-3 space-y-4">
                {addonInfo && parentOrderSubtotal > 0 && (
                  <p className="text-[10px] text-orange-500 px-2">
                    📦 {lang === 'zh' ? `门槛按合并金额计算：原单 RM ${parentOrderSubtotal.toFixed(2)} + 此单 RM ${subtotal.toFixed(2)} = RM ${effectiveSubtotal.toFixed(2)}` : `Min. spend uses combined total: RM ${effectiveSubtotal.toFixed(2)}`}
                  </p>
                )}
                {/* Personal coupons grid */}
                {userCoupons.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-cheers-brown/50 font-medium px-2">{lang === 'zh' ? '我的优惠券（点击选择）' : 'My Coupons (click to select)'}</p>
                    {userCoupons.map(c => (
                      <div key={c.id} onClick={() => selectCoupon(c)}
                        className={`rounded-xl transition-all ${isCouponEligible(c, effectiveSubtotal) ? 'cursor-pointer' : 'cursor-not-allowed'} ${selectedCoupon?.id === c.id ? 'ring-2 ring-green-400 ring-offset-1' : 'hover:opacity-90'}`}>
                        <CouponTicket coupon={c} lang={lang} subtotal={effectiveSubtotal} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Code search */}
                <div className="px-1 space-y-2">
                  <p className="text-xs text-cheers-brown/50 font-medium">{lang === 'zh' ? '输入优惠码（个人券码或优惠码）' : 'Enter coupon / promo code'}</p>
                  <div className="flex gap-2">
                    <input className="input flex-1 font-mono uppercase text-sm"
                      placeholder={lang === 'zh' ? '例：SUMMER10' : 'e.g. SUMMER10'}
                      value={codeInput} onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeResult(null) }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCodeSearch())} />
                    <button type="button" onClick={handleCodeSearch} disabled={codeChecking || !codeInput}
                      className="btn-secondary px-4 text-sm">
                      {codeChecking ? '…' : (lang === 'zh' ? '搜索' : 'Search')}
                    </button>
                  </div>
                  {codeResult === 'not_found' && (
                    <p className="text-xs text-red-500">{lang === 'zh' ? '找不到此优惠码' : 'Code not found or expired'}</p>
                  )}
                  {codeResult && codeResult !== 'not_found' && (
                    <div onClick={() => selectCoupon(codeResult)}
                      className={`rounded-xl transition-all ${isCouponEligible(codeResult, effectiveSubtotal) ? 'cursor-pointer' : 'cursor-not-allowed'} ${selectedCoupon?.code === codeResult.code ? 'ring-2 ring-green-400 ring-offset-1' : 'hover:opacity-90'}`}>
                      <CouponTicket coupon={codeResult} lang={lang} subtotal={effectiveSubtotal} />
                    </div>
                  )}
                </div>

                {selectedCoupon && couponIsValid && (
                  <div className="px-2 flex items-center justify-between">
                    <p className="text-xs text-green-600 font-medium">
                      ✓ {selectedCoupon.title || selectedCoupon.code} {lang === 'zh' ? '已选中' : 'selected'}
                    </p>
                    <button type="button" onClick={() => setSelectedCoupon(null)}
                      className="text-xs text-cheers-brown/50 hover:text-cheers-brown">
                      {lang === 'zh' ? '取消' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>
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
              <div key={`${item.productId}-${item.size}`} className="flex justify-between text-sm">
                <span className="text-cheers-dark-brown/70 truncate flex-1 mr-2">{item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}</span>
                <span className="text-cheers-dark-brown flex-shrink-0">RM {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-cheers-cream pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-cheers-brown/70">
              <span>{t('cart.subtotal')}</span><span>RM {subtotal.toFixed(2)}</span>
            </div>
            {couponIsValid && !isFreeShippingCoupon && discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>🎫 {formatDiscount(selectedCoupon, lang)}</span>
                <span>−RM {discountAmount.toFixed(2)}</span>
              </div>
            )}
            {isFreeShippingCoupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span>🚚 {selectedCoupon.title || (lang === 'zh' ? '免运费券' : 'Free Shipping')}</span>
                <span>{lang === 'zh' ? '已减免' : 'Applied'}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-cheers-brown/70">
              <span>{t('cart.shipping')}</span>
              <span>{shippingFee === 0 ? t('cart.free') : `RM ${shippingFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-cheers-dark-brown pt-1 border-t border-cheers-cream">
              <span>{t('cart.total')}</span><span>RM {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
