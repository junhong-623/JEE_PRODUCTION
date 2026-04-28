import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { onUserTransactions } from '../services/firestore'
import { useMallLang } from '../hooks/useMallLang'
import { useMall } from '../contexts/MallContext'
import MallNav from '../components/MallNav'
import CartDrawer from '../components/CartDrawer'

const STATUS_LABEL_EN = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
}
const STATUS_LABEL_ZH = {
  pending: '待处理', confirmed: '已确认', processing: '处理中',
  shipped: '已发货', delivered: '已送达', cancelled: '已取消',
}

export default function OrdersPage() {
  const { user } = useAuth()
  const { lang, mt } = useMallLang()
  const { config } = useMall()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [expanded, setExpanded] = useState(null)

  const statusLabel = lang === 'zh' ? STATUS_LABEL_ZH : STATUS_LABEL_EN

  useEffect(() => {
    if (!user) return
    const unsub = onUserTransactions(user.uid, setOrders)
    return unsub
  }, [user])

  if (!user) {
    return (
      <div className="mall-root">
        <MallNav />
        <div className="mall-empty" style={{ marginTop: 60 }}>
          <div className="mall-empty-icon">🔒</div>
          <div className="mall-empty-text">{mt('signInToView')}</div>
          <button style={{ marginTop: 16, color: 'var(--mall-ember)', fontWeight: 700 }} onClick={() => navigate('/mall')}>
            {mt('backToShop')}
          </button>
        </div>
        <CartDrawer />
      </div>
    )
  }

  function buildOrderMsg(order) {
    const lines = [
      `Hi! I'd like to follow up on my order 📦`,
      '',
      `📋 Order: ${order.txnId}`,
      `👤 Name: ${order.customerName}`,
      `📊 Status: ${statusLabel[order.status] || order.status}`,
      '─────────────────────',
      ...(order.items?.map(i => {
        const v = [i.size, i.design].filter(Boolean).join(', ')
        return `• ${i.name}${v ? ` (${v})` : ''} × ${i.qty}`
      }) || []),
      '─────────────────────',
      `💰 Total: RM ${Number(order.total).toFixed(2)}`,
      '',
      'Please assist, thank you! 🙏',
    ]
    return lines.join('\n')
  }

  function msgWhatsapp(order) {
    if (!config.whatsapp) return
    window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(buildOrderMsg(order))}`, '_blank')
  }

  function msgEmail(order) {
    if (!config.email) return
    const subj = encodeURIComponent(`[Order ${order.txnId}] Follow-up`)
    window.open(`mailto:${config.email}?subject=${subj}&body=${encodeURIComponent(buildOrderMsg(order))}`)
  }

  function formatDate(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString(lang === 'zh' ? 'zh-MY' : 'en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="mall-root">
      <MallNav />
      <div className="mall-orders-page">
        <h1 className="mall-orders-title">📦 {mt('myOrdersTitle')}</h1>

        {orders.length === 0 ? (
          <div className="mall-empty">
            <div className="mall-empty-icon">📦</div>
            <div className="mall-empty-text">{mt('noOrders')}</div>
            <button style={{ marginTop: 16, color: 'var(--mall-ember)', fontWeight: 700 }} onClick={() => navigate('/mall')}>
              {mt('browseProducts')}
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id}>
              <div
                className="mall-order-card"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div style={{ fontSize: 28 }}>📦</div>
                <div className="mall-order-info">
                  <div className="mall-order-txn">
                    {order.txnId}
                    <span className={`mall-status-badge mall-status-${order.status}`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                  </div>
                  <div className="mall-order-date">{formatDate(order.createdAt)}</div>
                  <div className="mall-order-items">
                    {order.items?.slice(0,2).map((it, i) => (
                      <span key={i}>{it.name} ×{it.qty}{i < Math.min(order.items.length, 2) - 1 ? ', ' : ''}</span>
                    ))}
                    {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                  </div>
                </div>
                <div className="mall-order-total">RM {Number(order.total).toFixed(2)}</div>
              </div>

              {expanded === order.id && (
                <div style={{
                  background: 'var(--mall-white)',
                  borderRadius: '0 0 var(--mall-radius) var(--mall-radius)',
                  padding: '16px 20px',
                  marginTop: -8,
                  marginBottom: 8,
                  boxShadow: '0 4px 12px var(--mall-shadow)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{mt('orderDetails')}</div>
                  {order.items?.map((it, i) => (
                    <div key={i} style={{ display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0',borderBottom:'1px solid var(--mall-border)' }}>
                      <span>{it.name} {[it.size,it.design].filter(Boolean).join(' · ')} ×{it.qty}</span>
                      <span style={{ fontWeight:700 }}>RM {(it.price * it.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:14,marginTop:10 }}>
                    <span>{mt('total')}</span>
                    <span>RM {Number(order.total).toFixed(2)}</span>
                  </div>
                  {order.address && (
                    <div style={{ marginTop:10,fontSize:13,color:'var(--mall-stone)' }}>
                      <strong>{mt('deliveryAddress')}:</strong> {order.address}
                    </div>
                  )}
                  {order.trackingNumber && order.status === 'shipped' && (
                    <div style={{ marginTop:10,padding:'10px 14px',background:'#ede9fe',borderRadius:8,fontSize:13 }}>
                      <span style={{ fontWeight:700,color:'#5b21b6' }}>📦 {lang==='zh'?'追踪号码':'Tracking Number'}:</span>
                      <span style={{ marginLeft:8,color:'#3a3a3a',fontWeight:600 }}>{order.trackingNumber}</span>
                    </div>
                  )}
                  {order.cancelRemark && order.status === 'cancelled' && (
                    <div style={{ marginTop:10,padding:'10px 14px',background:'#fee2e2',borderRadius:8,fontSize:13 }}>
                      <span style={{ fontWeight:700,color:'#991b1b' }}>❌ {lang==='zh'?'取消原因':'Cancellation Reason'}:</span>
                      <span style={{ marginLeft:8,color:'#3a3a3a' }}>{order.cancelRemark}</span>
                    </div>
                  )}
                  {order.notes && (
                    <div style={{ marginTop:6,fontSize:12,color:'var(--mall-stone-soft)' }}>
                      {mt('notes')}: {order.notes}
                    </div>
                  )}

                  {/* Contact buttons */}
                  {(config.whatsapp || config.email) && (
                    <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--mall-border)' }}>
                      <div style={{ fontSize:11,fontWeight:700,color:'#6b6b6b',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5 }}>
                        {lang==='zh' ? '联系我们' : 'Contact Us About This Order'}
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {config.whatsapp && (
                          <button
                            onClick={() => msgWhatsapp(order)}
                            style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'1.5px solid #25d366',background:'#f0fdf4',color:'#166534',fontWeight:700,fontSize:12,cursor:'pointer' }}
                          >
                            💬 WhatsApp
                          </button>
                        )}
                        {config.email && (
                          <button
                            onClick={() => msgEmail(order)}
                            style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'1.5px solid #e0ddd7',background:'#f7f5f0',color:'#0d0d0d',fontWeight:700,fontSize:12,cursor:'pointer' }}
                          >
                            📧 Email
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <CartDrawer />
    </div>
  )
}
