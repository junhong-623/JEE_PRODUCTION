import { useState, useEffect } from 'react'
import { onTransactions, updateTransaction } from '../services/firestore'

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled']
const STATUS_COLOR = {
  pending:'#fef3c7,#92400e', confirmed:'#d1fae5,#065f46',
  processing:'#dbeafe,#1e40af', shipped:'#ede9fe,#5b21b6',
  delivered:'#d1fae5,#065f46', cancelled:'#fee2e2,#991b1b',
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editAddr, setEditAddr] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editTracking, setEditTracking] = useState('')
  const [editRemark, setEditRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { return onTransactions(setTxns) }, [])

  const filtered = filter === 'all' ? txns : txns.filter(t => t.status === filter)

  function openDetail(t) {
    setSelected(t)
    setEditAddr(t.address || '')
    setEditStatus(t.status || 'pending')
    setEditTracking(t.trackingNumber || '')
    setEditRemark(t.cancelRemark || '')
  }

  async function saveDetail() {
    if (!selected) return
    setSaving(true)
    try {
      const update = {
        address: editAddr,
        status: editStatus,
        trackingNumber: editStatus === 'shipped' ? editTracking.trim() : (selected.trackingNumber || ''),
        cancelRemark:   editStatus === 'cancelled' ? editRemark.trim() : (selected.cancelRemark || ''),
      }
      await updateTransaction(selected.id, update)
      setMsg('Updated ✓')
      setSelected(s => ({ ...s, ...update }))
    } catch(e) { setMsg('Error: ' + e.message) }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  function formatDate(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-MY', { day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' })
  }

  function badge(status) {
    const [bg,fg] = (STATUS_COLOR[status]||'#f3f4f6,#374151').split(',')
    return <span style={{ background:bg,color:fg,fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:8 }}>{status}</span>
  }

  return (
    <div style={{ padding:24, maxWidth:1000 }}>
      <h1 style={{ fontSize:22,fontWeight:900,color:'#0d0d0d',marginBottom:16 }}>Transactions</h1>

      {/* Filter tabs */}
      <div style={{ display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' }}>
        {['all',...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding:'5px 14px',borderRadius:16,fontSize:12,fontWeight:600,cursor:'pointer',
            border:`1.5px solid ${filter===s?'#e8440a':'#e0ddd7'}`,
            background:filter===s?'#e8440a':'white',
            color:filter===s?'white':'#3a3a3a',
            textTransform:'capitalize',
          }}>{s} {s!=='all' && `(${txns.filter(t=>t.status===s).length})`}</button>
        ))}
      </div>

      {msg && <div style={{ background:'#d1fae5',color:'#065f46',borderRadius:8,padding:'8px 14px',marginBottom:14,fontSize:13 }}>{msg}</div>}

      <div style={{ background:'white',borderRadius:12,boxShadow:'0 2px 8px rgba(13,13,13,0.08)',overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 80px',gap:10,padding:'10px 18px',borderBottom:'2px solid #e0d8c8',fontSize:11,fontWeight:800,color:'#3a3a3a',textTransform:'uppercase',letterSpacing:0.6 }}>
          <span>Order</span><span>Customer</span><span>Date</span><span>Total</span><span>Status</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:40,textAlign:'center',color:'#6b6b6b' }}>No transactions found.</div>
        ) : filtered.map(t => (
          <div
            key={t.id}
            onClick={() => openDetail(t)}
            style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 80px',gap:10,padding:'12px 18px',borderBottom:'1px solid #e0d8c8',cursor:'pointer',transition:'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f7f5f0'}
            onMouseLeave={e => e.currentTarget.style.background='white'}
          >
            <div>
              <div style={{ fontFamily:'monospace',fontSize:12,fontWeight:700,color:'#0d0d0d' }}>{t.txnId}</div>
              <div style={{ fontSize:11,color:'#6b6b6b' }}>{t.items?.length||0} item{t.items?.length!==1?'s':''}</div>
            </div>
            <div style={{ fontSize:13,color:'#0d0d0d' }}>
              <div style={{ fontWeight:600 }}>{t.customerName}</div>
              <div style={{ fontSize:11,color:'#6b6b6b' }}>{t.contactMethod==='whatsapp'?'💬':'📧'} {t.customerContact}</div>
            </div>
            <div style={{ fontSize:12,color:'#6b6b6b' }}>{formatDate(t.createdAt)}</div>
            <div style={{ fontWeight:900,color:'#e06820',fontSize:14 }}>RM {Number(t.total).toFixed(2)}</div>
            <div>{badge(t.status)}</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <>
          <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200 }} onClick={() => setSelected(null)} />
          <div style={{ position:'fixed',top:0,right:0,bottom:0,width:'min(500px,100vw)',background:'white',zIndex:201,overflowY:'auto',boxShadow:'-4px 0 20px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column' }}>
            <div style={{ padding:'16px 20px',background:'#0d0d0d',color:'white',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0 }}>
              <div>
                <div style={{ fontFamily:'monospace',fontSize:14,fontWeight:700 }}>{selected.txnId}</div>
                <div style={{ fontSize:11,opacity:0.7,marginTop:2 }}>{formatDate(selected.createdAt)}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'rgba(255,255,255,0.15)',border:'none',color:'white',width:32,height:32,borderRadius:'50%',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ flex:1,overflowY:'auto',padding:20,color:'#0d0d0d' }}>
              {/* Customer */}
              <Section title="Customer">
                <Row label="Name">{selected.customerName}</Row>
                {selected.customerWhatsapp && <Row label="WhatsApp">💬 {selected.customerWhatsapp}</Row>}
                {selected.customerEmail    && <Row label="Email">📧 {selected.customerEmail}</Row>}
                {!selected.customerWhatsapp && !selected.customerEmail && (
                  <Row label="Contact">{selected.contactMethod==='whatsapp'?'💬 ':'📧 '}{selected.customerContact}</Row>
                )}
                {selected.notes && <Row label="Notes">{selected.notes}</Row>}
              </Section>

              {/* Items */}
              <Section title="Order Items">
                {selected.items?.map((it,i) => (
                  <div key={i} style={{ display:'flex',justifyContent:'space-between',fontSize:13,padding:'6px 0',borderBottom:'1px solid #e0d8c8' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{it.name}</div>
                      {(it.size||it.design) && <div style={{ fontSize:11,color:'#6b6b6b' }}>{[it.size,it.design].filter(Boolean).join(' · ')}</div>}
                      <div style={{ fontSize:11,color:'#6b6b6b' }}>×{it.qty} @ RM {Number(it.price).toFixed(2)}</div>
                    </div>
                    <div style={{ fontWeight:700 }}>RM {(it.price*it.qty).toFixed(2)}</div>
                  </div>
                ))}
                <div style={{ display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:15,marginTop:10 }}>
                  <span>Total</span>
                  <span style={{ color:'#e06820' }}>RM {Number(selected.total).toFixed(2)}</span>
                </div>
              </Section>

              {/* Logistics info (read-only, shown if already set) */}
              {selected.trackingNumber && selected.status === 'shipped' && (
                <Section title="Logistics">
                  <Row label="Tracking">{selected.trackingNumber}</Row>
                </Section>
              )}
              {selected.cancelRemark && selected.status === 'cancelled' && (
                <Section title="Cancellation">
                  <Row label="Remark">{selected.cancelRemark}</Row>
                </Section>
              )}

              {/* Edit section */}
              <Section title="Update Order">
                <div style={{ marginBottom:12 }}>
                  <label style={Label}>Status</label>
                  <select style={Input} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ textTransform:'capitalize' }}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>

                {/* Tracking number — only when status = shipped */}
                {editStatus === 'shipped' && (
                  <div style={{ marginBottom:12 }}>
                    <label style={Label}>Tracking / Logistic Number</label>
                    <input
                      style={Input}
                      value={editTracking}
                      onChange={e => setEditTracking(e.target.value)}
                      placeholder="e.g. J&T 123456789"
                    />
                  </div>
                )}

                {/* Cancel remark — only when status = cancelled */}
                {editStatus === 'cancelled' && (
                  <div style={{ marginBottom:12 }}>
                    <label style={Label}>Cancellation Remark</label>
                    <textarea
                      style={{ ...Input, minHeight:80, resize:'vertical' }}
                      value={editRemark}
                      onChange={e => setEditRemark(e.target.value)}
                      placeholder="Reason for cancellation..."
                    />
                  </div>
                )}

                <div style={{ marginBottom:12 }}>
                  <label style={Label}>Delivery Address</label>
                  <textarea
                    style={{ ...Input,minHeight:80,resize:'vertical' }}
                    value={editAddr}
                    onChange={e => setEditAddr(e.target.value)}
                    placeholder="Enter customer's delivery address..."
                  />
                </div>

                <button onClick={saveDetail} disabled={saving} style={{ ...Btn.primary,marginTop:4,width:'100%',padding:12 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {msg && <div style={{ marginTop:8,fontSize:12,color:'#065f46',textAlign:'center' }}>{msg}</div>}
              </Section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11,fontWeight:800,color:'#e8440a',textTransform:'uppercase',letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:'1px solid #e0d8c8' }}>{title}</div>
      {children}
    </div>
  )
}
function Row({ label, children }) {
  return (
    <div style={{ display:'flex',gap:10,padding:'5px 0',fontSize:13 }}>
      <span style={{ fontWeight:700,color:'#3a3a3a',minWidth:80,flexShrink:0 }}>{label}</span>
      <span style={{ color:'#0d0d0d' }}>{children}</span>
    </div>
  )
}

const Label = { fontSize:11,fontWeight:700,color:'#3a3a3a',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }
const Input = { width:'100%',padding:'8px 11px',border:'1.5px solid #e0ddd7',borderRadius:8,fontSize:13,background:'#ece9e2',outline:'none',color:'#0d0d0d',fontFamily:'inherit',boxSizing:'border-box' }
const Btn = {
  primary: { background:'#e8440a',color:'white',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer' },
}
