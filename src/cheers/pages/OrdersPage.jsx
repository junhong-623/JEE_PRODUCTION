import React, { useEffect, useState } from 'react'
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { useNavigate, Link } from 'react-router-dom'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'

const db = getFirestore(app)

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  purchasing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  completed:  'bg-green-100 text-green-800',
}

const ADDON_ELIGIBLE = ['pending', 'confirmed', 'purchasing']

export default function OrdersPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-cheers-brown/50">
          <div className="text-5xl mb-3">📦</div>
          <p className="mb-4">{t('orders.empty')}</p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            {lang === 'zh' ? '去逛逛' : 'Browse Products'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const isOpen = expanded === order.id
            const isFaceToFace = order.delivery?.type === 'face-to-face'
            const canAddon = ADDON_ELIGIBLE.includes(order.status) && !order.isAddon

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
                    {order.status === 'pending' && !order.paymentSubmitted && (
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

                    {order.status === 'pending' && !order.paymentSubmitted && (
                      <Link to={`/payment/${order.id}`}
                        className="w-full btn-primary text-sm py-2.5 text-center block">
                        💳 {lang === 'zh' ? '前往付款' : 'Pay Now'}
                      </Link>
                    )}
                    {canAddon && (
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
