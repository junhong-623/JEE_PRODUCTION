import React, { useEffect, useState, useCallback } from 'react'
import {
  getFirestore, collection, getDocs, doc, getDoc, updateDoc, query, orderBy,
  arrayUnion, arrayRemove, setDoc, deleteDoc,
} from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useLang } from '../../contexts/LangContext'

const db = getFirestore(app)

const ALL_STATUSES = ['pending', 'confirmed', 'purchasing', 'procured', 'shipped', 'completed']
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

function copyToClipboard(text) {
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
  const [loading, setLoading] = useState(true)
  const [purchasedKeys, setPurchasedKeys] = useState(new Set())

  // Per-tab status filters
  const [procStatuses, setProcStatuses] = useState(new Set(['confirmed', 'purchasing']))
  const [delivStatuses, setDelivStatuses] = useState(new Set(['confirmed', 'purchasing', 'procured', 'shipped']))

  // Delivery copy option
  const [copyWithContact, setCopyWithContact] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    async function load() {
      const [ordersSnap, prodsSnap, catsSnap, trackingSnap] = await Promise.all([
        getDocs(query(collection(db, 'cheers_orders'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'cheers_products')),
        getDocs(collection(db, 'cheers_categories')),
        getDocs(collection(db, 'cheers_procurement_tracking')),
      ])
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setProducts(prodsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setPurchasedKeys(new Set(trackingSnap.docs.filter(d => d.data().purchased).map(d => d.id)))
      setLoading(false)
    }
    load()
  }, [])

  function toggleStatus(set, setFn, s) {
    setFn(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  async function togglePurchased(key, checked) {
    const ref = doc(db, 'cheers_procurement_tracking', key)
    if (checked) {
      await setDoc(ref, { purchased: true })
      setPurchasedKeys(prev => new Set([...prev, key]))
    } else {
      await deleteDoc(ref)
      setPurchasedKeys(prev => { const next = new Set(prev); next.delete(key); return next })
    }
  }

  async function clearAllPurchased() {
    if (!confirm('确认清除所有采购记录？')) return
    const snap = await getDocs(collection(db, 'cheers_procurement_tracking'))
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
    setPurchasedKeys(new Set())
  }

  function flashCopied(id) {
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const procOrders = orders.filter(o => procStatuses.has(o.status))
  const delivOrders = orders.filter(o => delivStatuses.has(o.status))

  return (
    <div>
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-5">报表</h1>

      {/* Tab bar */}
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
          orders={procOrders}
          products={products}
          categories={categories}
          statuses={procStatuses}
          onToggleStatus={s => toggleStatus(procStatuses, setProcStatuses, s)}
          purchasedKeys={purchasedKeys}
          onTogglePurchased={togglePurchased}
          onClearAll={clearAllPurchased}
          lang={lang}
        />
      )}
      {tab === 'delivery' && (
        <DeliveryTab
          orders={delivOrders}
          statuses={delivStatuses}
          onToggleStatus={s => toggleStatus(delivStatuses, setDelivStatuses, s)}
          copyWithContact={copyWithContact}
          onToggleCopyContact={() => setCopyWithContact(v => !v)}
          copied={copied}
          onCopy={flashCopied}
          lang={lang}
        />
      )}
      {tab === 'sales' && (
        <SalesTab orders={orders} lang={lang} />
      )}
    </div>
  )
}

// ── Procurement Tab ──────────────────────────────────────────────────────────
function ProcurementTab({ orders, products, categories, statuses, onToggleStatus, purchasedKeys, onTogglePurchased, onClearAll, lang }) {
  // Aggregate items across orders
  const aggMap = {}
  for (const order of orders) {
    for (const item of order.items || []) {
      const key = getKey(item)
      if (!aggMap[key]) {
        const prod = products.find(p => p.id === item.productId)
        const catId = prod ? (prod.categoryIds?.[0] || prod.categoryId) : null
        const cat = categories.find(c => c.id === catId)
        aggMap[key] = {
          key, name: item.name, size: item.size || '',
          price: item.price, qty: 0,
          catName: cat?.name?.zh || cat?.name?.en || '未分类',
          orderIds: [],
        }
      }
      aggMap[key].qty += item.quantity
      aggMap[key].orderIds.push(order.id)
    }
  }

  // Group by category
  const byCategory = {}
  for (const item of Object.values(aggMap)) {
    const cat = item.catName
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  }

  const totalItems = Object.values(aggMap).length
  const purchasedCount = Object.values(aggMap).filter(i => purchasedKeys.has(i.key)).length

  function copyList() {
    const lines = []
    for (const [cat, items] of Object.entries(byCategory)) {
      lines.push(`【${cat}】`)
      for (const i of items) {
        const status = purchasedKeys.has(i.key) ? '✓ ' : '□ '
        lines.push(`${status}${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`)
      }
    }
    navigator.clipboard?.writeText(lines.join('\n'))
  }

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-cheers-dark-brown mb-2">筛选订单状态</p>
            <div className="flex gap-2 flex-wrap">
              {['pending', 'confirmed', 'purchasing', 'procured'].map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-cheers-brown"
                    checked={statuses.has(s)} onChange={() => onToggleStatus(s)} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}>{STATUS_ZH[s]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyList} className="btn-secondary text-xs py-1.5 px-3">📋 复制清单</button>
            <button onClick={onClearAll} className="text-xs text-red-400 hover:text-red-600 px-2">重置</button>
          </div>
        </div>
        <div className="text-xs text-cheers-brown/50">
          共 {orders.length} 单 · {totalItems} 种商品 · 已购 {purchasedCount} / {totalItems}
          {totalItems > 0 && (
            <span className="ml-2 text-cheers-brown font-medium">
              {Math.round(purchasedCount / totalItems * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Aggregated product list */}
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-cheers-cream/40 border-b border-cheers-cream">
            <p className="text-sm font-semibold text-cheers-dark-brown">{cat}</p>
          </div>
          <div className="divide-y divide-cheers-cream">
            {items.map(item => {
              const bought = purchasedKeys.has(item.key)
              return (
                <label key={item.key} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${bought ? 'bg-green-50/50' : 'hover:bg-cheers-cream/10'}`}>
                  <input type="checkbox" className="w-4 h-4 accent-green-600 flex-shrink-0"
                    checked={bought} onChange={e => onTogglePurchased(item.key, e.target.checked)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${bought ? 'line-through text-cheers-brown/40' : 'text-cheers-dark-brown'}`}>
                      {item.name}{item.size ? ` · ${item.size}` : ''}
                    </p>
                    <p className="text-xs text-cheers-brown/50 mt-0.5">RM {item.price?.toFixed(2)} / 件</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-bold ${bought ? 'text-green-600' : 'text-cheers-brown'}`}>× {item.qty}</p>
                    <p className="text-xs text-cheers-brown/40">RM {(item.price * item.qty).toFixed(2)}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(byCategory).length === 0 && (
        <div className="text-center py-12 text-cheers-brown/40">暂无订单</div>
      )}
    </div>
  )
}

// ── Delivery Tab ─────────────────────────────────────────────────────────────
function DeliveryTab({ orders, statuses, onToggleStatus, copyWithContact, onToggleCopyContact, copied, onCopy, lang }) {
  // Group by state / region
  const groups = {}
  for (const order of orders) {
    const d = order.delivery || {}
    let groupKey
    if (d.type === 'face-to-face') {
      groupKey = `面交 · ${d.location || '未指定'}`
    } else {
      groupKey = d.state || (d.region === 'east' ? '东马（州属未填）' : '西马（州属未填）')
    }
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(order)
  }

  const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'zh'))

  function buildAddress(order) {
    const d = order.delivery || {}
    if (d.type === 'face-to-face') return `面交 · ${d.location || ''}`
    const parts = [d.address, `${d.postcode || ''} ${d.city || ''}`.trim(), d.state].filter(Boolean)
    return parts.join('\n')
  }

  function handleCopy(order) {
    const d = order.delivery || {}
    const addr = buildAddress(order)
    const text = copyWithContact
      ? `${order.userName || ''} · ${d.phone || ''}\n${addr}`
      : addr
    copyToClipboard(text)
    onCopy(order.id)
  }

  function copyAllForGroup(groupOrders) {
    const lines = groupOrders.map(o => {
      const addr = buildAddress(o)
      return copyWithContact ? `${o.userName || ''} · ${o.delivery?.phone || ''}\n${addr}` : addr
    })
    copyToClipboard(lines.join('\n\n'))
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-cheers-dark-brown mb-2">筛选订单状态</p>
            <div className="flex gap-2 flex-wrap">
              {['confirmed', 'purchasing', 'procured', 'shipped'].map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-cheers-brown"
                    checked={statuses.has(s)} onChange={() => onToggleStatus(s)} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}>{STATUS_ZH[s]}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Copy option */}
          <label className="flex items-center gap-2 cursor-pointer bg-cheers-cream/40 border border-cheers-cream rounded-lg px-3 py-2">
            <input type="checkbox" className="w-4 h-4 accent-cheers-brown"
              checked={copyWithContact} onChange={onToggleCopyContact} />
            <span className="text-sm text-cheers-dark-brown">📋 包含姓名和手机号</span>
          </label>
        </div>
        <p className="text-xs text-cheers-brown/50">共 {orders.length} 单 · {sortedGroups.length} 个州属/分组</p>
      </div>

      {/* Groups */}
      {sortedGroups.map(([state, stateOrders]) => (
        <div key={state} className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-cheers-cream/40 border-b border-cheers-cream flex items-center justify-between">
            <p className="text-sm font-semibold text-cheers-dark-brown">{state} <span className="font-normal text-cheers-brown/50">({stateOrders.length} 单)</span></p>
            <button onClick={() => copyAllForGroup(stateOrders)}
              className="text-xs text-cheers-brown hover:text-cheers-dark-brown border border-cheers-brown/20 px-2 py-1 rounded-lg">
              复制全组
            </button>
          </div>
          <div className="divide-y divide-cheers-cream">
            {stateOrders.map(order => {
              const d = order.delivery || {}
              const isFace = d.type === 'face-to-face'
              return (
                <div key={order.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-cheers-dark-brown">{order.orderId || order.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_ZH[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-cheers-dark-brown">{order.userName}</p>
                    <p className="text-xs text-cheers-brown/60">{d.phone}</p>
                    {!isFace && (
                      <p className="text-xs text-cheers-brown/70 mt-0.5 leading-relaxed">
                        {d.address}<br />
                        {d.postcode} {d.city}{d.state ? `, ${d.state}` : ''}
                      </p>
                    )}
                    <p className="text-xs text-cheers-brown/50 mt-1">
                      {order.items?.map(i => `${i.name}${i.size ? ` (${i.size})` : ''} ×${i.quantity}`).join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
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

      {sortedGroups.length === 0 && (
        <div className="text-center py-12 text-cheers-brown/40">暂无订单</div>
      )}
    </div>
  )
}

// ── Sales Tab ────────────────────────────────────────────────────────────────
function SalesTab({ orders, lang }) {
  const completed = orders.filter(o => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0)
  const pending = orders.filter(o => ['pending', 'confirmed', 'purchasing', 'procured'].includes(o.status))
  const pendingRevenue = pending.reduce((s, o) => s + (o.total || 0), 0)

  const byStatus = {}
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1
  }

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
          {['pending', 'confirmed', 'purchasing', 'procured', 'shipped', 'completed'].map(s => {
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
