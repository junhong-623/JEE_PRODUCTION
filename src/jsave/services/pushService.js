import { db } from '../../lib/firebase'
import { doc, collection, query, where, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { JSAVE_BASE } from '../utils/basePath'

const VAPID_KEY = import.meta.env.VITE_MATETRIP_VAPID_PUBLIC_KEY || ''
const SW_SCOPE  = JSAVE_BASE ? `${JSAVE_BASE}/` : '/'

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// Stable 12-char device ID derived from the subscription endpoint
function deviceId(endpoint) {
  return endpoint.split('/').pop().slice(0, 12)
}

export const isPushSupported = !!(VAPID_KEY && 'PushManager' in window && 'serviceWorker' in navigator)

export async function subscribePush(uid, language) {
  if (!isPushSupported) return null
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE)
    if (!reg) throw new Error('SW not registered')
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      })
    }
    const did = deviceId(sub.endpoint)
    await setDoc(doc(db, 'jsavePushSubs', `${uid}_${did}`), {
      uid,
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
    const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE)
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const did = deviceId(sub.endpoint)
      try { await deleteDoc(doc(db, 'jsavePushSubs', `${uid}_${did}`)) } catch {}
      await sub.unsubscribe()
    }
  } catch {}
}

export async function updatePushLanguage(uid, language) {
  try {
    const snap = await getDocs(query(collection(db, 'jsavePushSubs'), where('uid', '==', uid)))
    await Promise.all(snap.docs.map(d =>
      setDoc(d.ref, { language, updatedAt: serverTimestamp() }, { merge: true })
    ))
  } catch {}
}
