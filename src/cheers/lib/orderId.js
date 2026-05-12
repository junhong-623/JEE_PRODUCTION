import { getDocs, query, collection, where, limit } from 'firebase/firestore'

function randomSixDigit() {
  // 100000 ~ 999999（避免前导 0，所有号码长度一致）
  return Math.floor(Math.random() * 900000) + 100000
}

// 带重复检查的生成器：查 Firestore，撞了就再生成，最多重试 5 次
export async function generateUniqueOrderId(db) {
  for (let i = 0; i < 5; i++) {
    const id = `CHEERS-${randomSixDigit()}`
    const snap = await getDocs(query(
      collection(db, 'cheers_orders'),
      where('orderId', '==', id),
      limit(1)
    ))
    if (snap.empty) return id
  }
  // 极端情况：5 次都撞 → 退而用时间戳后缀避免阻塞下单
  return `CHEERS-${randomSixDigit()}-${Date.now().toString().slice(-3)}`
}
