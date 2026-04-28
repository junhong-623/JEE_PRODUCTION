import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, setDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

// ── Flowcharts ──────────────────────────────────────────────────────────────

export async function getMyFlowcharts(uid) {
  const q = query(collection(db, 'flowcharts'), where('ownerId', '==', uid))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
}

export async function getFlowchart(id) {
  const snap = await getDoc(doc(db, 'flowcharts', id))
  if (!snap.exists()) throw new Error('Flowchart not found')
  return { id: snap.id, ...snap.data() }
}

export async function createFlowchart(uid, title, groupId = null) {
  const ref = await addDoc(collection(db, 'flowcharts'), {
    title, ownerId: uid, groupId,
    nodes: [], edges: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateFlowchart(id, data) {
  await updateDoc(doc(db, 'flowcharts', id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteFlowchart(id) {
  await deleteDoc(doc(db, 'flowcharts', id))
}

// ── Groups ──────────────────────────────────────────────────────────────────

export async function getMyGroups(uid) {
  const q = query(collection(db, 'flowchartGroups'), where('ownerId', '==', uid))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
}

export async function createGroup(uid, name) {
  const ref = await addDoc(collection(db, 'flowchartGroups'), {
    name, ownerId: uid, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function renameGroup(id, name) {
  await updateDoc(doc(db, 'flowchartGroups', id), { name })
}

export async function deleteGroup(id) {
  await deleteDoc(doc(db, 'flowchartGroups', id))
}

// ── Sharing ─────────────────────────────────────────────────────────────────

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function createShareCode(flowchartId, permission, createdBy, flowchartTitle) {
  let code, tries = 0
  do {
    code = genCode()
    const existing = await getDoc(doc(db, 'flowchartShares', code))
    if (!existing.exists()) break
    tries++
  } while (tries < 10)

  await setDoc(doc(db, 'flowchartShares', code), {
    flowchartId, permission, createdBy, flowchartTitle,
    createdAt: serverTimestamp(),
  })
  return code
}

export async function getSharesForFlowchart(flowchartId) {
  const q = query(collection(db, 'flowchartShares'), where('flowchartId', '==', flowchartId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ code: d.id, ...d.data() }))
}

export async function deleteShareCode(code) {
  await deleteDoc(doc(db, 'flowchartShares', code))
}

export async function joinByCode(code, uid) {
  const snap = await getDoc(doc(db, 'flowchartShares', code.toUpperCase()))
  if (!snap.exists()) throw new Error('Invalid invite code. Please check and try again.')
  const share = { code: snap.id, ...snap.data() }

  // Block owner from joining their own flowchart
  const fcSnap = await getDoc(doc(db, 'flowcharts', share.flowchartId))
  if (fcSnap.exists() && fcSnap.data().ownerId === uid) {
    throw new Error('This is your own flowchart — no need to join.')
  }

  // Block duplicate join
  const existing = await getDoc(doc(db, 'flowchartAccess', `${share.flowchartId}_${uid}`))
  if (existing.exists()) {
    throw new Error('You have already joined this flowchart.')
  }

  await setDoc(doc(db, 'flowchartAccess', `${share.flowchartId}_${uid}`), {
    flowchartId: share.flowchartId,
    userId: uid,
    permission: share.permission,
    flowchartTitle: share.flowchartTitle,
    inviteCode: share.code,
    joinedAt: serverTimestamp(),
  })
  return share
}

export async function getSharedFlowcharts(uid) {
  const q = query(collection(db, 'flowchartAccess'), where('userId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

export async function getAccessForFlowchart(flowchartId, uid) {
  const snap = await getDoc(doc(db, 'flowchartAccess', `${flowchartId}_${uid}`))
  return snap.exists() ? snap.data() : null
}

export async function leaveSharedFlowchart(flowchartId, uid) {
  await deleteDoc(doc(db, 'flowchartAccess', `${flowchartId}_${uid}`))
}
