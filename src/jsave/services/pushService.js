import { db } from '../../lib/firebase'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

const VAPID_KEY = import.meta.env.VITE_MATETRIP_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function subscribePush(uid, language) {
  if (!VAPID_KEY || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      })
    }
    await setDoc(doc(db, 'jsavePushSubs', uid), {
      subscription: JSON.parse(JSON.stringify(sub)),
      dailyReminder: true,
      language: language || 'en',
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (e) {
    console.warn('JSave push subscribe failed:', e.name, e.message, e)
    return false
  }
}

export async function unsubscribePush(uid) {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
  } catch {}
  try {
    await deleteDoc(doc(db, 'jsavePushSubs', uid))
  } catch {}
}

export async function updatePushLanguage(uid, language) {
  try {
    await setDoc(doc(db, 'jsavePushSubs', uid), { language, updatedAt: serverTimestamp() }, { merge: true })
  } catch {}
}
