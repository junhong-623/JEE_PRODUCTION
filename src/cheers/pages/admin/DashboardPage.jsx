import React, { useEffect, useState } from 'react'
import { getFirestore, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  purchasing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  completed:  'bg-green-100 text-green-800',
}

export default function DashboardPage() {
  const { t } = useLang()
  const [orders, setOrders] = useState([])
  const [counts, setCounts] = useState({ total: 0, pending: 0, products: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [recentSnap, allSnap, pendingSnap, prodSnap] = await Promise.all([
        getDocs(query(collection(db, 'cheers_orders'), orderBy('createdAt', 'desc'), limit(10))),
        getDocs(collection(db, 'cheers_orders')),
        getDocs(query(collection(db, 'cheers_orders'), where('status', '==', 'pending'))),
        getDocs(collection(db, 'cheers_products')),
      ])
      setOrders(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setCounts({ total: allSnap.size, pending: pendingSnap.size, products: prodSnap.size })
      setLoading(false)
    }
    load()
  }, [])

  const stats = [
    { label: t('admin.orders'), value: counts.total, icon: '📦', to: '/admin/orders' },
    { label: t('orders.status.pending'), value: counts.pending, icon: '⏳', to: '/admin/orders' },
    { label: t('admin.products'), value: counts.products, icon: '🛍️', to: '/admin/products' },
  ]

  return (
    <div>
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">{t('admin.dashboard')}</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="card p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-cheers-dark-brown">{s.value}</div>
            <div className="text-xs text-cheers-brown/60 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-cheers-cream">
          <h2 className="font-medium text-cheers-dark-brown">{t('admin.orders')}</h2>
          <Link to="/admin/orders" className="text-xs text-cheers-brown hover:underline">{t('home.viewAll')}</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-cheers-brown/40">{t('common.loading')}</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-cheers-brown/40">{t('orders.empty')}</div>
        ) : (
          <div className="divide-y divide-cheers-cream">
            {orders.map(order => (
              <div key={order.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cheers-dark-brown truncate">{order.orderId || order.id}</p>
                  <p className="text-xs text-cheers-brown/50">{order.userName} · {order.items?.length} items</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-medium text-cheers-brown text-sm">RM {order.total?.toFixed(2)}</span>
                  <span className={`badge-status ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {t(`orders.status.${order.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
