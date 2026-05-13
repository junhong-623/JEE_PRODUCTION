// 顾客行为追踪工具
// - 写 Firestore counter（admin 自己看）
// - 同时发 GA4 事件（cheers 专属，独立于其他子应用）
//
// 设计原则：所有调用都是 fire-and-forget，失败不影响主流程。

// ─── 流量来源追踪 ──────────────────────────────────────────────────────────────

const TRAFFIC_SOURCE_KEY = 'cheers_traffic_source'

const REFERRER_MAP = [
  { pattern: /instagram\.com/, source: 'Instagram', medium: 'social' },
  { pattern: /facebook\.com|fb\.com/, source: 'Facebook', medium: 'social' },
  { pattern: /wa\.me|api\.whatsapp\.com|whatsapp\.com/, source: 'WhatsApp', medium: 'messaging' },
  { pattern: /t\.me|telegram\.me/, source: 'Telegram', medium: 'messaging' },
  { pattern: /xiaohongshu\.com|xhslink\.com/, source: 'Xiaohongshu', medium: 'social' },
  { pattern: /tiktok\.com/, source: 'TikTok', medium: 'social' },
]

// 从 URL params 或 referrer 捕获来源，存入 sessionStorage（每次会话只捕获一次）
export function captureTrafficSource() {
  try {
    if (sessionStorage.getItem(TRAFFIC_SOURCE_KEY)) return
    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium')
    const utmCampaign = params.get('utm_campaign')
    if (utmSource) {
      sessionStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify({
        source: utmSource,
        medium: utmMedium || '',
        campaign: utmCampaign || '',
      }))
      return
    }
    const ref = document.referrer
    if (ref) {
      const match = REFERRER_MAP.find(r => r.pattern.test(ref))
      if (match) {
        sessionStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify({
          source: match.source, medium: match.medium, campaign: ''
        }))
        return
      }
    }
    sessionStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify({
      source: 'Direct', medium: '', campaign: ''
    }))
  } catch {}
}

