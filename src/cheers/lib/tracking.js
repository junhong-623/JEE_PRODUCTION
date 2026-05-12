// 顾客行为追踪工具
// - 写 Firestore counter（admin 自己看）
// - 同时发 GA4 事件（cheers 专属，独立于其他子应用）
//
// 设计原则：所有调用都是 fire-and-forget，失败不影响主流程。

import { initializeApp } from 'firebase/app'
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore'
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

// 商品浏览：同 session 去重 + 区分登录态
export function trackProductView(product, user) {
  if (!product?.id) return
  if (alreadyViewedThisSession(product.id)) return

  // Firestore counter（fire-and-forget）
  setDoc(
    doc(db, 'cheers_product_stats', product.id),
    {
      views: increment(1),
      ...(user ? { loggedInViews: increment(1) } : {}),
      lastViewedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {})

  // GA4 事件
  if (analytics) {
    try {
      logEvent(analytics, 'view_item', {
        currency: 'MYR',
        value: Number(product.price) || 0,
        items: [{
          item_id: product.id,
          item_name: product.name?.zh || product.name?.en || product.name || '',
          price: Number(product.price) || 0,
        }],
      })
    } catch {}
  }
}
