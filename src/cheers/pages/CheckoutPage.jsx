import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, addDoc, getDocs, collection, query, where, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import CouponTicket, { applyDiscount, formatDiscount, computeSavings, findBestCoupon, findNearMissCoupon, isCouponEligible } from '../components/ui/CouponTicket'
import { optimizeUrl } from '../lib/cloudinary'
import { effectiveCostPrice } from '../lib/productPrice'
import { generateUniqueOrderId } from '../lib/orderId'

const db = getFirestore(app)

const MY_STATES = [
  'Kuala Lumpur', 'Putrajaya', 'Labuan',
  'Selangor', 'Johor', 'Kedah', 'Kelantan', 'Melaka',
  'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Terengganu',
  'Sabah', 'Sarawak',
]

function detectRegion(postcode) {
  const n = parseInt(postcode, 10)
  if (!postcode || postcode.length < 5 || isNaN(n)) return null
  if (n >= 87000 && n <= 98999) return 'east'
  if (n >= 1000  && n <= 86999) return 'west'
  return null
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
        <CouponTicket coupon={coupon} lang={lang} subtotal={subtotal} />
        <div className="flex gap-3 mt-4">
          <button onClick={onSkip} className="btn-secondary flex-1 py-2">{lang === 'zh' ? '不使用' : 'Skip'}</button>
          <button onClick={onApply} className="btn-primary flex-1 py-2">{lang === 'zh' ? '立即使用' : 'Apply'}</button>
        </div>
      </div>
    </div>
  )
}

