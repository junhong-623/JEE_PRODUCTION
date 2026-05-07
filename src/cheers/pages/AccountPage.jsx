import React, { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { getAuth, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import CouponTicket from '../components/ui/CouponTicket'

const db = getFirestore(app)

const MY_STATES = [
  'Kuala Lumpur', 'Putrajaya', 'Labuan',
  'Selangor', 'Johor', 'Kedah', 'Kelantan', 'Melaka',
  'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Terengganu',
  'Sabah', 'Sarawak',
]
const auth = getAuth(app)

function detectRegion(postcode) {
  const n = parseInt(postcode, 10)
  if (!postcode || postcode.length < 5 || isNaN(n)) return null
  if (n >= 87000 && n <= 98999) return 'east'
  if (n >= 1000 && n <= 86999) return 'west'
  return null
}

const STATUS_COLORS = {
  pending:      'bg-yellow-100 text-yellow-800',
  confirmed:    'bg-blue-100 text-blue-800',
  purchasing:   'bg-purple-100 text-purple-800',
  shipped:      'bg-indigo-100 text-indigo-800',
  completed:    'bg-green-100 text-green-800',
  cancelled:    'bg-red-100 text-red-700',
  return_refund:'bg-orange-100 text-orange-700',
}

const ORDER_TABS = [
  { key: 'all',          zh: '全部',     en: 'All' },
  { key: 'to_pay',       zh: '待付款',   en: 'To Pay' },
  { key: 'to_ship',      zh: '待发货',   en: 'To Ship' },
  { key: 'to_receive',   zh: '待收货',   en: 'To Receive' },
  { key: 'completed',    zh: '已完成',   en: 'Completed' },
  { key: 'cancelled',    zh: '已取消',   en: 'Cancelled' },
  { key: 'return_refund',zh: '退款退货', en: 'Refund' },
]

function matchTab(order, tab) {
  switch (tab) {
    case 'to_pay':        return order.status === 'pending' && !order.paymentSubmitted
    case 'to_ship':       return (order.status === 'pending' && !!order.paymentSubmitted) || ['confirmed','purchasing','procured'].includes(order.status)
    case 'to_receive':    return order.status === 'shipped'
    case 'completed':     return order.status === 'completed'
    case 'cancelled':     return order.status === 'cancelled'
    case 'return_refund': return order.status === 'return_refund'
    default:              return true
  }
}

const TABS = [
  { key: 'profile',  zh: '个人资料', en: 'Profile',   icon: '👤' },
  { key: 'address',  zh: '收货地址', en: 'Address',   icon: '📍' },
  { key: 'orders',   zh: '我的订单', en: 'Orders',    icon: '📦' },
  { key: 'coupons',  zh: '优惠券',   en: 'Coupons',  icon: '🎫' },
  { key: 'wishlist', zh: '收藏清单', en: 'Wishlist',  icon: '♡' },
]

function ProfileTab({ user, lang }) {
  const [name, setName] = useState(user.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      await setDoc(doc(db, 'cheers_users', user.uid), { displayName: name }, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-md">
      <div>
        <label className="label">{lang === 'zh' ? '姓名' : 'Name'}</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">{lang === 'zh' ? '电子邮件' : 'Email'}</label>
        <input className="input bg-cheers-cream/20 cursor-not-allowed" value={user.email || ''} readOnly />
        <p className="text-xs text-cheers-brown/40 mt-1">{lang === 'zh' ? '邮箱不可修改' : 'Email cannot be changed'}</p>
      </div>
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2">
        {saving ? '…' : saved ? '✓ ' + (lang === 'zh' ? '已保存' : 'Saved') : (lang === 'zh' ? '保存' : 'Save')}
      </button>
    </form>
  )
}

function AddressTab({ user, lang }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', postcode: '', city: '', state: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const region = detectRegion(form.postcode)

  useEffect(() => {
    getDoc(doc(db, 'cheers_addresses', user.uid)).then(snap => { if (snap.exists()) setForm(snap.data()) })
  }, [user.uid])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'cheers_addresses', user.uid), form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 max-w-md">
      <p className="text-sm text-cheers-brown/60">{lang === 'zh' ? '保存后在结账时自动填写' : 'Auto-filled at checkout after saving'}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">{lang === 'zh' ? '收件姓名' : 'Name'}</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">{lang === 'zh' ? '电话' : 'Phone'}</label>
          <input className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">{lang === 'zh' ? '详细地址' : 'Address'}</label>
        <textarea className="input resize-none" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">{lang === 'zh' ? '邮编' : 'Postcode'}</label>
          <input className="input" value={form.postcode} maxLength={5}
            onChange={e => setForm(f => ({ ...f, postcode: e.target.value.replace(/\D/g, '') }))} />
          {form.postcode.length === 5 && (
            <p className={`text-xs mt-1 font-medium ${region ? 'text-green-600' : 'text-red-400'}`}>
              {region === 'east' ? '🏝️ 东马' : region === 'west' ? '🇲🇾 西马' : lang === 'zh' ? '无效邮编' : 'Invalid'}
            </p>
          )}
        </div>
        <div>
          <label className="label">{lang === 'zh' ? '城市' : 'City'}</label>
          <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div>
          <label className="label">{lang === 'zh' ? '州属' : 'State'}</label>
          <select className="input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
            <option value="">{lang === 'zh' ? '选择州属' : 'Select state'}</option>
            {MY_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2">
        {saving ? '…' : saved ? '✓ ' + (lang === 'zh' ? '已保存' : 'Saved') : (lang === 'zh' ? '保存地址' : 'Save Address')}
      </button>
    </form>
  )
}

const ADDON_ELIGIBLE = ['pending', 'confirmed', 'purchasing']

function OrdersTab({ user, lang, t }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  function handleAddon(order) {
    sessionStorage.setItem('cheers_addon', JSON.stringify({
      parentOrderId: order.orderId || order.id,
      parentDocId: order.id,
      delivery: order.delivery,
    }))
    navigate('/products')
  }

  function handleContinueShopping(order) {
    sessionStorage.setItem('cheers_update_order', JSON.stringify({
      orderDocId: order.id,
      orderId: order.orderId || order.id,
      delivery: order.delivery,
      existingItems: order.items,
      existingSubtotal: order.subtotal,
      existingShippingFee: order.shippingFee || 0,
    }))
    navigate('/products')
  }

  async function handleCancel(orderId) {
    if (!confirm(lang === 'zh' ? '确认取消此订单？取消后不可恢复。' : 'Cancel this order? This cannot be undone.')) return
    await updateDoc(doc(db, 'cheers_orders', orderId), { status: 'cancelled' })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
  }

  useEffect(() => {
    getDocs(query(collection(db, 'cheers_orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')))
      .then(snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [user.uid])

  if (loading) return <div className="py-10 text-center text-cheers-brown/40">{t('common.loading')}</div>

  if (!orders.length) return (
    <div className="py-16 text-center text-cheers-brown/50">
      <div className="text-5xl mb-3">📦</div>
      <p className="mb-4">{t('orders.empty')}</p>
      <Link to="/products" className="btn-primary">{lang === 'zh' ? '去逛逛' : 'Browse Products'}</Link>
    </div>
  )

  const tabOrders = orders.filter(o => matchTab(o, activeTab))

  return (
    <div>
      {/* Status tabs */}
      <div className="flex overflow-x-auto border-b border-cheers-cream mb-4 no-scrollbar">
        {ORDER_TABS.map(tab => {
          const count = tab.key === 'all' ? orders.length : orders.filter(o => matchTab(o, tab.key)).length
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-cheers-brown text-cheers-brown'
                  : 'border-transparent text-cheers-brown/50 hover:text-cheers-brown'
              }`}>
              {lang === 'zh' ? tab.zh : tab.en}
              {count > 0 && <span className="ml-1 text-xs opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {tabOrders.length === 0 ? (
        <div className="py-12 text-center text-cheers-brown/40">
          {activeTab === 'all' ? t('orders.empty') : (lang === 'zh' ? '此分类暂无订单' : 'No orders here')}
        </div>
      ) : (
        <div className="space-y-3">
          {tabOrders.map(order => {
            const isOpen = expanded === order.id
            const canCancel = order.status === 'pending' && !order.paymentSubmitted
            const canAddItems = order.status === 'pending' && !order.paymentSubmitted
            const canAddon = ADDON_ELIGIBLE.includes(order.status) && !order.isAddon
            return (
              <div key={order.id} className="card overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-cheers-dark-brown text-sm">{order.orderId || order.id}</p>
                      <span className={`badge-status ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {t(`orders.status.${order.status}`) || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-cheers-brown/50 mt-0.5">
                      {order.createdAt?.toDate?.()?.toLocaleDateString(lang === 'zh' ? 'zh-MY' : 'en-MY') || '—'} · {order.items?.length} {lang === 'zh' ? '件' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canCancel && (
                      <Link to={`/payment/${order.id}`} onClick={e => e.stopPropagation()}
                        className="text-xs btn-primary py-1 px-2.5">
                        {lang === 'zh' ? '前往付款' : 'Pay Now'}
                      </Link>
                    )}
                    {order.paymentSubmitted && (
                      <span className="text-xs text-green-600 font-medium">💰 {lang === 'zh' ? '已付款' : 'Paid'}</span>
                    )}
                    <span className="font-semibold text-cheers-brown text-sm">RM {order.total?.toFixed(2)}</span>
                    <span className="text-cheers-brown/40 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-cheers-cream px-4 pb-4 pt-3 space-y-3">
                    <div className="space-y-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-cheers-dark-brown/80 flex-1 mr-2">
                            {item.name}
                            {(item.color || item.size) && ` (${[item.color, item.size].filter(Boolean).join(' · ')})`}
                            {' × '}{item.quantity}
                          </span>
                          <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-cheers-brown/60">
                      {order.delivery?.type === 'face-to-face'
                        ? `面交 · ${order.delivery.location}`
                        : [order.delivery?.address, order.delivery?.city, order.delivery?.state].filter(Boolean).join(', ')}
                    </p>
                    {order.coupon && (
                      <p className="text-sm text-green-600">🎫 {order.coupon.code} 已使用</p>
                    )}
                    {order.parentOrderId && (
                      <p className="text-xs text-orange-600">{lang === 'zh' ? '加单至' : 'Add-on to'}: {order.parentOrderId}</p>
                    )}
                    <div className="flex justify-between font-semibold text-cheers-dark-brown pt-2 border-t border-cheers-cream">
                      <span>{t('cart.total')}</span><span>RM {order.total?.toFixed(2)}</span>
                    </div>
                    {canCancel && (
                      <Link to={`/payment/${order.id}`}
                        className="w-full btn-primary text-sm py-2.5 text-center block">
                        💳 {lang === 'zh' ? '前往付款' : 'Pay Now'}
                      </Link>
                    )}
                    {canAddItems && (
                      <div className="flex gap-2">
                        <button onClick={e => { e.stopPropagation(); handleContinueShopping(order) }}
                          className="flex-1 btn-secondary text-sm py-2">
                          🛍 {lang === 'zh' ? '继续购物（加入此单）' : 'Add More Items'}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleCancel(order.id) }}
                          className="flex-1 text-sm py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                          {lang === 'zh' ? '取消订单' : 'Cancel Order'}
                        </button>
                      </div>
                    )}
                    {canAddon && !canAddItems && (
                      <button onClick={e => { e.stopPropagation(); handleAddon(order) }}
                        className="w-full btn-secondary text-sm py-2">
                        📦 {lang === 'zh' ? '加单（免邮费合并配送）' : 'Add-on (free shipping)'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CouponsTab({ user, lang }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'cheers_user_coupons'), where('userId', '==', user.uid)))
      .then(snap => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.used ? 1 : 0) - (b.used ? 1 : 0))))
      .finally(() => setLoading(false))
  }, [user.uid])

  if (loading) return <div className="py-10 text-center text-cheers-brown/40">加载中…</div>

  if (!coupons.length) return (
    <div className="py-16 text-center text-cheers-brown/50">
      <div className="text-4xl mb-3">🎫</div>
      <p>{lang === 'zh' ? '暂无优惠券' : 'No coupons yet'}</p>
    </div>
  )

  return (
    <div className="space-y-4 py-2">
      {coupons.map(coupon => (
        <div key={coupon.id}>
          <CouponTicket coupon={coupon} lang={lang} dim={coupon.used} />
          {!coupon.used && (
            <p className="text-xs text-green-600 text-center mt-2">{lang === 'zh' ? '✓ 结账时可使用' : '✓ Available at checkout'}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function WishlistTab({ lang, t }) {
  const { items, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (!items.length) return (
    <div className="py-16 text-center text-cheers-brown/50">
      <div className="text-4xl mb-3">♡</div>
      <p className="mb-4">{t('wishlist.empty')}</p>
      <Link to="/products" className="btn-primary">{lang === 'zh' ? '去逛逛' : 'Browse Products'}</Link>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(item => (
        <div key={item.productId} className="card p-4 flex items-center gap-4">
          <Link to={`/products/${item.productId}`} className="flex-shrink-0">
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
              : <div className="w-14 h-14 rounded-lg bg-cheers-cream/40 flex items-center justify-center text-2xl">🛍</div>}
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/products/${item.productId}`}>
              <p className="font-medium text-cheers-dark-brown text-sm line-clamp-2 hover:text-cheers-brown">
                {typeof item.name === 'object' ? (item.name?.[lang] || item.name?.zh || '') : (item.name || '')}
              </p>
            </Link>
            <p className="text-cheers-brown text-sm mt-0.5">RM {item.price?.toFixed(2)}</p>
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button onClick={() => addToCart(item)} className="btn-primary text-xs py-1.5 px-3">{t('wishlist.moveToCart')}</button>
            <button onClick={() => removeFromWishlist(item.productId)} className="text-xs text-red-400 hover:text-red-600 text-center">{t('wishlist.remove')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AccountPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'profile'

  function setTab(key) { setSearchParams({ tab: key }) }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{lang === 'zh' ? '我的账号' : 'My Account'}</h1>
        <p className="text-sm text-cheers-brown/60 hidden sm:block">{user.email}</p>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto mb-6 border-b border-cheers-cream no-scrollbar">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              tab === tb.key ? 'border-cheers-brown text-cheers-brown' : 'border-transparent text-cheers-brown/50 hover:text-cheers-brown'
            }`}>
            <span>{tb.icon}</span>
            <span>{lang === 'zh' ? tb.zh : tb.en}</span>
          </button>
        ))}
      </div>

      {tab === 'profile'  && <ProfileTab  user={user} lang={lang} t={t} />}
      {tab === 'address'  && <AddressTab  user={user} lang={lang} />}
      {tab === 'orders'   && <OrdersTab   user={user} lang={lang} t={t} />}
      {tab === 'coupons'  && <CouponsTab  user={user} lang={lang} />}
      {tab === 'wishlist' && <WishlistTab lang={lang} t={t} />}
    </div>
  )
}