export function getStoredTrafficSource() {
  try {
    const raw = sessionStorage.getItem(TRAFFIC_SOURCE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { addDoc, collection, doc, setDoc, increment, serverTimestamp } from 'firebase/firestore'
import { getAnalytics, isSupported as analyticsIsSupported, logEvent } from 'firebase/analytics'
import { db } from '../../lib/firebase'

// 初始化 cheers 专属 Analytics — 用独立 FirebaseApp 实例避免污染其他子应用
let analytics = null
const CHEERS_MEASUREMENT_ID = import.meta.env.VITE_CHEERS_FIREBASE_MEASUREMENT_ID

if (typeof window !== 'undefined' && CHEERS_MEASUREMENT_ID) {
  analyticsIsSupported().then(supported => {
    if (!supported) return
    try {
      const cheersAnalyticsApp = initializeApp({
        apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId:             import.meta.env.VITE_CHEERS_FIREBASE_APP_ID,
        measurementId:     CHEERS_MEASUREMENT_ID,
      }, 'cheers-analytics')
      analytics = getAnalytics(cheersAnalyticsApp)
    } catch {}
  }).catch(() => {})
}

const VIEWED_KEY_PREFIX = 'cheers_viewed_'  // sessionStorage 去重前缀

// 同一 session 同一商品只算 1 次浏览（避免刷新刷数）
function alreadyViewedThisSession(productId) {
  try {
    const key = VIEWED_KEY_PREFIX + productId
    if (sessionStorage.getItem(key)) return true
    sessionStorage.setItem(key, '1')
    return false
  } catch {
    return false
  }
}

function productNameStr(name) {
  if (typeof name === 'string') return name
  return name?.zh || name?.en || ''
}

// 商品浏览：同 session 去重 + 区分登录态 + 来源追踪
export function trackProductView(product, user) {
  if (!product?.id) return
  if (alreadyViewedThisSession(product.id)) return

  const src = getStoredTrafficSource()
  const source = src?.source || null

  // Firestore counter（fire-and-forget）
  setDoc(
    doc(db, 'cheers_product_stats', product.id),
    {
      views: increment(1),
      ...(user ? { loggedInViews: increment(1) } : {}),
      ...(source ? { [`sv_${source}`]: increment(1) } : {}),
      lastViewedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {})

  // 全局来源浏览计数（用于流量来源报表）
  if (source) {
    setDoc(
      doc(db, 'cheers_traffic_stats', 'source_visits'),
      { [source]: increment(1) },
      { merge: true }
    ).catch(() => {})
  }

  // GA4 事件
  if (analytics) {
    try {
      logEvent(analytics, 'view_item', {
        currency: 'MYR',
        value: Number(product.price) || 0,
        items: [{
          item_id: product.id,
          item_name: productNameStr(product.name),
          price: Number(product.price) || 0,
        }],
      })
    } catch {}
  }
}

// 加购：按数量累加 addsToCart + 来源追踪
export function trackAddToCart(product, quantity = 1, price) {
  if (!product?.id) return
  const qty = Number(quantity) || 1
  const itemPrice = Number(price ?? product.price) || 0

  const src = getStoredTrafficSource()
  const source = src?.source || null

  setDoc(
    doc(db, 'cheers_product_stats', product.id),
    {
      addsToCart: increment(qty),
      ...(source ? { [`sa_${source}`]: increment(qty) } : {}),
      lastAddedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {})

  if (analytics) {
    try {
      logEvent(analytics, 'add_to_cart', {
        currency: 'MYR',
        value: itemPrice * qty,
        items: [{
          item_id: product.id,
          item_name: productNameStr(product.name),
          price: itemPrice,
          quantity: qty,
        }],
      })
    } catch {}
  }
}

// 商品列表浏览（首页/分类页） — 仅 GA4，无 Firestore counter
export function trackViewItemList(products, listName = 'product_list') {
  if (!analytics || !Array.isArray(products) || products.length === 0) return
  try {
    logEvent(analytics, 'view_item_list', {
      item_list_id: listName,
      item_list_name: listName,
      items: products.slice(0, 20).map(p => ({  // GA4 限制每事件最多 ~200 items，截断 20 已足够
        item_id: p.id,
        item_name: productNameStr(p.name),
        price: Number(p.price) || 0,
      })),
    })
  } catch {}
}

// 购物车页浏览
export function trackViewCart(items, subtotal) {
  if (!analytics) return
  try {
    logEvent(analytics, 'view_cart', {
      currency: 'MYR',
      value: Number(subtotal) || 0,
      items: (items || []).map(it => ({
        item_id: it.productId || it.id,
        item_name: productNameStr(it.name),
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
      })),
    })
  } catch {}
}

// 开始结账
export function trackBeginCheckout(items, total) {
  if (!analytics) return
  try {
    logEvent(analytics, 'begin_checkout', {
      currency: 'MYR',
      value: Number(total) || 0,
      items: (items || []).map(it => ({
        item_id: it.productId || it.id,
        item_name: productNameStr(it.name),
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
      })),
    })
  } catch {}
}

// 搜索：写日志到 Firestore（admin 查热门搜索）+ 发 GA4 search 事件
// 调用前应自行防抖，避免每个字母都触发
export function trackSearch(rawQuery, resultsCount, lang) {
  const query = String(rawQuery || '').trim().toLowerCase()
  if (query.length < 2 || query.length > 80) return  // 过滤噪音 + 过长

  // Firestore log
  addDoc(collection(db, 'cheers_search_logs'), {
    query,
    resultsCount: Number(resultsCount) || 0,
    lang: lang || '',
    createdAt: serverTimestamp(),
  }).catch(() => {})

  // GA4
  if (analytics) {
    try {
      logEvent(analytics, 'search', { search_term: query })
    } catch {}
  }
}

// 下单：每个商品按数量累加 purchases；GA4 发一次 purchase 事件含所有项
export function trackPurchase(items, total, orderId) {
  if (!Array.isArray(items) || items.length === 0) return

  // Firestore：按每个 productId 累加
  items.forEach(it => {
    const id = it.productId || it.id
    if (!id) return
    const qty = Number(it.quantity) || 1
    setDoc(
      doc(db, 'cheers_product_stats', id),
      { purchases: increment(qty), lastPurchasedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {})
  })

  if (analytics) {
    try {
      logEvent(analytics, 'purchase', {
        transaction_id: orderId,
        currency: 'MYR',
        value: Number(total) || 0,
        items: items.map(it => ({
          item_id: it.productId || it.id,
          item_name: productNameStr(it.name),
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
        })),
      })
    } catch {}
  }
}
