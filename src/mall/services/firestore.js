import { db, storage } from '../../lib/firebase'
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  setDoc, query, orderBy, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

// ── Config ───────────────────────────────────────────────────────────────────
export async function getMallConfig() {
  const snap = await getDoc(doc(db, 'mall_config', 'main'))
  return snap.exists()
    ? snap.data()
    : { whatsapp: '', email: '', storeName: 'JeeProd Mall', tagline: 'jeeprod.com' }
}
export async function saveMallConfig(data) {
  await setDoc(doc(db, 'mall_config', 'main'), data, { merge: true })
}

// ── Categories ────────────────────────────────────────────────────────────────
export function onCategories(cb) {
  return onSnapshot(
    query(collection(db, 'mall_categories'), orderBy('order')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}
export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'mall_categories'), orderBy('order')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function addCategory(data) {
  return addDoc(collection(db, 'mall_categories'), { ...data, createdAt: serverTimestamp() })
}
export async function updateCategory(id, data) {
  await updateDoc(doc(db, 'mall_categories', id), data)
}
export async function deleteCategory(id) {
  await deleteDoc(doc(db, 'mall_categories', id))
}

// ── Products ─────────────────────────────────────────────────────────────────
export function onProducts(cb) {
  return onSnapshot(
    query(collection(db, 'mall_products'), orderBy('order')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}
export async function getProducts() {
  const snap = await getDocs(query(collection(db, 'mall_products'), orderBy('order')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'mall_products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
export async function addProduct(data) {
  return addDoc(collection(db, 'mall_products'), { ...data, createdAt: serverTimestamp() })
}
export async function updateProduct(id, data) {
  await updateDoc(doc(db, 'mall_products', id), data)
}
export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'mall_products', id))
}

// ── Transactions ──────────────────────────────────────────────────────────────
export function onTransactions(cb) {
  return onSnapshot(
    query(collection(db, 'mall_transactions'), orderBy('createdAt', 'desc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}
export async function addTransaction(data) {
  return addDoc(collection(db, 'mall_transactions'), { ...data, createdAt: serverTimestamp() })
}
export async function updateTransaction(id, data) {
  await updateDoc(doc(db, 'mall_transactions', id), data)
}
export function onUserTransactions(userId, cb) {
  return onSnapshot(
    query(
      collection(db, 'mall_transactions'),
      where('userId', '==', userId)
    ),
    snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0
        const tb = b.createdAt?.toMillis?.() ?? 0
        return tb - ta
      })
      cb(docs)
    }
  )
}

// ── Image upload ──────────────────────────────────────────────────────────────
export async function uploadMallImage(file, folder = 'mall') {
  const ext = file.name.split('.').pop()
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const r = storageRef(storage, name)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function generateTxnId() {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const rand = Math.random().toString(36).slice(2,6).toUpperCase()
  return `MALL-${date}-${rand}`
}
