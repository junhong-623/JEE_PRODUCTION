import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirestore, addDoc, collection, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore'
import app from '../../../lib/firebase'

const db = getFirestore(app)

const STATUSES = ['pending', 'confirmed', 'purchasing', 'shipped', 'completed']
const STATUS_ZH = { pending: '待确认', confirmed: '已接单', purchasing: '采购中', shipped: '已发货', completed: '已完成' }

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `CHEERS-${date}-${rand}`
}

function emptyItem() {
  return { name: '', size: '', price: '', quantity: '1' }
}

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' })
  const [items, setItems] = useState([emptyItem()])
  const [deliveryType, setDeliveryType] = useState('shipping')
  const [region, setRegion] = useState('west')
  const [address, setAddress] = useState({ address: '', postcode: '', city: '', state: '', location: '' })
  const [shippingFee, setShippingFee] = useState('0')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('pending')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isAddon, setIsAddon] = useState(false)
  const [parentOrderInput, setParentOrderInput] = useState('')
  const [parentOrder, setParentOrder] = useState(null) // found order doc
  const [parentSearching, setParentSearching] = useState(false)
  const [parentError, setParentError] = useState('')

  async function searchParentOrder() {
    const id = parentOrderInput.trim().toUpperCase()
    if (!id) return
    setParentSearching(true)
    setParentError('')
    setParentOrder(null)
    try {
      const snap = await getDocs(query(collection(db, 'cheers_orders'), where('orderId', '==', id), limit(1)))
      if (snap.empty) {
        setParentError('找不到此订单')
      } else {
        const d = snap.docs[0]
        const data = { id: d.id, ...d.data() }
        setParentOrder(data)
        // Auto-fill delivery info
        const del = data.delivery || {}
        setDeliveryType(del.type === 'face-to-face' ? 'face-to-face' : 'shipping')
        setRegion(del.region || 'west')
        setAddress({
          address: del.address || '',
          postcode: del.postcode || '',
          city: del.city || '',
          state: del.state || '',
          location: del.location || '',
        })
        setShippingFee('0')
        setCustomer(c => ({ ...c, name: data.userName || '', email: data.userEmail || '', phone: del.phone || '' }))
      }
    } finally { setParentSearching(false) }
  }

  function setItem(idx, field, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]) }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  const subtotal = items.reduce((sum, i) => {
    const price = parseFloat(i.price) || 0
    const qty = parseInt(i.quantity) || 0
    return sum + price * qty
  }, 0)
  const total = subtotal + (parseFloat(shippingFee) || 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customer.name) { setError('请填写顾客姓名'); return }
    if (items.some(i => !i.name || !i.price)) { setError('请填写完整商品信息'); return }
    if (isAddon && !parentOrder) { setError('请先搜索并选择母订单'); return }
    setSaving(true)
    setError('')
    try {
      const orderId = generateOrderId()
      const orderItems = items.map(i => ({
        productId: 'manual',
        name: i.name,
        price: parseFloat(i.price) || 0,
        quantity: parseInt(i.quantity) || 1,
        imageUrl: '',
        ...(i.size ? { size: i.size } : {}),
      }))
      const delivery = deliveryType === 'face-to-face'
        ? { type: 'face-to-face', location: address.location, phone: customer.phone }
        : { type: 'shipping', region, ...address, phone: customer.phone }

      await addDoc(collection(db, 'cheers_orders'), {
        orderId,
        userId: 'manual',
        source: 'manual',
        ...(isAddon && parentOrder ? { isAddon: true, parentOrderId: parentOrder.orderId || parentOrder.id } : {}),
        userEmail: customer.email || '—',
        userName: customer.name,
        items: orderItems,
        delivery,
        subtotal,
        shippingFee: parseFloat(shippingFee) || 0,
        total,
        status,
        notes,
        paymentMode: 'full',
        createdAt: serverTimestamp(),
      })
      navigate('/admin/orders')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/orders')} className="text-cheers-brown/60 hover:text-cheers-brown text-sm">← 返回</button>
        <h1 className="font-serif text-2xl text-cheers-dark-brown">手动创建订单</h1>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-cheers-dark-brown">顾客信息</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">姓名 *</label>
              <input className="input" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">电话</label>
              <input className="input" type="tel" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">电子邮件</label>
            <input className="input" type="email" value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} />
          </div>
        </div>

        {/* Addon option */}
        <div className="card p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isAddon} onChange={e => { setIsAddon(e.target.checked); if (!e.target.checked) { setParentOrder(null); setParentOrderInput(''); setShippingFee('0') } }}
              className="w-4 h-4 accent-cheers-brown" />
            <span className="text-sm font-medium text-cheers-dark-brown">📦 加单模式（关联至已有订单，邮费免收）</span>
          </label>

          {isAddon && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input className="input flex-1 font-mono uppercase text-sm" placeholder="输入母订单号，例：CHEERS-20260505-1234"
                  value={parentOrderInput} onChange={e => { setParentOrderInput(e.target.value.toUpperCase()); setParentError('') }} />
                <button type="button" onClick={searchParentOrder} disabled={parentSearching} className="btn-secondary px-4 text-sm flex-shrink-0">
                  {parentSearching ? '…' : '搜索'}
                </button>
              </div>
              {parentError && <p className="text-xs text-red-500">{parentError}</p>}
              {parentOrder && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-orange-800">✓ 已找到母订单</p>
                  <p className="text-xs text-orange-600">{parentOrder.orderId} · {parentOrder.userName} · {parentOrder.userEmail}</p>
                  <p className="text-xs text-orange-500 mt-0.5">地址已自动填入，邮费已清零</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-cheers-dark-brown">商品</h2>
            <button type="button" onClick={addItem} className="text-xs text-cheers-brown hover:text-cheers-dark-brown">+ 添加商品</button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_70px_60px_auto] gap-2 items-end">
              <div>
                {idx === 0 && <label className="label">商品名 *</label>}
                <input className="input text-sm" placeholder="商品名称" value={item.name}
                  onChange={e => setItem(idx, 'name', e.target.value)} required />
              </div>
              <div>
                {idx === 0 && <label className="label">尺码</label>}
                <input className="input text-sm" placeholder="S/M/L" value={item.size}
                  onChange={e => setItem(idx, 'size', e.target.value)} />
              </div>
              <div>
                {idx === 0 && <label className="label">单价</label>}
                <input className="input text-sm" type="number" step="0.01" min="0" placeholder="0.00" value={item.price}
                  onChange={e => setItem(idx, 'price', e.target.value)} required />
              </div>
              <div>
                {idx === 0 && <label className="label">数量</label>}
                <input className="input text-sm" type="number" min="1" value={item.quantity}
                  onChange={e => setItem(idx, 'quantity', e.target.value)} />
              </div>
              <button type="button" onClick={() => removeItem(idx)}
                className={`text-red-400 hover:text-red-600 pb-1.5 ${idx === 0 ? 'mt-5' : ''}`}
                disabled={items.length === 1}>×</button>
            </div>
          ))}
          <div className="text-right text-sm text-cheers-brown font-medium pt-1 border-t border-cheers-cream">
            小计: RM {subtotal.toFixed(2)}
          </div>
        </div>

        {/* Delivery */}
        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-cheers-dark-brown">配送方式</h2>
          <div className="flex gap-3">
            {[{ v: 'shipping', label: '邮寄' }, { v: 'face-to-face', label: '面交' }].map(opt => (
              <label key={opt.v} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${deliveryType === opt.v ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream'}`}>
                <input type="radio" name="deliveryType" value={opt.v} checked={deliveryType === opt.v} onChange={() => setDeliveryType(opt.v)} />
                <span className="text-sm font-medium text-cheers-dark-brown">{opt.label}</span>
              </label>
            ))}
          </div>

          {deliveryType === 'shipping' && (
            <>
              <div className="flex gap-3">
                {[{ v: 'west', label: '🇲🇾 西马' }, { v: 'east', label: '🏝️ 东马' }].map(opt => (
                  <label key={opt.v} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${region === opt.v ? 'border-cheers-brown bg-cheers-cream/30' : 'border-cheers-cream'}`}>
                    <input type="radio" name="region" value={opt.v} checked={region === opt.v} onChange={() => setRegion(opt.v)} />
                    <span className="text-cheers-dark-brown font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="label">地址</label>
                <textarea className="input resize-none" rows={2} value={address.address}
                  onChange={e => setAddress(a => ({ ...a, address: e.target.value }))} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className="label">邮编</label>
                  <input className="input" value={address.postcode} onChange={e => setAddress(a => ({ ...a, postcode: e.target.value }))} /></div>
                <div><label className="label">城市</label>
                  <input className="input" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} /></div>
                <div><label className="label">州属</label>
                  <input className="input" value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} /></div>
              </div>
            </>
          )}

          {deliveryType === 'face-to-face' && (
            <div>
              <label className="label">面交地点</label>
              <input className="input" value={address.location} onChange={e => setAddress(a => ({ ...a, location: e.target.value }))} />
            </div>
          )}
        </div>

        {/* Fees & Status */}
        <div className="card p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">邮费 (RM)</label>
              <input className="input" type="number" step="0.01" min="0" value={shippingFee}
                onChange={e => setShippingFee(e.target.value)} />
            </div>
            <div>
              <label className="label">订单状态</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_ZH[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">备注</label>
            <textarea className="input resize-none" rows={2} value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="来自 Instagram / 其他平台备注…" />
          </div>
          <div className="flex justify-between font-semibold text-cheers-dark-brown pt-2 border-t border-cheers-cream">
            <span>订单总额</span>
            <span>RM {total.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? '创建中…' : '创建订单'}
        </button>
      </form>
    </div>
  )
}
