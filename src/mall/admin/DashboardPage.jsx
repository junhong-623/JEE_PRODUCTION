import { useState, useEffect } from 'react'
import { onProducts, onCategories, onTransactions } from '../services/firestore'

const STATUS_COLOR = {
  pending:'#fef3c7,#92400e', confirmed:'#d1fae5,#065f46',
  processing:'#dbeafe,#1e40af', shipped:'#ede9fe,#5b21b6',
  delivered:'#d1fae5,#065f46', cancelled:'#fee2e2,#991b1b',
}

export default function DashboardPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const u1 = onProducts(setProducts)
    const u2 = onCategories(setCategories)
    const u3 = onTransactions(setTransactions)
    return () => { u1(); u2(); u3() }
  }, [])

  const totalRevenue = transactions.filter(t => t.status !== 'cancelled').reduce((s,t) => s + (t.total||0), 0)
  const pending = transactions.filter(t => t.status === 'pending').length
  const recent = transactions.slice(0, 5)

  function formatDate(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-MY', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
  }

  const stats = [
    { icon:'🏕️', label:'Products',     val: products.length,     sub:`${products.filter(p=>p.visible!==false).length} visible` },
    { icon:'🗂️', label:'Categories',   val: categories.length,   sub:`${categories.filter(c=>c.visible!==false).length} active` },
    { icon:'📦', label:'Orders',        val: transactions.length, sub:`${pending} pending` },
    { icon:'💰', label:'Total Revenue', val:`RM ${totalRevenue.toFixed(2)}`, sub:'excl. cancelled' },
  ]

  return (
    <div style={{ padding:'24px', maxWidth:900 }}>
      <h1 style={{ fontSize:22,fontWeight:900,color:'#0d0d0d',marginBottom:4 }}>Dashboard</h1>
      <p style={{ fontSize:13,color:'#6b6b6b',marginBottom:24 }}>Welcome to JeeProd Mall Admin</p>

      {/* Stats grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14,marginBottom:28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'white',borderRadius:12,padding:'16px 18px',boxShadow:'0 2px 8px rgba(26,42,24,0.1)' }}>
            <div style={{ fontSize:26,marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22,fontWeight:900,color:'#0d0d0d' }}>{s.val}</div>
            <div style={{ fontSize:12,fontWeight:700,color:'#4a5240',marginBottom:2 }}>{s.label}</div>
            <div style={{ fontSize:11,color:'#6b6b6b' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background:'white',borderRadius:12,padding:'18px',boxShadow:'0 2px 8px rgba(26,42,24,0.1)' }}>
        <h2 style={{ fontSize:15,fontWeight:800,marginBottom:14,color:'#0d0d0d' }}>Recent Orders</h2>
        {recent.length === 0 ? (
          <p style={{ color:'#6b6b6b',fontSize:13 }}>No orders yet.</p>
        ) : (
          recent.map(t => {
            const [bg,fg] = (STATUS_COLOR[t.status]||'#f3f4f6,#374151').split(',')
            return (
              <div key={t.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #e0d8c8' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'monospace',fontSize:13,fontWeight:700,color:'#0d0d0d' }}>{t.txnId}</div>
                  <div style={{ fontSize:11,color:'#6b6b6b' }}>{formatDate(t.createdAt)} · {t.customerName}</div>
                </div>
                <span style={{ background:bg,color:fg,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:8 }}>
                  {t.status}
                </span>
                <span style={{ fontWeight:800,color:'#e06820',fontSize:13 }}>RM {Number(t.total).toFixed(2)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
