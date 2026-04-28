import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMall } from '../contexts/MallContext'
import { useMallLang } from '../hooks/useMallLang'
import { addTransaction, generateTxnId } from '../services/firestore'
import { useAuth } from '../../contexts/AuthContext'
import emailjs from '@emailjs/browser'
import MallNav from '../components/MallNav'

const EJ = {
  key:      import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  service:  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  template: import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID,
}

export default function CartPage() {
  const { cart, config, total, updateQty, removeFromCart, clearCart } = useMall()
  const { user } = useAuth()
  const { lang, mt } = useMallLang()
  const navigate = useNavigate()

  const [name, setName]         = useState(user?.displayName || '')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail]       = useState(user?.email || '')
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(null)        // { txnId }
  const [confirmItem, setConfirmItem] = useState(null)  // item pending removal
  const [contactModal, setContactModal] = useState(null) // { txnId, msg } — contact choice after order

  /* ── quantity helpers ─────────────────────────────── */
  function tryDecrease(item) {
    if (item.qty <= 1) setConfirmItem(item)
    else updateQty(item.key, item.qty - 1)
  }
  function tryRemove(item) { setConfirmItem(item) }
  function confirmRemove() { removeFromCart(confirmItem.key); setConfirmItem(null) }

  /* ── submit ───────────────────────────────────────── */
  const hasContact = whatsapp.trim() || email.trim()
  const canSubmit  = !submitting && name.trim() && hasContact

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)

    const txnId = generateTxnId()
    const txnData = {
      txnId,
      userId: user?.uid || null,
      customerName:     name.trim(),
      customerWhatsapp: whatsapp.trim(),
      customerEmail:    email.trim(),
      // legacy compat
      customerContact:  whatsapp.trim() || email.trim(),
      contactMethod:    whatsapp.trim() ? 'whatsapp' : 'email',
      items: cart.map(i => ({
        productId:     i.productId,
        name:          i.name,
        image:         i.image,
        price:         i.price,
        originalPrice: i.originalPrice,
        qty:           i.qty,
        size:          i.size   || '',
        design:        i.design || '',
      })),
      total,
      status:  'pending',
      address: '',
      notes:   notes.trim(),
    }

    try {
      await addTransaction(txnData)

      /* ── EmailJS notification ── */
      try {
        if (EJ.key && EJ.service && EJ.template) {
          emailjs.init(EJ.key)
          const orderLines = cart.map(i => {
            const v = [i.size, i.design].filter(Boolean).join(', ')
            return `• ${i.name}${v ? ` (${v})` : ''} × ${i.qty}  —  RM ${(i.price * i.qty).toFixed(2)}`
          }).join('\n')
          await emailjs.send(EJ.service, EJ.template, {
            to_email:         'jeejunhong@gmail.com',
            store_name:       config.storeName || 'JeeProd Mall',
            txn_id:           txnId,
            customer_name:    name.trim(),
            customer_whatsapp: whatsapp.trim() || '—',
            customer_email:   email.trim() || '—',
            order_items:      orderLines,
            order_total:      `RM ${total.toFixed(2)}`,
            notes:            notes.trim() || '—',
            order_date:       new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
          })
        }
      } catch (ejErr) {
        console.warn('EmailJS notification failed (non-fatal):', ejErr)
      }

      /* ── Open WhatsApp / email to merchant ── */
      const msgLines = [
        `Hi! I'd like to order from ${config.storeName || 'JeeProd Mall'} 🛍️`,
        '',
        `📋 Order ${txnId}`,
        '─────────────────────',
        ...cart.map(i => {
          const v = [i.size, i.design].filter(Boolean).join(', ')
          return `• ${i.name}${v ? ` (${v})` : ''} × ${i.qty} — RM ${(i.price * i.qty).toFixed(2)}`
        }),
        '─────────────────────',
        `💰 Total: RM ${total.toFixed(2)}`,
        '',
        `👤 Name: ${name.trim()}`,
        whatsapp.trim() ? `📱 WhatsApp: ${whatsapp.trim()}` : null,
        email.trim()    ? `📧 Email: ${email.trim()}`        : null,
        notes.trim()    ? `📝 Notes: ${notes.trim()}`        : null,
        '',
        'Please confirm my order! Thank you 🙏',
      ].filter(l => l !== null)
      const msg = msgLines.join('\n')

      setContactModal({ txnId, msg })
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Contact choice modal (after order placed) ───── */
  function sendViaWhatsapp() {
    if (config.whatsapp)
      window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(contactModal.msg)}`, '_blank')
    finishOrder()
  }
  function sendViaEmail() {
    if (config.email) {
      const subj = encodeURIComponent(`[${config.storeName || 'JeeProd Mall'}] Order ${contactModal.txnId}`)
      window.open(`mailto:${config.email}?subject=${subj}&body=${encodeURIComponent(contactModal.msg)}`)
    }
    finishOrder()
  }
  function finishOrder() {
    const txnId = contactModal.txnId
    setContactModal(null)
    clearCart()
    setDone({ txnId })
  }

  /* ── Modal button styles ─────────────────────────── */
  const S = {
    waBtn: {
      display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
      borderRadius:12, border:'1.5px solid #25d366', background:'#f0fdf4',
      color:'#166534', cursor:'pointer', transition:'background 0.15s', width:'100%',
    },
    emailBtn: {
      display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
      borderRadius:12, border:'1.5px solid #e0ddd7', background:'#f7f5f0',
      color:'#0d0d0d', cursor:'pointer', transition:'background 0.15s', width:'100%',
    },
    skipBtn: {
      fontSize:12, color:'#6b6b6b', background:'none', border:'none',
      cursor:'pointer', padding:'8px', textAlign:'center', width:'100%',
    },
  }

  const ContactModal = contactModal && (
    <>
      <div style={{ position:'fixed',inset:0,background:'rgba(13,13,13,0.6)',zIndex:900,backdropFilter:'blur(4px)' }} />
      <div style={{
        position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        background:'#fefefe', borderRadius:20, zIndex:901,
        width:'min(400px,92vw)', boxShadow:'0 24px 80px rgba(13,13,13,0.3)',
        overflow:'hidden', fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ background:'#0d0d0d', padding:'24px 24px 20px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🎉</div>
          <div style={{ fontWeight:900, fontSize:18, color:'white', marginBottom:4 }}>Order Placed!</div>
          <div style={{ fontFamily:'monospace', fontSize:13, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.08)', borderRadius:8, padding:'4px 12px', display:'inline-block', marginTop:4 }}>
            {contactModal.txnId}
          </div>
        </div>
        <div style={{ padding:'24px 24px 28px' }}>
          <p style={{ fontSize:14, color:'#3a3a3a', marginBottom:20, textAlign:'center', lineHeight:1.6 }}>
            Your order has been recorded. How would you like to send the details to us?
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {config.whatsapp && (
              <button onClick={sendViaWhatsapp} style={S.waBtn}>
                <span style={{ fontSize:20 }}>💬</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>Send via WhatsApp</div>
                  <div style={{ fontSize:11, opacity:0.75 }}>Opens WhatsApp with order details</div>
                </div>
              </button>
            )}
            {config.email && (
              <button onClick={sendViaEmail} style={S.emailBtn}>
                <span style={{ fontSize:20 }}>📧</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>Send via Email</div>
                  <div style={{ fontSize:11, opacity:0.75 }}>Opens your email app with order details</div>
                </div>
              </button>
            )}
            <button onClick={finishOrder} style={S.skipBtn}>
              I'll contact later
            </button>
          </div>
        </div>
      </div>
    </>
  )

  /* ── Remove confirmation dialog ─────────────────── */
  const ConfirmDialog = confirmItem && (
    <>
      <div
        style={{ position:'fixed',inset:0,background:'rgba(13,13,13,0.45)',zIndex:800,backdropFilter:'blur(2px)' }}
        onClick={() => setConfirmItem(null)}
      />
      <div style={{
        position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        background:'#fefefe', borderRadius:16, padding:'28px 24px', zIndex:801,
        width:'min(340px,90vw)', boxShadow:'0 16px 48px rgba(13,13,13,0.2)',
        textAlign:'center', fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
        <div style={{ fontWeight:800, fontSize:16, color:'#0d0d0d', marginBottom:6 }}>Remove Item?</div>
        <div style={{ fontSize:13, color:'#6b6b6b', marginBottom:20, lineHeight:1.5 }}>
          Remove <strong>{confirmItem.name}</strong> from your cart?
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button
            onClick={() => setConfirmItem(null)}
            style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e0ddd7', background:'#f7f5f0', color:'#0d0d0d', fontWeight:700, fontSize:14, cursor:'pointer' }}
          >
            Keep
          </button>
          <button
            onClick={confirmRemove}
            style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:'#e8440a', color:'white', fontWeight:700, fontSize:14, cursor:'pointer' }}
          >
            Remove
          </button>
        </div>
      </div>
    </>
  )

  /* ── Success screen ──────────────────────────────── */
  if (done) return (
    <div className="mall-root">
      <MallNav />
      <div className="mall-cart-page">
        <div className="mall-cart-items-card" style={{ textAlign:'center', padding:'40px 24px' }}>
          <div className="mall-txn-success">
            <div className="mall-txn-success-icon">🎉</div>
            <h2 style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>Order Sent!</h2>
            <p style={{ color:'var(--mall-stone)', marginBottom:12 }}>Your order reference number:</p>
            <div className="mall-txn-id">{done.txnId}</div>
            <p className="mall-txn-note">
              Your order details have been sent to the store.<br />
              Save your order number — you can use it to track your order status.
            </p>
            {user && (
              <button
                style={{ marginTop:20, color:'var(--mall-forest)', fontWeight:700, fontSize:14 }}
                onClick={() => navigate('/mall/orders')}
              >
                View My Orders →
              </button>
            )}
            <button
              style={{ display:'block', marginTop:12, color:'var(--mall-stone)', fontSize:13 }}
              onClick={() => navigate('/mall')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Empty cart ──────────────────────────────────── */
  if (cart.length === 0) return (
    <div className="mall-root">
      <MallNav />
      <div className="mall-cart-page">
        <div className="mall-empty" style={{ marginTop:40 }}>
          <div className="mall-empty-icon">🛒</div>
          <div className="mall-empty-text">Your cart is empty.</div>
          <button
            style={{ marginTop:16, color:'var(--mall-forest)', fontWeight:700 }}
            onClick={() => navigate('/mall')}
          >← Keep Shopping</button>
        </div>
      </div>
    </div>
  )

  /* ── Main cart + checkout ────────────────────────── */
  return (
    <div className="mall-root">
      {ContactModal}
      {ConfirmDialog}
      <MallNav />
      <div className="mall-cart-page">
        <h1 className="mall-cart-page-title">🛒 Your Order</h1>

        <div className="mall-cart-page-layout">
          {/* Items */}
          <div className="mall-cart-items-card">
            <div className="mall-card-title">Items</div>
            {cart.map(item => (
              <div key={item.key} className="mall-cart-page-item">
                {item.image
                  ? <img src={item.image} alt={item.name} className="mall-cpi-img" />
                  : <div className="mall-cpi-img" style={{ display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>🛍️</div>}
                <div className="mall-cpi-info">
                  <div className="mall-cpi-name">{item.name}</div>
                  {(item.size || item.design) && (
                    <div className="mall-cpi-variant">{[item.size, item.design].filter(Boolean).join(' · ')}</div>
                  )}
                  <div className="mall-cpi-row">
                    <div className="mall-qty-ctrl">
                      <button className="mall-qty-btn" onClick={() => tryDecrease(item)}>−</button>
                      <span className="mall-qty-val">{item.qty}</span>
                      <button className="mall-qty-btn" onClick={() => updateQty(item.key, item.qty + 1)}>+</button>
                    </div>
                    <div className="mall-cpi-price">RM {(item.price * item.qty).toFixed(2)}</div>
                    <button className="mall-cart-item-del" onClick={() => tryRemove(item)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
            <div className="mall-cart-total-line">
              <span>Total</span>
              <span>RM {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout form */}
          <form className="mall-checkout-card" onSubmit={handleSubmit}>
            <div className="mall-card-title">Contact Details</div>

            <div className="mall-form-group">
              <label className="mall-form-label">Your Name *</label>
              <input
                className="mall-form-input"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="mall-form-group">
              <label className="mall-form-label">
                WhatsApp Number
              </label>
              <input
                className="mall-form-input"
                placeholder="e.g. 60123456789"
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
              />
            </div>

            <div className="mall-form-group">
              <label className="mall-form-label">
                Email
              </label>
              <input
                className="mall-form-input"
                placeholder="your@email.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {!hasContact && (
              <div style={{ fontSize:12, color:'#e8440a', marginTop:-4, fontWeight:500 }}>
                Please fill in at least one contact method.
              </div>
            )}

            <div className="mall-form-group">
              <label className="mall-form-label">Notes (optional)</label>
              <textarea
                className="mall-form-textarea"
                placeholder="Any special requests or delivery notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="mall-send-btn"
              disabled={!canSubmit}
            >
              {submitting ? 'Sending...' : '🛍️ Place Order'}
            </button>

            <p style={{ fontSize:11, color:'var(--mall-stone-soft)', textAlign:'center', marginTop:10, lineHeight:1.5 }}>
              An order number will be generated and your details sent to the store.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
