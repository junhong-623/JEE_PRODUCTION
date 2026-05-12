// 顾客行为追踪工具
// - 写 Firestore counter（admin 自己看）
// - 同时发 GA4 事件（可选，用于 Google Analytics 报告）
//
// 设计原则：所有调用都是 fire-and-forget，失败不影响主流程。

import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db, analytics } from '../../lib/firebase'
import { logEvent } from 'firebase/analytics'

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
