import React, { useEffect, useState, useCallback } from 'react'
import {
  getFirestore, collection, getDocs, doc, query, orderBy,
  setDoc, deleteDoc, updateDoc,
} from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const PRE_PROCURED = ['pending', 'confirmed', 'purchasing']
const STATUS_ZH = {
  pending: '待确认', confirmed: '已接单', purchasing: '采购中',
  procured: '已采购', shipped: '已发货', completed: '已完成',
}
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  purchasing: 'bg-purple-100 text-purple-800', procured: 'bg-pink-100 text-pink-800',
  shipped: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800',
}

function getKey(item) {
  return `${item.productId || item.name}|${item.size || ''}`
}

// Distribute purchasedQty to orders sorted by createdAt (earliest first)
function computeAlloc(ordersPool, key, purchasedQty) {
  const sorted = ordersPool
    .filter(o => o.items?.some(i => getKey(i) === key))
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
  let remaining = purchasedQty
  const result = {}
  for (const order of sorted) {
    const item = order.items?.find(i => getKey(i) === key)
    if (!item) continue
    const needed = item.quantity
    const allocated = Math.min(needed, Math.max(0, remaining))
    remaining -= allocated
    result[order.id] = { allocated, needed }
  }
  return result
}

function copyText(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    const el = document.createElement('textarea')
    el.value = text; document.body.appendChild(el); el.select()
    document.execCommand('copy'); document.body.removeChild(el)
  })
}

const TABS = [
  { key: 'procurement', label: '📦 采购汇总' },
  { key: 'delivery',    label: '🚚 配送分组' },
  { key: 'sales',       label: '💰 收入概览' },
]

