import { db } from '../../lib/firebase'
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, orderBy,
} from 'firebase/firestore'

const col = (uid, name) => collection(db, 'users', uid, name)
const ref = (uid, name, id) => doc(db, 'users', uid, name, id)

export function subscribeAccounts(uid, cb) {
  return onSnapshot(col(uid, 'jsave_accounts'), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function subscribeTransactions(uid, cb) {
  const q = query(col(uid, 'jsave_transactions'), orderBy('date', 'desc'))
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.deleted))
  )
}

export function subscribeItems(uid, cb) {
  return onSnapshot(col(uid, 'jsave_items'), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function subscribeSettings(uid, cb) {
  return onSnapshot(ref(uid, 'jsave_settings', 'config'), snap => {
    if (snap.exists()) cb({ id: 'config', ...snap.data() })
  })
}

export const fsWriteAccount    = (uid, d) => setDoc(ref(uid, 'jsave_accounts', d.id), d, { merge: true })
export const fsWriteTransaction = (uid, d) => setDoc(ref(uid, 'jsave_transactions', d.id), d, { merge: true })
export const fsWriteItem       = (uid, d) => setDoc(ref(uid, 'jsave_items', d.id), d, { merge: true })
export const fsWriteSettings   = (uid, d) => setDoc(ref(uid, 'jsave_settings', 'config'), d, { merge: true })
export const fsDeleteAccount    = (uid, id) => deleteDoc(ref(uid, 'jsave_accounts', id))
export const fsDeleteTransaction = (uid, id) => deleteDoc(ref(uid, 'jsave_transactions', id))
export const fsDeleteItem       = (uid, id) => deleteDoc(ref(uid, 'jsave_items', id))
