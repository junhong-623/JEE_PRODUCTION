import { db } from '../../lib/firebase'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

const VAPID_KEY = import.meta.env.VITE_MATETRIP_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export const isPushSupported = !!(VAPID_KEY && 'PushManager' in window && 'serviceWorker' in navigator)

export async function subscribePush(uid, language) {
  if (!isPushSupported) return false
  try {
    const reg = await navigator.serviceWorker.getRegistration('/jsave/')
    if (!reg) throw new Error('SW not registered')
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
    return sub.endpoint
  } catch (e) {
    console.warn('JSave push subscribe failed:', e.name, e.message, e)
    return null
  }
}

export async function unsubscribePush(uid) {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/jsave/')
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      // Only delete the Firestore doc if it stores THIS device's endpoint,
      // so another device's active subscription is not wiped.
      try {
        const stored = await getDoc(doc(db, 'jsavePushSubs', uid))
        if (stored.exists() && stored.data()?.subscription?.endpoint === sub.endpoint) {
          await deleteDoc(doc(db, 'jsavePushSubs', uid))
        }
      } catch {}
      await sub.unsubscribe()
    }
  } catch {}
}

export async function updatePushLanguage(uid, language) {
  try {
    await setDoc(doc(db, 'jsavePushSubs', uid), { language, updatedAt: serverTimestamp() }, { merge: true })
  } catch {}
}
