import React, { useEffect, useState } from 'react'
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
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

export default function OrdersPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

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
          <p>{t('orders.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-cheers-dark-brown text-sm">{order.orderId || order.id}</p>
                  <p className="text-xs text-cheers-brown/50 mt-0.5">
                    {order.createdAt?.toDate?.()?.toLocaleDateString(lang === 'zh' ? 'zh-MY' : 'en-MY') || '—'}
                  </p>
                </div>
                <span className={`badge-status ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {t(`orders.status.${order.status}`) || order.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-cheers-dark-brown/70">
                    <span className="truncate flex-1 mr-2">{item.name} × {item.quantity}</span>
                    <span className="flex-shrink-0">{t('common.rmPrefix')} {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-cheers-cream">
                <span className="text-xs text-cheers-brown/50">
                  {order.delivery?.type === 'face-to-face'
                    ? `${t('checkout.faceToFace')} · ${order.delivery.location}`
                    : t('checkout.shipping')}
                </span>
                <span className="font-semibold text-cheers-brown">
                  {t('common.rmPrefix')} {order.total?.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
