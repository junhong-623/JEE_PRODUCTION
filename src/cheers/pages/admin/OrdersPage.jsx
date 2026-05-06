import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const STATUSES = ['pending', 'confirmed', 'purchasing', 'procured', 'shipped', 'completed']
const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  purchasing: 'bg-purple-100 text-purple-800',
  procured:   'bg-pink-100 text-pink-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  completed:  'bg-green-100 text-green-800',
}

const STATUS_ZH = {
  pending: '待确认', confirmed: '已接单',
  purchasing: '采购中', procured: '已采购', shipped: '已发货', completed: '已完成',
}

function buildWhatsApp(order) {
  let phone = (order.delivery?.phone || '').replace(/\D/g, '')
  if (!phone) return null
  // Normalise to Malaysian E.164 (no +): 012x → 6012x, already 60x stays
  if (phone.startsWith('0')) phone = '60' + phone.slice(1)
  else if (!phone.startsWith('60')) phone = '60' + phone
  const items = (order.items || []).map(i =>
    `• ${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}  RM${(i.price * i.quantity).toFixed(2)}`
  ).join('\n')
  const delivery = order.delivery?.type === 'face-to-face'
    ? `面交 · ${order.delivery.location}`
    : `邮寄 · ${order.delivery?.address || ''}, ${order.delivery?.city || ''} ${order.delivery?.postcode || ''}`
  const msg = `【Cheers.co 订单更新】\n订单号：${order.orderId || order.id}\n状态：${STATUS_ZH[order.status] || order.status}\n\n商品：\n${items}\n\n配送：${delivery}\n总额：RM ${order.total?.toFixed(2)}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{t('admin.orders')}</h1>
        <Link to="/admin/orders/new" className="btn-primary text-sm">+ 手动创建订单</Link>
      </div>

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
          {filtered.map(order => {
            const waLink = buildWhatsApp(order)
            return (
              <div key={order.id} className="card overflow-hidden">
                <div className="p-4 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(e => e === order.id ? null : order.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-cheers-dark-brown text-sm">{order.orderId || order.id}</p>
                      <span className={`badge-status ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {t(`orders.status.${order.status}`)}
                      </span>
                      {order.source === 'manual' && (
                        <span className="badge-status bg-orange-100 text-orange-700">手动</span>
                      )}
                      {order.isAddon && (
                        <span className="badge-status bg-orange-100 text-orange-700">加单</span>
                      )}
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
                            <span>{item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}</span>
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
                          : `邮寄 · ${order.delivery?.region === 'east' ? '东马' : '西马'} · ${[order.delivery?.address, order.delivery?.city, order.delivery?.state, order.delivery?.postcode].filter(Boolean).join(', ')}`}
                      </p>
                      <p className="text-sm text-cheers-dark-brown/60 mt-0.5">{order.userName} · {order.delivery?.phone}</p>
                    </div>

                    {order.parentOrderId && (
                      <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-orange-600">
                          📦 加单至母订单：<span className="font-medium">{order.parentOrderId}</span>
                        </p>
                      </div>
                    )}

                    {order.notes && (
                      <div>
                        <p className="text-xs font-medium text-cheers-brown mb-1">备注</p>
                        <p className="text-sm text-cheers-dark-brown/80">{order.notes}</p>
                      </div>
                    )}

                    {/* Status update + WhatsApp */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
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
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp 通知顾客
                        </a>
                      )}
                    </div>
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