function UpsellModal({ coupon, shortfall, products, lang, onClose }) {
  const nav = useNavigate()
  const { addToCart } = useCart()
  const [added, setAdded] = React.useState({})

  async function handleAdd(p) {
    await addToCart(p, 1, undefined)
    setAdded(prev => ({ ...prev, [p.id]: true }))
    setTimeout(onClose, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cheers-light-cream rounded-2xl shadow-2xl max-w-sm w-full px-4 pt-5 pb-4 animate-slide-up">
        <button onClick={onClose} className="absolute top-3 right-3 text-cheers-brown/40 hover:text-cheers-brown text-lg leading-none">×</button>
        <div className="text-center mb-4">
          <p className="text-3xl mb-1">🎫</p>
          <p className="font-serif text-lg text-cheers-dark-brown leading-snug">
            {lang === 'zh' ? `再加 RM ${shortfall.toFixed(2)} 即可使用` : `Add RM ${shortfall.toFixed(2)} more to unlock`}
          </p>
          <p className="text-xs text-cheers-brown/50 mt-1">{coupon.title} · {formatDiscount(coupon, lang)}</p>
        </div>
        <div className="space-y-2">
          {products.map(p => {
            const name = typeof p.name === 'object' ? (p.name?.[lang] || p.name?.zh) : p.name
            const img = p.imageUrls?.[0] || p.imageUrl
            const hasSizes = p.sizes?.length > 0
            return (
              <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 transition-colors">
                <div className="cursor-pointer flex items-center gap-3 flex-1 min-w-0" onClick={() => { onClose(); nav(`/products/${p.id}`) }}>
                  {img
                    ? <img src={optimizeUrl(img, { width: 120 })} alt={name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-lg bg-cheers-cream flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cheers-dark-brown truncate">{name}</p>
                    <p className="text-xs text-cheers-brown">RM {Number(p.price).toFixed(2)}</p>
                  </div>
                </div>
                {hasSizes ? (
                  <button onClick={() => { onClose(); nav(`/products/${p.id}`) }}
                    className="flex-shrink-0 text-xs border border-cheers-brown/30 text-cheers-brown px-2 py-1 rounded-lg hover:border-cheers-brown transition-colors">
                    {lang === 'zh' ? '选规格' : 'Options'}
                  </button>
                ) : (
                  <button onClick={() => handleAdd(p)} disabled={!!added[p.id]}
                    className={`flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-colors ${added[p.id] ? 'bg-green-100 text-green-700' : 'bg-cheers-brown text-cheers-cream hover:bg-cheers-dark-brown'}`}>
                    {added[p.id] ? '✓' : (lang === 'zh' ? '+购物车' : '+Cart')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button onClick={onClose} className="mt-3 w-full text-xs text-cheers-brown/40 hover:text-cheers-brown py-1">
          {lang === 'zh' ? '暂不需要' : 'Maybe later'}
        </button>
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
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Addon mode
  const [addonInfo, setAddonInfo] = useState(null) // { parentOrderId, delivery }
  const [parentOrderSubtotal, setParentOrderSubtotal] = useState(0)
  // Update-existing-order mode (unpaid pending order)
  const [updateOrderInfo, setUpdateOrderInfo] = useState(null)
  // 用户可合并的母订单列表（在 checkout 内直接选择，无需先去 /orders）
  const [eligibleParents, setEligibleParents] = useState([])
  const [parentPickerOpen, setParentPickerOpen] = useState(false)

  // Coupon state
  const [userCoupons, setUserCoupons] = useState([])       // personal unused coupons
  const [selectedCoupon, setSelectedCoupon] = useState(null) // { coupon data + id + _source }
  const [couponsExpanded, setCouponsExpanded] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeResult, setCodeResult] = useState(null) // coupon obj | 'not_found'
  const [codeChecking, setCodeChecking] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [popupCoupon, setPopupCoupon] = useState(null)
  const [upsellModal, setUpsellModal] = useState(null) // { coupon, shortfall, products }

  useEffect(() => {
    if (items.length === 0) navigate('/cart')
  }, [items])

  useEffect(() => {
    async function load() {
      // Check update-existing-order mode first
      const updateRaw = sessionStorage.getItem('cheers_update_order')
      const updateInfo = updateRaw ? JSON.parse(updateRaw) : null
      if (updateInfo) {
        setUpdateOrderInfo(updateInfo)
        setParentOrderSubtotal(updateInfo.existingSubtotal || 0)
        const d = updateInfo.delivery || {}
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

      // Check addon mode
      const addonRaw = sessionStorage.getItem('cheers_addon')
      const addon = (!updateInfo && addonRaw) ? JSON.parse(addonRaw) : null
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

      const [settingsSnap, addressSnap, couponsSnap, parentSnap, eligibleSnap] = await Promise.all([
        getDoc(doc(db, 'cheers_settings', 'global')),
        (!addon && user) ? getDoc(doc(db, 'cheers_addresses', user.uid)) : Promise.resolve(null),
        user ? getDocs(query(collection(db, 'cheers_user_coupons'), where('userId', '==', user.uid), where('used', '==', false))) : Promise.resolve(null),
        addon ? getDocs(query(collection(db, 'cheers_orders'), where('orderId', '==', addon.parentOrderId))) : Promise.resolve(null),
        // 仅在用户登录且非 addon/update 模式下加载可合并的母订单
        (user && !addon && !updateInfo) ? getDocs(query(collection(db, 'cheers_orders'), where('userId', '==', user.uid))) : Promise.resolve(null),
      ])
      const parentSubtotal = (!parentSnap || parentSnap.empty) ? 0 : (parentSnap.docs[0].data().subtotal || 0)
      if (parentSubtotal > 0) setParentOrderSubtotal(parentSubtotal)

      // 过滤出可合并的母订单：状态 in [pending, confirmed, purchasing] 且 非加单
      if (eligibleSnap) {
        const ELIGIBLE = new Set(['pending', 'confirmed', 'purchasing'])
        const list = eligibleSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(o => ELIGIBLE.has(o.status) && !o.isAddon)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setEligibleParents(list)
      }

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
          const effectiveForPopup = subtotal + parentSubtotal
          const best = findBestCoupon(coupons, effectiveForPopup)
          if (best) {
            setPopupCoupon(best)
            setShowPopup(true)
          } else {
            const nearMiss = findNearMissCoupon(coupons, effectiveForPopup)
            const sd = settingsSnap.data() || {}
            const upsellCatIds = sd.couponUpsellCategoryIds?.length
              ? sd.couponUpsellCategoryIds
              : sd.couponUpsellCategoryId ? [sd.couponUpsellCategoryId] : null
            if (nearMiss && upsellCatIds?.length) {
              const shortfall = nearMiss.minSpend - effectiveForPopup
              const isAll = upsellCatIds.includes('__all__')
              const productsSnap = await getDocs(
                isAll
                  ? query(collection(db, 'cheers_products'), where('inStock', '==', true))
                  : query(collection(db, 'cheers_products'), where('categoryId', 'in', upsellCatIds), where('inStock', '==', true))
              )
              const sorted = productsSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => Math.abs(a.price - shortfall) - Math.abs(b.price - shortfall))
                .slice(0, 3)
              if (sorted.length > 0) setUpsellModal({ coupon: nearMiss, shortfall, products: sorted })
            }
          }
        }
      }
    }
    load()
  }, [user])

  // 应用「合并到母订单」：把选中的母订单转成 addonInfo，沿用现有的免邮费/锁地址逻辑
  function applyMerge(parent) {
    const d = parent.delivery || {}
    const delivery = d.type === 'face-to-face'
      ? { type: 'face-to-face', location: d.location || '' }
      : { type: 'shipping', name: d.name || '', phone: d.phone || '', address: d.address || '', postcode: d.postcode || '', city: d.city || '', state: d.state || '', region: d.region }
    setAddonInfo({ parentOrderId: parent.orderId || parent.id, delivery })
    setParentOrderSubtotal(parent.subtotal || 0)
    if (d.type === 'face-to-face') {
      setDeliveryType('face-to-face')
      setLocation(delivery.location)
    } else {
      setDeliveryType('shipping')
      setForm(f => ({
        ...f,
        name: delivery.name || f.name,
        phone: delivery.phone || f.phone,
        address: delivery.address || f.address,
        postcode: delivery.postcode || f.postcode,
        city: delivery.city || f.city,
        state: delivery.state || f.state,
      }))
    }
    setParentPickerOpen(false)
  }

  function clearMerge() {
    setAddonInfo(null)
    setParentOrderSubtotal(0)
  }

  const region = detectRegion(form.postcode)
  const effectiveSubtotal = subtotal + parentOrderSubtotal  // combined for coupon minSpend check in addon mode
  const couponIsValid = selectedCoupon ? isCouponEligible(selectedCoupon, effectiveSubtotal) : false
  const isFreeShippingCoupon = couponIsValid && (selectedCoupon?.discountType || selectedCoupon?.type) === 'free_shipping'
  const shippingFee = (addonInfo || updateOrderInfo) ? 0
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
      const orderId = await generateUniqueOrderId(db)
      // Fetch products to snapshot cost prices
      const productIds = [...new Set(items.map(i => i.productId))]
      const productDocs = await Promise.all(productIds.map(pid => getDoc(doc(db, 'cheers_products', pid))))
      const productMap = {}
      productDocs.forEach(snap => { if (snap.exists()) productMap[snap.id] = snap.data() })

      const orderData = {
        orderId, userId: user.uid, userEmail: user.email, userName: form.name,
        items: items.map(i => ({
          ...i,
          costPrice: effectiveCostPrice(productMap[i.productId], i.color, i.size) ?? null,
        })),
        delivery: deliveryType === 'face-to-face' ? { type: 'face-to-face', location } : { type: 'shipping', region, ...form },
        subtotal, shippingFee, total,
        status: 'pending',
        paymentMode: settings?.paymentMode || 'full',
        notes: notes.trim() || null,
        createdAt: serverTimestamp(),
        ...(addonInfo ? { isAddon: true, parentOrderId: addonInfo.parentOrderId } : {}),
        ...(couponIsValid && selectedCoupon ? {
          coupon: { code: selectedCoupon.code, discount: selectedCoupon.discount, discountType: selectedCoupon.discountType || 'percentage', title: selectedCoupon.title },
          discount: isFreeShippingCoupon ? 0 : discountAmount,
        } : {}),
      }
      // Update existing unpaid order instead of creating new one
      if (updateOrderInfo) {
        const mergedItems = [...(updateOrderInfo.existingItems || []), ...items.map(i => ({ ...i }))]
        const newSubtotal = (updateOrderInfo.existingSubtotal || 0) + subtotal
        const newTotal = newSubtotal - discountAmount + (updateOrderInfo.existingShippingFee || 0)
        await updateDoc(doc(db, 'cheers_orders', updateOrderInfo.orderDocId), {
          items: mergedItems,
          subtotal: newSubtotal,
          total: newTotal,
          ...(couponIsValid && selectedCoupon ? {
            coupon: { code: selectedCoupon.code, discount: selectedCoupon.discount, discountType: selectedCoupon.discountType || 'percentage', title: selectedCoupon.title },
            discount: discountAmount,
          } : {}),
        })
        if (couponIsValid && selectedCoupon?._source === 'personal' && selectedCoupon?.id) {
          await updateDoc(doc(db, 'cheers_user_coupons', selectedCoupon.id), { used: true, usedAt: serverTimestamp(), usedOnOrder: updateOrderInfo.orderId }).catch(() => {})
        }
        sessionStorage.removeItem('cheers_update_order')
        await clearCart()
        navigate(`/payment/${updateOrderInfo.orderDocId}`)
        return
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

      // Fire-and-forget admin notification email (lazy-load emailjs only at submit time)
      const { notificationEmail, emailjsTemplateId } = settings || {}
      if (notificationEmail && emailjsTemplateId) {
        const deliveryInfo = deliveryType === 'face-to-face' ? `面交 · ${location}` : `邮寄 · ${region === 'east' ? '东马' : '西马'} · ${form.postcode} ${form.city}, ${form.state}`
        import('@emailjs/browser').then(({ default: emailjs }) => {
          emailjs.send(import.meta.env.VITE_CHEERS_EMAILJS_SERVICE_ID, emailjsTemplateId, {
            to_email: notificationEmail, order_id: orderId, customer_name: form.name,
            customer_email: user.email, customer_phone: form.phone || '—',
            order_items: items.map(i => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}  RM${(i.price * i.quantity).toFixed(2)}`).join('\n'),
            order_total: `RM ${total.toFixed(2)}`, delivery_info: deliveryInfo,
            order_date: new Date().toLocaleString('zh-MY'),
          }, import.meta.env.VITE_CHEERS_EMAILJS_PUBLIC_KEY).catch(() => {})
        }).catch(() => {})
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
      {upsellModal && (
        <UpsellModal
          coupon={upsellModal.coupon}
          shortfall={upsellModal.shortfall}
          products={upsellModal.products}
          lang={lang}
          onClose={() => setUpsellModal(null)}
        />
      )}

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

      {updateOrderInfo && (
        <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-xl">🛍</span>
          <div>
            <p className="text-sm font-medium text-blue-800">
              {lang === 'zh' ? '加入订单模式' : 'Adding to Order'}
            </p>
            <p className="text-xs text-blue-600">
              {lang === 'zh' ? '正在向订单' : 'Adding items to'}{' '}
              <span className="font-medium">{updateOrderInfo.orderId}</span>{' '}
              {lang === 'zh' ? '添加商品，邮费不再重复收取' : '· No additional shipping'}
            </p>
          </div>
          <button type="button" onClick={() => { sessionStorage.removeItem('cheers_update_order'); setUpdateOrderInfo(null) }}
            className="ml-auto text-xs text-blue-400 hover:text-blue-600">
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
        </div>
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

          {/* Delivery */}
          <div className="card p-4">
            <h2 className="font-medium text-cheers-dark-brown mb-3">{t('checkout.delivery')}</h2>
            {(() => {
              // 区分两种 addon 来源：
              // - 来自 sessionStorage（从订单页加单按钮）→ 锁定，不显示 radio，仅显示提示
              // - 来自此页 picker → 显示为 radio 第三选项 + 可切换
              const mergedFromPicker = addonInfo && eligibleParents.some(p => (p.orderId || p.id) === addonInfo.parentOrderId)
              const mergedFromSession = addonInfo && !mergedFromPicker
              return (
                <>
                  {mergedFromSession ? (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm font-medium text-cheers-dark-brown">
                        📦 {lang === 'zh' ? '已合并到母订单' : 'Merged with order'} <span className="font-mono">{addonInfo.parentOrderId}</span>
                      </p>
                      <p className="text-xs text-cheers-brown/60 mt-0.5">
                        {lang === 'zh' ? '免邮费，配送信息沿用母订单' : 'Free shipping, delivery info inherited'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        mergedFromPicker
                          ? 'border-cheers-cream bg-white opacity-60 cursor-pointer'
                          : (deliveryType === 'shipping' ? 'border-cheers-brown bg-cheers-cream/30 cursor-pointer' : 'border-cheers-cream hover:border-cheers-brown/40 cursor-pointer')
                      }`}>
                        <input type="radio" name="delivery" value="shipping"
                          checked={!mergedFromPicker && deliveryType === 'shipping'}
                          onChange={() => { if (mergedFromPicker) clearMerge(); setDeliveryType('shipping') }}
                          className="text-cheers-brown" />
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
                        <label className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          mergedFromPicker
                            ? 'border-cheers-cream bg-white opacity-60 cursor-pointer'
                            : (deliveryType === 'face-to-face' ? 'border-cheers-brown bg-cheers-cream/30 cursor-pointer' : 'border-cheers-cream hover:border-cheers-brown/40 cursor-pointer')
                        }`}>
                          <input type="radio" name="delivery" value="face-to-face"
                            checked={!mergedFromPicker && deliveryType === 'face-to-face'}
                            onChange={() => { if (mergedFromPicker) clearMerge(); setDeliveryType('face-to-face') }}
                            className="text-cheers-brown" />
                          <div>
                            <p className="text-sm font-medium text-cheers-dark-brown">{t('checkout.faceToFace')}</p>
                            <p className="text-xs text-green-600">{t('checkout.faceToFaceHint')}</p>
                          </div>
                        </label>
                      )}
                      {eligibleParents.length > 0 && !updateOrderInfo && (
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          mergedFromPicker ? 'border-orange-400 bg-orange-50' : 'border-cheers-cream hover:border-orange-300'
                        }`}>
                          <input type="radio" name="delivery" value="merge"
                            checked={mergedFromPicker}
                            onChange={() => { if (!mergedFromPicker) setParentPickerOpen(true) }}
                            className="text-cheers-brown mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-cheers-dark-brown">
                              📦 {lang === 'zh' ? '合并到之前订单' : 'Merge with existing order'}
                            </p>
                            {mergedFromPicker ? (
                              <p className="text-xs text-orange-700 mt-0.5">
                                {lang === 'zh' ? '已选：' : 'Selected: '}
                                <span className="font-mono">{addonInfo.parentOrderId}</span>
                                {' · '}
                                <button type="button" onClick={(e) => { e.preventDefault(); setParentPickerOpen(true) }}
                                  className="underline hover:text-orange-900">
                                  {lang === 'zh' ? '更换' : 'Change'}
                                </button>
                              </p>
                            ) : (
                              <p className="text-xs text-green-600 mt-0.5">
                                {lang === 'zh'
                                  ? `${eligibleParents.length} 个可合并订单 · 免邮费`
                                  : `${eligibleParents.length} eligible · free shipping`}
                              </p>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
            {deliveryType === 'face-to-face' && !addonInfo && (
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

          {/* Picker modal — 列出可合并的母订单 */}
          {parentPickerOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setParentPickerOpen(false) }}>
              <div className="absolute inset-0 bg-cheers-dark-brown/40 backdrop-blur-sm" />
              <div className="relative w-full sm:max-w-md bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
                <div className="flex items-center justify-between px-5 py-4 border-b border-cheers-cream">
                  <h3 className="font-serif text-lg text-cheers-dark-brown">
                    {lang === 'zh' ? '选择要合并的订单' : 'Pick an order to merge'}
                  </h3>
                  <button type="button" onClick={() => setParentPickerOpen(false)}
                    className="w-7 h-7 rounded-full bg-cheers-cream/60 flex items-center justify-center text-cheers-brown hover:bg-cheers-cream">
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto p-4 space-y-2">
                  {eligibleParents.map(p => {
                    const isShipping = p.delivery?.type !== 'face-to-face'
                    const statusLabel = lang === 'zh'
                      ? (p.status === 'pending' ? '待确认' : p.status === 'confirmed' ? '已接单' : '采购中')
                      : (p.status === 'pending' ? 'Pending' : p.status === 'confirmed' ? 'Confirmed' : 'Purchasing')
                    const isSelected = addonInfo?.parentOrderId === (p.orderId || p.id)
                    return (
                      <button key={p.id} type="button" onClick={() => applyMerge(p)}
                        className={`w-full text-left border rounded-lg p-3 transition-colors ${
                          isSelected ? 'border-orange-400 bg-orange-50' : 'border-cheers-cream hover:border-cheers-brown'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-sm text-cheers-dark-brown truncate">{p.orderId || p.id}</p>
                          <span className="text-xs bg-cheers-cream text-cheers-brown px-2 py-0.5 rounded-full flex-shrink-0">{statusLabel}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-cheers-brown/60">
                            {isShipping
                              ? (lang === 'zh' ? '邮寄' : 'Shipping')
                              : (lang === 'zh' ? `面交 · ${p.delivery?.location || ''}` : `Meet up · ${p.delivery?.location || ''}`)}
                          </p>
                          <p className="text-sm font-medium text-cheers-brown">RM {Number(p.total || 0).toFixed(2)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

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
                    <select className={`input ${addonInfo ? 'bg-cheers-cream/20 cursor-not-allowed' : ''}`} value={form.state}
                      onChange={e => !addonInfo && setForm(f => ({ ...f, state: e.target.value }))} disabled={!!addonInfo} required>
                      <option value="">{lang === 'zh' ? '选择州属' : 'Select state'}</option>
                      {MY_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Order notes */}
          <div className="card p-4">
            <label className="label">{lang === 'zh' ? '订单备注（选填）' : 'Order Notes (optional)'}</label>
            <textarea className="input resize-none" rows={2}
              placeholder={lang === 'zh' ? '例：请帮我确认尺码后再下单' : 'e.g. Please confirm size before ordering'}
              value={notes} onChange={e => setNotes(e.target.value)} />
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
              <div key={`${item.productId}-${item.size ?? ''}-${item.color ?? ''}`} className="flex justify-between text-sm">
                <span className="text-cheers-dark-brown/70 truncate flex-1 mr-2">
                  {item.name}
                  {(item.color || item.size) && ` (${[item.color, item.size].filter(Boolean).join(' · ')})`}
                  {' × '}{item.quantity}
                </span>
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
