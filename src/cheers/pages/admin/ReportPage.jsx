import React, { useEffect, useState, useCallback } from 'react'
import {
  getFirestore, collection, getDocs, doc, getDoc, query, orderBy,
  setDoc, deleteDoc, updateDoc,
} from 'firebase/firestore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
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
  { key: 'search',      label: '🔍 搜索关键词' },
  { key: 'products',    label: '📊 商品分析' },
  { key: 'traffic',     label: '📡 流量来源' },
]

export default function ReportPage() {
  const { lang } = useLang()
  const [tab, setTab] = useState('procurement')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [tracking, setTracking] = useState({}) // { [key]: qty }
  const [productStats, setProductStats] = useState({})
  const [trafficVisits, setTrafficVisits] = useState({}) // { [source]: visitCount }
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [procStatuses, setProcStatuses] = useState(new Set(['confirmed', 'purchasing']))
  const [delivStatuses, setDelivStatuses] = useState(new Set(['confirmed', 'purchasing', 'procured', 'shipped']))

  const load = useCallback(async () => {
    setLoading(true)
    const [ordersSnap, prodsSnap, catsSnap, tripsSnap, trackSnap, statsSnap, visitsSnap] = await Promise.all([
      getDocs(query(collection(db, 'cheers_orders'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'cheers_products')),
      getDocs(collection(db, 'cheers_categories')),
      getDocs(collection(db, 'cheers_trips')),
      getDocs(collection(db, 'cheers_procurement_tracking')),
      getDocs(collection(db, 'cheers_product_stats')),
      getDoc(doc(db, 'cheers_traffic_stats', 'source_visits')),
    ])
    setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setProducts(prodsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setTrips(tripsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    const statsMap = {}
    statsSnap.docs.forEach(d => { statsMap[d.id] = d.data() })
    setProductStats(statsMap)
    setTrafficVisits(visitsSnap.exists() ? visitsSnap.data() : {})
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
      {tab === 'search' && <SearchTab lang={lang} />}
      {tab === 'products' && <ProductsAnalyticsTab products={products} productStats={productStats} trips={trips} lang={lang} />}
      {tab === 'traffic' && <TrafficSourceTab orders={orders} trafficVisits={trafficVisits} lang={lang} />}
    </div>
  )
}

// ── 搜索关键词 Tab ──────────────────────────────────────────────────────────
function SearchTab() {
  const [logs, setLogs] = useState(null)

  useEffect(() => {
    // 仅拉最近 1000 条，足够生成 Top 10
    getDocs(query(collection(db, 'cheers_search_logs'), orderBy('createdAt', 'desc')))
      .then(snap => setLogs(snap.docs.slice(0, 1000).map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setLogs([]))
  }, [])

  if (logs === null) return <p className="text-cheers-brown/50 text-sm">加载中…</p>
  if (logs.length === 0) return (
    <div className="card p-6 text-center text-cheers-brown/50">
      <p className="text-sm">还没有搜索记录</p>
      <p className="text-xs mt-1">顾客在搜索框输入并停留 1 秒后会自动记录</p>
    </div>
  )

  // 聚合：按 query 计数
  const grouped = logs.reduce((acc, l) => {
    if (!l.query) return acc
    if (!acc[l.query]) acc[l.query] = { query: l.query, count: 0, hits: 0, misses: 0, lastSeen: 0 }
    acc[l.query].count += 1
    if ((l.resultsCount || 0) > 0) acc[l.query].hits += 1
    else acc[l.query].misses += 1
    const ts = l.createdAt?.seconds || 0
    if (ts > acc[l.query].lastSeen) acc[l.query].lastSeen = ts
    return acc
  }, {})
  const all = Object.values(grouped)
  const topAll = [...all].sort((a, b) => b.count - a.count).slice(0, 10)
  const topMisses = all.filter(x => x.misses > 0).sort((a, b) => b.misses - a.misses).slice(0, 10)

  function fmtTime(ts) {
    if (!ts) return ''
    const d = new Date(ts * 1000)
    return d.toLocaleDateString('zh-MY', { month: '2-digit', day: '2-digit' }) + ' ' +
           d.toLocaleTimeString('zh-MY', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="font-medium text-cheers-dark-brown mb-3">🔥 热门搜索 Top 10</h3>
        <p className="text-xs text-cheers-brown/50 mb-3">最近 1000 条搜索记录的聚合</p>
        {topAll.length === 0 ? (
          <p className="text-sm text-cheers-brown/40">暂无</p>
        ) : (
          <ol className="space-y-1.5">
            {topAll.map((x, i) => (
              <li key={x.query} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-cheers-brown/40 w-5 text-xs">{i + 1}.</span>
                  <span className="font-medium text-cheers-dark-brown truncate">{x.query}</span>
                </span>
                <span className="text-xs text-cheers-brown/60 flex-shrink-0">
                  {x.count} 次{x.misses > 0 && <span className="text-amber-600"> · {x.misses} 无结果</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="card p-4 bg-amber-50/40 border-amber-200">
        <h3 className="font-medium text-cheers-dark-brown mb-3">⚠️ 无结果搜索 Top 10</h3>
        <p className="text-xs text-cheers-brown/50 mb-3">顾客想买但你没货 — 下次代购的提示</p>
        {topMisses.length === 0 ? (
          <p className="text-sm text-cheers-brown/40">暂无 — 顾客每次搜索都有结果 👍</p>
        ) : (
          <ol className="space-y-1.5">
            {topMisses.map((x, i) => (
              <li key={x.query} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-amber-600/60 w-5 text-xs">{i + 1}.</span>
                  <span className="font-medium text-cheers-dark-brown truncate">{x.query}</span>
                </span>
                <span className="text-xs text-amber-700 flex-shrink-0">
                  {x.misses} 次无结果
                  <span className="text-cheers-brown/40"> · {fmtTime(x.lastSeen)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

// ── 商品分析 Tab ──────────────────────────────────────────────────────────────
function ProductsAnalyticsTab({ products, productStats, trips, lang }) {
  const [sortKey, setSortKey] = useState('views')
  const [chartMetric, setChartMetric] = useState('views')
  const [tripFilter, setTripFilter] = useState('') // '' = all, else tripId

  function pName(p) {
    const n = p.name
    if (!n) return p.id
    const s = (lang === 'zh' ? (n.zh || n.en) : (n.en || n.zh)) || p.id
    return s.length > 14 ? s.slice(0, 13) + '…' : s
  }

  function tName(trip) {
    const n = trip.name
    if (!n) return trip.id
    return typeof n === 'object' ? (n.zh || n.en || trip.id) : n
  }

  const filteredProducts = tripFilter
    ? products.filter(p => p.tripId === tripFilter)
    : products

  const rows = filteredProducts.map(p => {
    const s = productStats[p.id] || {}
    const views = s.views || 0
    const adds = s.addsToCart || 0
    const purchases = s.purchases || 0
    return {
      id: p.id,
      name: pName(p),
      views,
      adds,
      purchases,
      addRate: views > 0 ? ((adds / views) * 100).toFixed(1) : '—',
      buyRate: adds > 0 ? ((purchases / adds) * 100).toFixed(1) : '—',
    }
  })

  const totalViews = rows.reduce((s, r) => s + r.views, 0)
  const totalAdds = rows.reduce((s, r) => s + r.adds, 0)
  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0)

  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey])
  const top10 = sorted.slice(0, 10)

  const CHART_COLORS = ['#8B5E3C', '#A0724E', '#B58860', '#C99E76', '#DDBA8E']

  const metricLabel = { views: '浏览量', adds: '加购数', purchases: '下单数' }

  return (
    <div className="space-y-6">
      {/* 旅程过滤器 */}
      {trips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-cheers-brown/50 mr-1">旅程：</span>
          <button
            onClick={() => setTripFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tripFilter === '' ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'}`}>
            全部
          </button>
          {trips.map(trip => (
            <button key={trip.id}
              onClick={() => setTripFilter(trip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tripFilter === trip.id ? 'bg-cheers-brown text-cheers-cream' : 'border border-cheers-brown/30 text-cheers-brown hover:border-cheers-brown'}`}>
              {tName(trip)}
            </button>
          ))}
        </div>
      )}

      {/* 漏斗汇总 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '总浏览', value: totalViews, icon: '👀', sub: null },
          {
            label: '总加购',
            value: totalAdds,
            icon: '🛒',
            sub: totalViews > 0 ? `转化率 ${((totalAdds / totalViews) * 100).toFixed(1)}%` : null,
          },
          {
            label: '总下单',
            value: totalPurchases,
            icon: '📦',
            sub: totalAdds > 0 ? `转化率 ${((totalPurchases / totalAdds) * 100).toFixed(1)}%` : null,
          },
        ].map((item, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-2xl font-bold text-cheers-dark-brown">{item.value.toLocaleString()}</div>
            <div className="text-xs text-cheers-brown/60 mt-1">{item.label}</div>
            {item.sub && <div className="text-xs text-green-600 mt-0.5">{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* 排行榜图表 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-cheers-dark-brown">Top 10 商品排行榜</h3>
          <div className="flex gap-1">
            {Object.entries(metricLabel).map(([k, label]) => (
              <button key={k} onClick={() => setChartMetric(k)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${chartMetric === k ? 'bg-cheers-brown text-white' : 'bg-cheers-cream text-cheers-brown hover:bg-cheers-brown/20'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5d9cf" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [v, metricLabel[chartMetric]]} />
            <Bar dataKey={chartMetric} radius={[0, 3, 3, 0]}>
              {top10.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 明细表 */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cheers-cream text-cheers-brown/60 text-xs">
              {[
                { key: null,        label: '商品名称' },
                { key: 'views',     label: '浏览' },
                { key: 'adds',      label: '加购' },
                { key: null,        label: '加购率%' },
                { key: 'purchases', label: '下单' },
                { key: null,        label: '下单率%' },
              ].map((col, i) => (
                <th key={i}
                  onClick={() => col.key && setSortKey(col.key)}
                  className={`px-3 py-2.5 text-left ${col.key ? 'cursor-pointer hover:text-cheers-brown select-none' : ''} ${sortKey === col.key ? 'text-cheers-brown font-semibold' : ''}`}>
                  {col.label}{sortKey === col.key ? ' ▼' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} className={`border-b border-cheers-cream/50 hover:bg-cheers-cream/20 ${i === 0 ? 'bg-amber-50/40' : ''}`}>
                <td className="px-3 py-2 font-medium text-cheers-dark-brown max-w-[180px] truncate">{r.name}</td>
                <td className="px-3 py-2 text-cheers-brown">{r.views.toLocaleString()}</td>
                <td className="px-3 py-2 text-cheers-brown">{r.adds.toLocaleString()}</td>
                <td className="px-3 py-2 text-cheers-brown/70">{r.addRate}{r.addRate !== '—' ? '%' : ''}</td>
                <td className="px-3 py-2 text-cheers-brown">{r.purchases.toLocaleString()}</td>
                <td className="px-3 py-2 text-cheers-brown/70">{r.buyRate}{r.buyRate !== '—' ? '%' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 流量来源 Tab ──────────────────────────────────────────────────────────────
const PLATFORM_PRESETS = [
  { label: 'Instagram', source: 'Instagram', medium: 'social' },
  { label: 'Facebook',  source: 'Facebook',  medium: 'social' },
  { label: 'WhatsApp',  source: 'WhatsApp',  medium: 'messaging' },
  { label: 'Telegram',  source: 'Telegram',  medium: 'messaging' },
  { label: '小红书',     source: 'Xiaohongshu', medium: 'social' },
  { label: 'TikTok',    source: 'TikTok',    medium: 'social' },
  { label: '自定义',     source: '',          medium: '' },
]

function TrafficSourceTab({ orders, trafficVisits }) {
  const [showGenerator, setShowGenerator] = useState(false)
  const [genUrl, setGenUrl] = useState('')
  const [genPlatform, setGenPlatform] = useState(PLATFORM_PRESETS[0])
  const [genCustomSource, setGenCustomSource] = useState('')
  const [genCampaign, setGenCampaign] = useState('')
  const [copied, setCopied] = useState(false)

  const CHART_COLORS = ['#8B5E3C', '#A0724E', '#B58860', '#C99E76', '#DDBA8E', '#6B8E7A', '#5B7E9A', '#7A6B8E']

  // 合并：来自 trafficVisits（浏览）和 orders（下单）的来源数据
  const sourceMap = {}

  // 浏览来源（从 cheers_traffic_stats/source_visits）
  for (const [src, visits] of Object.entries(trafficVisits)) {
    if (!sourceMap[src]) sourceMap[src] = { source: src, visits: 0, orders: 0, revenue: 0 }
    sourceMap[src].visits += Number(visits) || 0
  }

  // 下单来源（从 cheers_orders[].trafficSource）
  for (const o of orders) {
    const src = o.trafficSource?.source || null
    if (!src) continue
    if (!sourceMap[src]) sourceMap[src] = { source: src, visits: 0, orders: 0, revenue: 0 }
    sourceMap[src].orders++
    sourceMap[src].revenue += Number(o.total) || 0
  }

  const sourceRows = Object.values(sourceMap).sort((a, b) => b.visits - a.visits || b.orders - a.orders)
  const totalVisits = Object.values(trafficVisits).reduce((s, v) => s + Number(v), 0)
  const trackedOrders = orders.filter(o => o.trafficSource?.source).length
  const hasVisitData = totalVisits > 0

  const chartData = sourceRows.slice(0, 8)

  function buildLink() {
    if (!genUrl.trim()) return ''
    try {
      const src = genPlatform.label === '自定义' ? genCustomSource.trim() : genPlatform.source
      const med = genPlatform.medium
      const u = new URL(genUrl.trim().startsWith('http') ? genUrl.trim() : 'https://' + genUrl.trim())
      if (src) u.searchParams.set('utm_source', src)
      if (med) u.searchParams.set('utm_medium', med)
      if (genCampaign.trim()) u.searchParams.set('utm_campaign', genCampaign.trim())
      return u.toString()
    } catch { return '' }
  }

  const generatedLink = buildLink()

  function handleCopy() {
    if (!generatedLink) return
    navigator.clipboard?.writeText(generatedLink).catch(() => {
      const el = document.createElement('textarea')
      el.value = generatedLink; document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* 说明卡 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">📡 流量来源追踪</p>
        {hasVisitData ? (
          <p className="text-blue-700/80">已追踪到 <strong>{totalVisits.toLocaleString()}</strong> 次商品浏览，<strong>{trackedOrders}</strong> 个有来源信息的订单。历史数据（上线前）不计入。</p>
        ) : (
          <p className="text-blue-700/80">追踪已启动。用下方的链接生成器制作追踪链接，分享给顾客后，顾客的浏览和下单数据会在这里显示。</p>
        )}
      </div>

      {/* 汇总表 */}
      {sourceRows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cheers-cream text-cheers-brown/60 text-xs">
                <th className="px-3 py-2.5 text-left">来源平台</th>
                <th className="px-3 py-2.5 text-left">商品浏览</th>
                <th className="px-3 py-2.5 text-left">下单数</th>
                <th className="px-3 py-2.5 text-left">浏览→下单%</th>
                <th className="px-3 py-2.5 text-left">销售额 (RM)</th>
              </tr>
            </thead>
            <tbody>
              {sourceRows.map((r, i) => {
                const convRate = r.visits > 0 ? ((r.orders / r.visits) * 100).toFixed(1) : '—'
                return (
                  <tr key={r.source} className={`border-b border-cheers-cream/50 hover:bg-cheers-cream/20 ${i === 0 ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-3 py-2 font-medium text-cheers-dark-brown">{r.source}</td>
                    <td className="px-3 py-2 text-cheers-brown">{r.visits > 0 ? r.visits.toLocaleString() : <span className="text-cheers-brown/30">—</span>}</td>
                    <td className="px-3 py-2 text-cheers-brown">{r.orders}</td>
                    <td className="px-3 py-2 text-green-600 text-xs">{convRate}{convRate !== '—' ? '%' : ''}</td>
                    <td className="px-3 py-2 text-cheers-brown">RM {r.revenue.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 图表 */}
      {chartData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-medium text-cheers-dark-brown mb-4">各平台浏览量</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5d9cf" />
              <XAxis dataKey="source" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v, name) => [v, name === 'visits' ? '浏览次数' : '订单数']} />
              <Bar dataKey="visits" name="visits" radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 追踪链接生成器 */}
      <div className="card p-4">
        <button onClick={() => setShowGenerator(v => !v)}
          className="flex items-center gap-2 w-full text-left font-medium text-cheers-dark-brown">
          <span>🔗 追踪链接生成器</span>
          <span className="text-cheers-brown/40 text-xs ml-auto">{showGenerator ? '收起 ▲' : '展开 ▼'}</span>
        </button>
        {showGenerator && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-cheers-brown/60">将带参数的链接分享给顾客，顾客一点击就会自动记录来源平台</p>

            <div>
              <label className="text-xs text-cheers-brown/70 mb-1 block">商品页链接（必填）</label>
              <input value={genUrl} onChange={e => setGenUrl(e.target.value)} placeholder="https://yoursite.com/products/xxx"
                className="input w-full text-sm" />
            </div>

            <div>
              <label className="text-xs text-cheers-brown/70 mb-1 block">平台</label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_PRESETS.map(p => (
                  <button key={p.label} onClick={() => setGenPlatform(p)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${genPlatform.label === p.label ? 'bg-cheers-brown text-white' : 'bg-cheers-cream text-cheers-brown hover:bg-cheers-brown/20'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {genPlatform.label === '自定义' && (
              <div>
                <label className="text-xs text-cheers-brown/70 mb-1 block">自定义平台名称</label>
                <input value={genCustomSource} onChange={e => setGenCustomSource(e.target.value)} placeholder="如：newsletter"
                  className="input w-full text-sm" />
              </div>
            )}

            <div>
              <label className="text-xs text-cheers-brown/70 mb-1 block">活动名称（选填）</label>
              <input value={genCampaign} onChange={e => setGenCampaign(e.target.value)} placeholder="如：母亲节促销"
                className="input w-full text-sm" />
            </div>

            {generatedLink && (
              <div className="bg-cheers-cream/50 rounded-lg p-3">
                <p className="text-xs text-cheers-brown/60 mb-1.5">生成的追踪链接：</p>
                <p className="text-xs text-cheers-dark-brown break-all font-mono">{generatedLink}</p>
                <button onClick={handleCopy}
                  className={`mt-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-cheers-brown text-white hover:bg-cheers-dark-brown'}`}>
                  {copied ? '✓ 已复制！' : '复制链接'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
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

  function formatContact(order) {
    const addr = buildAddr(order)
    if (!copyWithContact) return addr
    const lines = []
    if (order.userName) lines.push(order.userName)
    if (order.delivery?.phone) lines.push(order.delivery.phone)
    lines.push(addr)
    return lines.join('\n')
  }

  function handleCopy(order) {
    copyText(formatContact(order))
    setCopied(order.id); setTimeout(() => setCopied(null), 1500)
  }

  function copyGroup(groupOrders) {
    copyText(groupOrders.map(formatContact).join('\n\n'))
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

// ── Profit helpers ────────────────────────────────────────────────────────────
function computeOrderProfit(order) {
  const items = order.items || []
  const allHaveCost = items.length > 0 && items.every(i => i.costPrice != null && i.costPrice >= 0)
  if (!allHaveCost) return null
  const totalCost = items.reduce((s, i) => s + i.costPrice * i.quantity, 0)
  const shipping = order.actualShippingFee != null ? order.actualShippingFee : null
  if (shipping == null) return null
  return (order.total || 0) - totalCost - shipping
}

function profitLabel(profit, total) {
  if (profit == null) return { text: '待补全', color: 'text-cheers-brown/40' }
  const pct = total > 0 ? (profit / total * 100).toFixed(1) : '0.0'
  if (profit >= 0) return { text: `+RM ${profit.toFixed(2)} (${pct}%)`, color: 'text-green-600' }
  return { text: `-RM ${Math.abs(profit).toFixed(2)} (${pct}%)`, color: 'text-red-500' }
}

// ── Sales Tab ────────────────────────────────────────────────────────────────
function SalesTab({ orders }) {
  const [profitView, setProfitView] = useState('summary') // 'summary' | 'orders' | 'products'

  const completed = orders.filter(o => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0)
  const pending = orders.filter(o => PRE_PROCURED.includes(o.status) || o.status === 'procured')
  const pendingRevenue = pending.reduce((s, o) => s + (o.total || 0), 0)
  const byStatus = {}
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1

  // Profit calculations on completed orders
  const completedWithProfit = completed.map(o => ({ ...o, _profit: computeOrderProfit(o) }))
  const profitOrders = completedWithProfit.filter(o => o._profit != null)
  const totalProfit = profitOrders.reduce((s, o) => s + o._profit, 0)
  const avgMargin = profitOrders.length > 0
    ? profitOrders.reduce((s, o) => s + (o._profit / (o.total || 1)), 0) / profitOrders.length * 100
    : null

  // Shipping P&L
  const ordersWithBothShipping = completed.filter(o => o.shippingFee != null && o.actualShippingFee != null)
  const chargedShipping = ordersWithBothShipping.reduce((s, o) => s + (o.shippingFee || 0), 0)
  const actualShipping = ordersWithBothShipping.reduce((s, o) => s + (o.actualShippingFee || 0), 0)
  const shippingPnl = chargedShipping - actualShipping

  // Product profit ranking (completed orders)
  const productMap = {}
  for (const order of profitOrders) {
    const items = order.items || []
    const itemsCost = items.reduce((s, i) => s + (i.costPrice || 0) * i.quantity, 0)
    const shippingPortion = order.actualShippingFee != null ? order.actualShippingFee : 0
    for (const item of items) {
      const key = `${item.productId || item.name}|${item.color || ''}|${item.size || ''}`
      const name = item.name || '未知商品'
      const revenue = (item.price || 0) * item.quantity
      const cost = (item.costPrice || 0) * item.quantity
      const shippingShare = itemsCost > 0 ? (cost / itemsCost) * shippingPortion : 0
      if (!productMap[key]) productMap[key] = { name, qty: 0, revenue: 0, cost: 0, shipping: 0 }
      productMap[key].qty += item.quantity
      productMap[key].revenue += revenue
      productMap[key].cost += cost
      productMap[key].shipping += shippingShare
    }
  }
  const productRanking = Object.values(productMap)
    .map(p => ({ ...p, profit: p.revenue - p.cost - p.shipping, margin: p.revenue > 0 ? (p.revenue - p.cost - p.shipping) / p.revenue * 100 : 0 }))
    .sort((a, b) => b.margin - a.margin)

  return (
    <div className="space-y-4">
      {/* Revenue summary */}
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

      {/* Status bar chart */}
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

      {/* Profit section */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-cheers-cream flex items-center justify-between">
          <p className="text-sm font-medium text-cheers-dark-brown">💹 利润分析</p>
          <p className="text-xs text-cheers-brown/40">基于已完成订单 · 需填成本价及实际邮费</p>
        </div>
        <div className="flex border-b border-cheers-cream">
          {[['summary','汇总'], ['orders','按订单'], ['products','商品排行']].map(([k, label]) => (
            <button key={k} onClick={() => setProfitView(k)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${profitView === k ? 'bg-cheers-cream/60 text-cheers-brown border-b-2 border-cheers-brown' : 'text-cheers-brown/50 hover:text-cheers-brown'}`}>
              {label}
            </button>
          ))}
        </div>

        {profitView === 'summary' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-700/70 mb-1">总利润（已完成）</p>
                <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-700' : 'text-red-500'}`}>
                  {profitOrders.length > 0 ? `RM ${totalProfit.toFixed(2)}` : '—'}
                </p>
                <p className="text-[10px] text-green-700/50">{profitOrders.length}/{completed.length} 单有数据</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-700/70 mb-1">平均利润率</p>
                <p className="text-lg font-bold text-blue-700">
                  {avgMargin != null ? `${avgMargin.toFixed(1)}%` : '—'}
                </p>
                <p className="text-[10px] text-blue-700/50">已完成有数据订单</p>
              </div>
              <div className={`${shippingPnl >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-xl p-3`}>
                <p className={`text-xs mb-1 ${shippingPnl >= 0 ? 'text-green-700/70' : 'text-red-700/70'}`}>运费盈亏</p>
                <p className={`text-lg font-bold ${shippingPnl >= 0 ? 'text-green-700' : 'text-red-500'}`}>
                  {ordersWithBothShipping.length > 0
                    ? `${shippingPnl >= 0 ? '+' : ''}RM ${shippingPnl.toFixed(2)}`
                    : '—'}
                </p>
                <p className={`text-[10px] ${shippingPnl >= 0 ? 'text-green-700/50' : 'text-red-700/50'}`}>
                  收 RM {chargedShipping.toFixed(2)} · 实 RM {actualShipping.toFixed(2)}
                </p>
              </div>
            </div>
            {completed.length > profitOrders.length && (
              <p className="text-xs text-cheers-brown/40">
                {completed.length - profitOrders.length} 单缺成本价或实际邮费，不计入利润统计。请在商品编辑填写成本价，发货时填写实际邮费。
              </p>
            )}
          </div>
        )}

        {profitView === 'orders' && (
          <div className="divide-y divide-cheers-cream max-h-[60vh] overflow-y-auto">
            {completedWithProfit.length === 0 && (
              <p className="text-center py-8 text-cheers-brown/40 text-sm">暂无已完成订单</p>
            )}
            {completedWithProfit.map(o => {
              const { text, color } = profitLabel(o._profit, o.total)
              return (
                <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cheers-dark-brown">{o.orderId || o.id}</p>
                    <p className="text-xs text-cheers-brown/50">{o.userName} · RM {o.total?.toFixed(2)}</p>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${color}`}>{text}</span>
                </div>
              )
            })}
          </div>
        )}

        {profitView === 'products' && (
          <div className="divide-y divide-cheers-cream max-h-[60vh] overflow-y-auto">
            {productRanking.length === 0 && (
              <p className="text-center py-8 text-cheers-brown/40 text-sm">暂无利润数据</p>
            )}
            {productRanking.map((p, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-xs font-bold text-cheers-brown/30 w-5 flex-shrink-0 pt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cheers-dark-brown truncate">{p.name}</p>
                  <p className="text-xs text-cheers-brown/50">
                    {p.qty} 件 · 收 RM {p.revenue.toFixed(2)} · 成本 RM {p.cost.toFixed(2)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${p.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {p.profit >= 0 ? '+' : ''}RM {p.profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-cheers-brown/40">{p.margin.toFixed(1)}% 利润率</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
