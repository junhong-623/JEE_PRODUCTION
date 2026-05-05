import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAuth, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import CouponTicket from '../components/ui/CouponTicket'

const db = getFirestore(app)
const auth = getAuth(app)

function detectRegion(postcode) {
  const n = parseInt(postcode, 10)
  if (!postcode || postcode.length < 5 || isNaN(n)) return null
  if (n >= 87000 && n <= 98999) return 'east'
  if (n >= 1000 && n <= 86999) return 'west'
  return null
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  purchasing: 'bg-purple-100 text-purple-800', shipped: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
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
          <input className="input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2">
        {saving ? '…' : saved ? '✓ ' + (lang === 'zh' ? '已保存' : 'Saved') : (lang === 'zh' ? '保存地址' : 'Save Address')}
      </button>
    </form>
  )
}

function OrdersTab({ user, lang, t }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

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

  return (
    <div className="space-y-3">
      {orders.map(order => {
        const isOpen = expanded === order.id
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
                <span className="font-semibold text-cheers-brown text-sm">RM {order.total?.toFixed(2)}</span>
                <span className="text-cheers-brown/40 text-xs">{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-cheers-cream px-4 pb-4 pt-3 space-y-3">
                <div className="space-y-1">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-cheers-dark-brown/80 flex-1 mr-2">{item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}</span>
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
                <div className="flex justify-between font-semibold text-cheers-dark-brown pt-2 border-t border-cheers-cream">
                  <span>{t('cart.total')}</span><span>RM {order.total?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
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
              <p className="font-medium text-cheers-dark-brown text-sm line-clamp-2 hover:text-cheers-brown">{item.name}</p>
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
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-cheers-cream">
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
