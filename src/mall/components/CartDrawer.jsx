import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMall } from '../contexts/MallContext'
import { useMallLang } from '../hooks/useMallLang'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, removeFromCart, total } = useMall()
  const { mt } = useMallLang()
  const navigate = useNavigate()
  const [confirmItem, setConfirmItem] = useState(null)

  function tryRemove(item) { setConfirmItem(item) }
  function confirmRemove() { removeFromCart(confirmItem.key); setConfirmItem(null) }

  return (
    <>
      {/* Delete confirmation */}
      {confirmItem && (
        <>
          <div
            style={{ position:'fixed',inset:0,background:'rgba(13,13,13,0.5)',zIndex:600,backdropFilter:'blur(2px)' }}
            onClick={() => setConfirmItem(null)}
          />
          <div style={{
            position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
            background:'#fefefe', borderRadius:16, padding:'28px 24px', zIndex:601,
            width:'min(320px,88vw)', boxShadow:'0 16px 48px rgba(13,13,13,0.2)',
            textAlign:'center', fontFamily:"'DM Sans',sans-serif",
          }}>
            <div style={{ fontSize:34, marginBottom:10 }}>🗑️</div>
            <div style={{ fontWeight:800, fontSize:15, color:'#0d0d0d', marginBottom:6 }}>Remove Item?</div>
            <div style={{ fontSize:13, color:'#6b6b6b', marginBottom:20, lineHeight:1.5 }}>
              Remove <strong>{confirmItem.name}</strong> from your cart?
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => setConfirmItem(null)}
                style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e0ddd7', background:'#f7f5f0', color:'#0d0d0d', fontWeight:700, fontSize:14, cursor:'pointer' }}
              >Keep</button>
              <button
                onClick={confirmRemove}
                style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:'#e8440a', color:'white', fontWeight:700, fontSize:14, cursor:'pointer' }}
              >Remove</button>
            </div>
          </div>
        </>
      )}

      <div
        className={`mall-cart-overlay${cartOpen ? ' open' : ''}`}
        onClick={() => setCartOpen(false)}
      />
      <div className={`mall-cart-drawer${cartOpen ? ' open' : ''}`}>
        <div className="mall-cart-header">
          <span className="mall-cart-title">🛒 {mt('cart')} ({cart.length})</span>
          <button className="mall-cart-close" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        <div className="mall-cart-body">
          {cart.length === 0 ? (
            <div className="mall-cart-empty-msg">
              <div className="icon">🛍️</div>
              {mt('cartEmpty')} {mt('startExploring')}
            </div>
          ) : (
            cart.map(item => (
              <div key={item.key} className="mall-cart-item">
                {item.image
                  ? <img src={item.image} alt={item.name} className="mall-cart-item-img" />
                  : <div className="mall-cart-item-img" style={{ display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>🛍️</div>
                }
                <div className="mall-cart-item-info">
                  <div className="mall-cart-item-name">{item.name}</div>
                  {(item.size || item.design) && (
                    <div className="mall-cart-item-variant">
                      {[item.size, item.design].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <div className="mall-cart-item-bottom">
                    <div className="mall-cart-item-price">RM {(item.price * item.qty).toFixed(2)}</div>
                    <div className="mall-qty-ctrl">
                      <button className="mall-qty-btn" onClick={() => updateQty(item.key, item.qty - 1)}>−</button>
                      <span className="mall-qty-val">{item.qty}</span>
                      <button className="mall-qty-btn" onClick={() => updateQty(item.key, item.qty + 1)}>+</button>
                      <button className="mall-cart-item-del" onClick={() => tryRemove(item)}>🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="mall-cart-footer">
            <div className="mall-cart-total-row">
              <span className="mall-cart-total-label">{mt('total')}</span>
              <span className="mall-cart-total-val">RM {total.toFixed(2)}</span>
            </div>
            <button
              className="mall-cart-checkout-btn"
              onClick={() => { setCartOpen(false); navigate('/mall/cart') }}
            >
              {mt('checkout')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