export default function ReportPage() {
  const { lang } = useLang()
  const [tab, setTab] = useState('procurement')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [tracking, setTracking] = useState({}) // { [key]: qty }
  const [loading, setLoading] = useState(true)
  const [procStatuses, setProcStatuses] = useState(new Set(['confirmed', 'purchasing']))
  const [delivStatuses, setDelivStatuses] = useState(new Set(['confirmed', 'purchasing', 'procured', 'shipped']))

  const load = useCallback(async () => {
    setLoading(true)
    const [ordersSnap, prodsSnap, catsSnap, trackSnap] = await Promise.all([
      getDocs(query(collection(db, 'cheers_orders'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'cheers_products')),
      getDocs(collection(db, 'cheers_categories')),
      getDocs(collection(db, 'cheers_procurement_tracking')),
    ])
    setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setProducts(prodsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    const t = {}
    trackSnap.docs.forEach(d => {
      const qty = d.data().purchasedQty ?? (d.data().purchased ? 999 : 0)
      if (qty > 0) t[d.id] = qty
    })
    setTracking(t)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleQtyChange(key, qty, currentOrders) {
    const newTracking = { ...tracking, [key]: qty }

    // Save to Firestore
    if (qty <= 0) {
      await deleteDoc(doc(db, 'cheers_procurement_tracking', key))
      const t2 = { ...newTracking }; delete t2[key]; setTracking(t2)
    } else {
      await setDoc(doc(db, 'cheers_procurement_tracking', key), { purchasedQty: qty })
      setTracking(newTracking)
    }

    // Auto-update order status: check orders containing this product
    // Includes 'procured' orders so they can be downgraded if coverage drops
    const MUTABLE = ['pending', 'confirmed', 'purchasing', 'procured']
    let liveOrders = [...currentOrders]
    const affected = liveOrders.filter(o =>
      MUTABLE.includes(o.status) && o.items?.some(i => getKey(i) === key)
    )

    for (const order of affected) {
      const mutablePool = liveOrders.filter(o => MUTABLE.includes(o.status))
      const allCovered = (order.items || []).every(item => {
        const iKey = getKey(item)
        const purchased = newTracking[iKey] || 0
        const alloc = computeAlloc(mutablePool, iKey, purchased)
        return (alloc[order.id]?.allocated || 0) >= item.quantity
      })
      if (allCovered && PRE_PROCURED.includes(order.status)) {
        // Upgrade: pre-procured → procured
        await updateDoc(doc(db, 'cheers_orders', order.id), { status: 'procured' })
        liveOrders = liveOrders.map(o => o.id === order.id ? { ...o, status: 'procured' } : o)
      } else if (!allCovered && order.status === 'procured') {
        // Downgrade: procured → purchasing (qty reduced, e.g. returned goods)
        await updateDoc(doc(db, 'cheers_orders', order.id), { status: 'purchasing' })
        liveOrders = liveOrders.map(o => o.id === order.id ? { ...o, status: 'purchasing' } : o)
      }
    }
    setOrders(liveOrders)
  }

  async function clearAllTracking() {
    if (!confirm('确认清除所有采购记录？')) return
    const snap = await getDocs(collection(db, 'cheers_procurement_tracking'))
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
    setTracking({})
  }

  function toggleStatus(set, setFn, s) {
    setFn(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-5">报表</h1>
      <div className="flex gap-1 mb-6 border-b border-cheers-cream">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-cheers-brown text-cheers-brown' : 'border-transparent text-cheers-brown/50 hover:text-cheers-brown'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'procurement' && (
        <ProcurementTab
          orders={orders} products={products} categories={categories}
          tracking={tracking} procStatuses={procStatuses}
          onToggleStatus={s => toggleStatus(procStatuses, setProcStatuses, s)}
          onQtyChange={handleQtyChange} onClearAll={clearAllTracking}
          lang={lang}
        />
      )}
      {tab === 'delivery' && (
        <DeliveryTab
          orders={orders} delivStatuses={delivStatuses}
          onToggleStatus={s => toggleStatus(delivStatuses, setDelivStatuses, s)}
          onReload={load} lang={lang}
        />
      )}
      {tab === 'sales' && <SalesTab orders={orders} lang={lang} />}
    </div>
  )
}

// ── Quantity input (saves on blur/enter) ─────────────────────────────────────
function QtyInput({ itemKey, max, tracking, orders, onQtyChange }) {
  const [val, setVal] = useState(tracking[itemKey] || 0)
  useEffect(() => { setVal(tracking[itemKey] || 0) }, [tracking[itemKey]])
  const commit = () => onQtyChange(itemKey, Math.min(max, Math.max(0, val)), orders)
  return (
    <input type="number" min="0" max={max} value={val}
      onChange={e => setVal(parseInt(e.target.value) || 0)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
      className="input w-16 text-center text-sm py-1 px-1"
      onClick={e => e.stopPropagation()}
    />
  )
}

// ── Procurement Tab ──────────────────────────────────────────────────────────
function ProcurementTab({ orders, products, categories, tracking, procStatuses, onToggleStatus, onQtyChange, onClearAll, lang }) {
  const [catFilter, setCatFilter] = useState(new Set())
  const [expanded, setExpanded] = useState(new Set())

  const procOrders = orders.filter(o => procStatuses.has(o.status))

  // Build aggregation
  const aggMap = {}
  for (const order of procOrders) {
    for (const item of order.items || []) {
      const key = getKey(item)
      if (!aggMap[key]) {
        const prod = products.find(p => p.id === item.productId)
        const catId = prod ? (prod.categoryIds?.[0] || prod.categoryId || '') : ''
        const cat = categories.find(c => c.id === catId)
        aggMap[key] = { key, name: item.name, size: item.size || '', price: item.price, qty: 0, catId, catName: cat?.name?.zh || cat?.name?.en || '未分类', orders: [] }
      }
      aggMap[key].qty += item.quantity
      aggMap[key].orders.push(order.id)
    }
  }

  // Unique categories in current agg
  const availCats = [...new Set(Object.values(aggMap).map(i => i.catId))].map(id => ({
    id, name: categories.find(c => c.id === id)?.name?.zh || categories.find(c => c.id === id)?.name?.en || '未分类',
  }))

  // Filter by category
  const filteredItems = Object.values(aggMap).filter(i => catFilter.size === 0 || catFilter.has(i.catId))

  // Group by catName
  const byCategory = {}
  for (const item of filteredItems) {
    if (!byCategory[item.catName]) byCategory[item.catName] = []
    byCategory[item.catName].push(item)
  }

  const totalItems = filteredItems.length
  const purchasedCount = filteredItems.filter(i => (tracking[i.key] || 0) >= i.qty).length

  function copyList() {
    const lines = []
    for (const [cat, items] of Object.entries(byCategory)) {
      lines.push(`【${cat}】`)
      for (const i of items) {
        const got = tracking[i.key] || 0
        const status = got >= i.qty ? '✓' : got > 0 ? `${got}/` : '□'
        lines.push(`${status} ${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`)
      }
    }
    copyText(lines.join('\n'))
  }

  function toggleExpand(key) {
    setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-cheers-brown/60 mb-1.5">订单状态</p>
              <div className="flex gap-2 flex-wrap">
                {['pending', 'confirmed', 'purchasing', 'procured'].map(s => (
                  <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-cheers-brown"
                      checked={procStatuses.has(s)} onChange={() => onToggleStatus(s)} />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}>{STATUS_ZH[s]}</span>
                  </label>
                ))}
              </div>
            </div>
            {availCats.length > 1 && (
              <div>
                <p className="text-xs font-medium text-cheers-brown/60 mb-1.5">分类筛选</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setCatFilter(new Set())}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${catFilter.size === 0 ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'}`}>
                    全部
                  </button>
                  {availCats.map(c => (
                    <button key={c.id} onClick={() => setCatFilter(prev => {
                      const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n
                    })}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${catFilter.has(c.id) ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown'}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={copyList} className="btn-secondary text-xs py-1.5 px-3">📋 复制清单</button>
            <button onClick={onClearAll} className="text-xs text-red-400 hover:text-red-600 px-2">重置</button>
          </div>
        </div>
        <p className="text-xs text-cheers-brown/50">
          {procOrders.length} 单 · {totalItems} 种商品 · 已购齐 {purchasedCount}/{totalItems}
          {totalItems > 0 && <span className="ml-1 font-medium text-cheers-brown">{Math.round(purchasedCount / totalItems * 100)}%</span>}
        </p>
      </div>

      {/* Product list by category */}
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-cheers-cream/40 border-b border-cheers-cream">
            <p className="text-sm font-semibold text-cheers-dark-brown">{cat}</p>
          </div>
          <div className="divide-y divide-cheers-cream">
            {items.map(item => {
              const got = tracking[item.key] || 0
              const full = got >= item.qty
              const partial = got > 0 && !full
              const isOpen = expanded.has(item.key)

              // Per-order allocation for this item
              const preProcPool = orders.filter(o => PRE_PROCURED.includes(o.status))
              const alloc = computeAlloc(preProcPool, item.key, got)
              const orderDetails = procOrders
                .filter(o => o.items?.some(i => getKey(i) === item.key))
                .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
                .map(o => {
                  const needed = o.items?.find(i => getKey(i) === item.key)?.quantity || 0
                  const allocated = alloc[o.id]?.allocated || 0
                  return { order: o, needed, allocated }
                })

              return (
                <div key={item.key}>
                  <div className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${full ? 'bg-green-50/60' : 'hover:bg-cheers-cream/10'}`}
                    onClick={() => toggleExpand(item.key)}>
                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${full ? 'bg-green-500' : partial ? 'bg-amber-400' : 'bg-cheers-cream'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${full ? 'text-cheers-brown/50 line-through' : 'text-cheers-dark-brown'}`}>
                        {item.name}{item.size ? ` · ${item.size}` : ''}
                      </p>
                      <p className="text-xs text-cheers-brown/40">RM {item.price?.toFixed(2)} / 件</p>
                    </div>
                    {/* Qty input + 全部 button */}
                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <QtyInput itemKey={item.key} max={item.qty} tracking={tracking} orders={orders} onQtyChange={onQtyChange} />
                      <span className="text-xs text-cheers-brown/50">/ {item.qty}</span>
                      {(tracking[item.key] || 0) < item.qty && (
                        <button onClick={() => onQtyChange(item.key, item.qty, orders)}
                          className="text-[10px] border border-cheers-brown/30 text-cheers-brown hover:bg-cheers-cream/50 px-1.5 py-0.5 rounded transition-colors">
                          全部
                        </button>
                      )}
                    </div>
                    <span className="text-cheers-brown/30 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Expandable order breakdown */}
                  {isOpen && (
                    <div className="bg-cheers-cream/10 border-t border-cheers-cream divide-y divide-cheers-cream/50">
                      {orderDetails.map(({ order, needed, allocated }) => {
                        const done = allocated >= needed
                        const part = allocated > 0 && !done
                        return (
                          <div key={order.id} className="px-6 py-2 flex items-center gap-3">
                            <span className="text-base flex-shrink-0">{done ? '✅' : part ? '🔶' : '⬜'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-cheers-dark-brown">{order.orderId || order.id}</p>
                              <p className="text-xs text-cheers-brown/50">{order.userName}</p>
                            </div>
                            <span className={`text-xs font-medium flex-shrink-0 ${done ? 'text-green-600' : part ? 'text-amber-600' : 'text-cheers-brown/40'}`}>
                              {allocated}/{needed} 件
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(byCategory).length === 0 && (
        <div className="text-center py-12 text-cheers-brown/40">暂无符合条件的订单</div>
      )}
    </div>
  )
}

// ── Delivery Tab ─────────────────────────────────────────────────────────────
function DeliveryTab({ orders, delivStatuses, onToggleStatus, onReload, lang }) {
  const [copyWithContact, setCopyWithContact] = useState(true)
  const [copied, setCopied] = useState(null)
  const [groupStatus, setGroupStatus] = useState({}) // { [groupKey]: selectedStatus }
  const [bulkLoading, setBulkLoading] = useState(null)

  const delivOrders = orders.filter(o => delivStatuses.has(o.status))

  const groups = {}
  for (const order of delivOrders) {
    const d = order.delivery || {}
    const key = d.type === 'face-to-face'
      ? `面交 · ${d.location || '未指定'}`
      : (d.state || (d.region === 'east' ? '东马（州属未填）' : '西马（州属未填）'))
    if (!groups[key]) groups[key] = []
    groups[key].push(order)
  }
  const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'zh'))

  function buildAddr(order) {
    const d = order.delivery || {}
    if (d.type === 'face-to-face') return `面交 · ${d.location || ''}`
    return [d.address, `${d.postcode || ''} ${d.city || ''}`.trim(), d.state].filter(Boolean).join('\n')
  }

  function handleCopy(order) {
    const addr = buildAddr(order)
    const text = copyWithContact ? `${order.userName || ''} · ${order.delivery?.phone || ''}\n${addr}` : addr
    copyText(text)
    setCopied(order.id); setTimeout(() => setCopied(null), 1500)
  }

  function copyGroup(groupOrders) {
    const lines = groupOrders.map(o => {
      const addr = buildAddr(o)
      return copyWithContact ? `${o.userName || ''} · ${o.delivery?.phone || ''}\n${addr}` : addr
    })
    copyText(lines.join('\n\n'))
  }

  async function applyGroupStatus(groupKey, groupOrders) {
    const status = groupStatus[groupKey]
    if (!status) return
    setBulkLoading(groupKey)
    await Promise.all(groupOrders.map(o =>
      updateDoc(doc(db, 'cheers_orders', o.id), { status })
    ))
    setBulkLoading(null)
    setGroupStatus(prev => ({ ...prev, [groupKey]: '' }))
    await onReload()
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium text-cheers-brown/60 mb-1.5">订单状态</p>
            <div className="flex gap-2 flex-wrap">
              {['confirmed', 'purchasing', 'procured', 'shipped'].map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-cheers-brown"
                    checked={delivStatuses.has(s)} onChange={() => onToggleStatus(s)} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}>{STATUS_ZH[s]}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-cheers-cream/40 border border-cheers-cream rounded-lg px-3 py-2">
            <input type="checkbox" className="w-4 h-4 accent-cheers-brown"
              checked={copyWithContact} onChange={() => setCopyWithContact(v => !v)} />
            <span className="text-sm text-cheers-dark-brown">📋 包含姓名和手机号</span>
          </label>
        </div>
        <p className="text-xs text-cheers-brown/50">{delivOrders.length} 单 · {sortedGroups.length} 组</p>
      </div>

      {sortedGroups.map(([state, stateOrders]) => (
        <div key={state} className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-cheers-cream/40 border-b border-cheers-cream flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-cheers-dark-brown flex-1">
              {state} <span className="font-normal text-cheers-brown/50">({stateOrders.length} 单)</span>
            </p>
            {/* Batch status for this group */}
            <div className="flex items-center gap-1.5">
              <select value={groupStatus[state] || ''}
                onChange={e => setGroupStatus(prev => ({ ...prev, [state]: e.target.value }))}
                className="input text-xs py-1 px-2">
                <option value="">批量改状态…</option>
                {['confirmed','purchasing','procured','shipped','completed'].map(s => (
                  <option key={s} value={s}>{STATUS_ZH[s]}</option>
                ))}
              </select>
              {groupStatus[state] && (
                <button onClick={() => applyGroupStatus(state, stateOrders)}
                  disabled={!!bulkLoading}
                  className="btn-primary text-xs py-1 px-2">
                  {bulkLoading === state ? '…' : '应用'}
                </button>
              )}
              <button onClick={() => copyGroup(stateOrders)}
                className="text-xs border border-cheers-brown/20 text-cheers-brown hover:border-cheers-brown/50 px-2 py-1 rounded-lg">
                复制全组
              </button>
            </div>
          </div>
          <div className="divide-y divide-cheers-cream">
            {stateOrders.map(order => {
              const d = order.delivery || {}
              return (
                <div key={order.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-medium text-cheers-dark-brown">{order.orderId || order.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_ZH[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-cheers-dark-brown">{order.userName}</p>
                    <p className="text-xs text-cheers-brown/60">{d.phone}</p>
                    {d.type !== 'face-to-face' && (
                      <p className="text-xs text-cheers-brown/70 mt-0.5 leading-relaxed">
                        {d.address}<br />{d.postcode} {d.city}{d.state ? `, ${d.state}` : ''}
                      </p>
                    )}
                    <p className="text-xs text-cheers-brown/40 mt-1 truncate">
                      {order.items?.map(i => `${i.name}${i.size ? `(${i.size})` : ''} ×${i.quantity}`).join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-sm font-semibold text-cheers-brown">RM {order.total?.toFixed(2)}</p>
                    <button onClick={() => handleCopy(order)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${copied === order.id ? 'bg-green-100 text-green-700' : 'border border-cheers-brown/20 text-cheers-brown hover:border-cheers-brown/50'}`}>
                      {copied === order.id ? '✓ 已复制' : '复制地址'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {sortedGroups.length === 0 && <div className="text-center py-12 text-cheers-brown/40">暂无订单</div>}
    </div>
  )
}

// ── Sales Tab ────────────────────────────────────────────────────────────────
function SalesTab({ orders }) {
  const completed = orders.filter(o => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0)
  const pending = orders.filter(o => PRE_PROCURED.includes(o.status) || o.status === 'procured')
  const pendingRevenue = pending.reduce((s, o) => s + (o.total || 0), 0)
  const byStatus = {}
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: '已完成收入', value: `RM ${totalRevenue.toFixed(2)}`, sub: `${completed.length} 单`, color: 'text-green-700' },
          { label: '进行中订单', value: `RM ${pendingRevenue.toFixed(2)}`, sub: `${pending.length} 单`, color: 'text-cheers-brown' },
          { label: '总订单数', value: orders.length, sub: '所有状态', color: 'text-cheers-dark-brown' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-cheers-brown/50 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-cheers-brown/40">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <p className="text-sm font-medium text-cheers-dark-brown mb-3">各状态订单数</p>
        <div className="space-y-2">
          {['pending','confirmed','purchasing','procured','shipped','completed'].map(s => {
            const count = byStatus[s] || 0
            const max = Math.max(...Object.values(byStatus), 1)
            return (
              <div key={s} className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full w-16 text-center ${STATUS_COLOR[s]}`}>{STATUS_ZH[s]}</span>
                <div className="flex-1 bg-cheers-cream/40 rounded-full h-2">
                  <div className="bg-cheers-brown h-2 rounded-full transition-all" style={{ width: `${count / max * 100}%` }} />
                </div>
                <span className="text-xs text-cheers-brown w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
