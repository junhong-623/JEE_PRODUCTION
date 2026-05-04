import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const STATUSES = ['pending', 'confirmed', 'purchasing', 'shipped', 'completed']
const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  purchasing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  completed:  'bg-green-100 text-green-800',
}

export default function AdminOrdersPage() {
  const { t } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  async function load() {
    const snap = await getDocs(query(collection(db, 'cheers_orders'), orderBy('createdAt', 'desc')))
    setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleStatusChange(orderId, status) {
    await updateDoc(doc(db, 'cheers_orders', orderId), { status })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  return (
    <div>
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.orders')}</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'
            }`}>
            {s === 'all' ? `全部 (${orders.length})` : `${t(`orders.status.${s}`)} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-cheers-brown/40">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-cheers-brown/40">{t('orders.empty')}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="card overflow-hidden">
              <div className="p-4 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(e => e === order.id ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-cheers-dark-brown text-sm">{order.orderId || order.id}</p>
                    <span className={`badge-status ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t(`orders.status.${order.status}`)}
                    </span>
                  </div>
                  <p className="text-xs text-cheers-brown/50 mt-0.5">
                    {order.userName} · {order.userEmail} ·{' '}
                    {order.createdAt?.toDate?.()?.toLocaleDateString('zh-MY')}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold text-cheers-brown">RM {order.total?.toFixed(2)}</p>
                  <p className="text-xs text-cheers-brown/50">{order.items?.length} 件</p>
                </div>
              </div>

              {expanded === order.id && (
                <div className="px-4 pb-4 border-t border-cheers-cream pt-3 space-y-3">
                  {/* Items */}
                  <div>
                    <p className="text-xs font-medium text-cheers-brown mb-1.5">商品</p>
                    <div className="space-y-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-cheers-dark-brown/80">
                          <span>{item.name} × {item.quantity}</span>
                          <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery */}
                  <div>
                    <p className="text-xs font-medium text-cheers-brown mb-1">配送方式</p>
                    <p className="text-sm text-cheers-dark-brown/80">
                      {order.delivery?.type === 'face-to-face'
                        ? `面交 · ${order.delivery.location}`
                        : `邮寄 · ${order.delivery?.address}, ${order.delivery?.city}, ${order.delivery?.state} ${order.delivery?.postcode}`}
                    </p>
                    <p className="text-sm text-cheers-dark-brown/60">{order.userName} · {order.delivery?.phone}</p>
                  </div>

                  {/* Status update */}
                  <div>
                    <p className="text-xs font-medium text-cheers-brown mb-1.5">更新状态</p>
                    <div className="flex gap-2 flex-wrap">
                      {STATUSES.map(s => (
                        <button key={s} onClick={() => handleStatusChange(order.id, s)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            order.status === s ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'
                          }`}>
                          {t(`orders.status.${s}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
