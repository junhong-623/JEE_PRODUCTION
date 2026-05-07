import React, { useEffect, useState } from 'react'
import { getFirestore, collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { useNavigate, Link } from 'react-router-dom'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'

const db = getFirestore(app)

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

const ADDON_ELIGIBLE = ['pending', 'confirmed', 'purchasing']

export default function OrdersPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!user) return
    getDocs(query(
      collection(db, 'cheers_orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )).then(snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).finally(() => setLoading(false))
  }, [user])

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const tabOrders = orders.filter(o => matchTab(o, activeTab))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-5">{t('orders.title')}</h1>

      {/* Status tabs */}
      <div className="flex overflow-x-auto border-b border-cheers-cream mb-5 no-scrollbar">
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
        <div className="text-center py-20 text-cheers-brown/50">
          <div className="text-5xl mb-3">📦</div>
          <p className="mb-4">{activeTab === 'all' ? t('orders.empty') : (lang === 'zh' ? '此分类暂无订单' : 'No orders in this category')}</p>
          {activeTab === 'all' && (
            <button onClick={() => navigate('/products')} className="btn-primary">
              {lang === 'zh' ? '去逛逛' : 'Browse Products'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tabOrders.map(order => {
            const isOpen = expanded === order.id
            const isFaceToFace = order.delivery?.type === 'face-to-face'
            const canAddon = ADDON_ELIGIBLE.includes(order.status) && !order.isAddon
            const canCancel = order.status === 'pending' && !order.paymentSubmitted
            const canAddItems = order.status === 'pending' && !order.paymentSubmitted

            return (
              <div key={order.id} className="card overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-cheers-dark-brown text-sm">{order.orderId || order.id}</p>
                      <span className={`badge-status ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {t(`orders.status.${order.status}`) || order.status}
                      </span>
                      {order.isAddon && (
                        <span className="badge-status bg-orange-100 text-orange-700">
                          {lang === 'zh' ? '加单' : 'Add-on'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cheers-brown/50 mt-0.5">
                      {order.createdAt?.toDate?.()?.toLocaleDateString(lang === 'zh' ? 'zh-MY' : 'en-MY') || '—'}
                      {' · '}{order.items?.length} {lang === 'zh' ? '件' : 'items'}
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
                    <span className="font-semibold text-cheers-brown text-sm">
                      {t('common.rmPrefix')} {order.total?.toFixed(2)}
                    </span>
                    <span className="text-cheers-brown/40 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-cheers-cream px-4 pb-4 pt-3 space-y-4">
                    {order.parentOrderId && (
                      <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5">
                        {lang === 'zh' ? '加单至' : 'Add-on to'}: <span className="font-medium">{order.parentOrderId}</span>
                      </p>
                    )}

                    <div>
                      <p className="text-xs font-medium text-cheers-brown mb-2">{lang === 'zh' ? '商品明细' : 'Items'}</p>
                      <div className="space-y-1.5">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-cheers-dark-brown/80 truncate flex-1 mr-2">
                              {item.name}{item.size && <span className="text-cheers-brown/60 ml-1">({item.size})</span>}
                              {' × '}{item.quantity}
                            </span>
                            <span className="text-cheers-dark-brown flex-shrink-0">
                              {t('common.rmPrefix')} {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-cheers-brown mb-1">{lang === 'zh' ? '配送方式' : 'Delivery'}</p>
                      {isFaceToFace ? (
                        <p className="text-sm text-cheers-dark-brown/80">{t('checkout.faceToFace')} · {order.delivery.location}</p>
                      ) : (
                        <p className="text-sm text-cheers-dark-brown/80">
                          {t('checkout.shipping')}
                          {order.delivery?.region && <span className="text-cheers-brown/60 ml-1">({order.delivery.region === 'east' ? (lang === 'zh' ? '东马' : 'East MY') : (lang === 'zh' ? '西马' : 'West MY')})</span>}
                          <br />
                          <span className="text-cheers-brown/60 text-xs">{[order.delivery?.address, order.delivery?.city, order.delivery?.state, order.delivery?.postcode].filter(Boolean).join(', ')}</span>
                        </p>
                      )}
                    </div>

                    <div className="border-t border-cheers-cream pt-3 space-y-1">
                      <div className="flex justify-between text-sm text-cheers-brown/70">
                        <span>{t('cart.subtotal')}</span><span>{t('common.rmPrefix')} {order.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-cheers-brown/70">
                        <span>{t('cart.shipping')}</span>
                        <span>{order.shippingFee === 0 ? t('cart.free') : `${t('common.rmPrefix')} ${order.shippingFee?.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-cheers-dark-brown pt-1 border-t border-cheers-cream">
                        <span>{t('cart.total')}</span><span>{t('common.rmPrefix')} {order.total?.toFixed(2)}</span>
                      </div>
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
                        📦 {lang === 'zh' ? '加单（免邮费合并配送）' : 'Add-on (free shipping, same address)'}
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
