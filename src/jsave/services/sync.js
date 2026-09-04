import {
  dbPut, dbDelete, dbReplaceAll, enqueueSync, getSyncQueue, dequeueSync,
} from './db'
import {
  fsWriteAccount, fsWriteTransaction, fsWriteItem, fsWriteSettings, fsWriteGoal,
  fsDeleteAccount, fsDeleteTransaction, fsDeleteItem, fsDeleteGoal,
} from './firestore'

const WRITERS = {
  accounts: fsWriteAccount,
  transactions: fsWriteTransaction,
  items: fsWriteItem,
  settings: fsWriteSettings,
  goals: fsWriteGoal,
}

const DELETERS = {
  accounts: fsDeleteAccount,
  transactions: fsDeleteTransaction,
  items: fsDeleteItem,
  goals: fsDeleteGoal,
}

const activeFlushes = new Map()

function writerFor(store) {
  const writer = WRITERS[store]
  if (!writer) throw new Error(`Unsupported JSave store: ${store}`)
  return writer
}

export async function syncWrite(uid, store, data, online) {
  await dbPut(uid, store, data)
  if (online) {
    try {
      await writerFor(store)(uid, data)
      return
    } catch {
      // Persist below and retry on the next reconnect.
    }
  }
  await enqueueSync(uid, { store, op: 'write', data, ts: Date.now() })
}

export async function syncDelete(uid, store, id, online) {
  await dbDelete(uid, store, id)
  if (online) {
    try {
      const deleter = DELETERS[store]
      if (!deleter) throw new Error(`Unsupported delete store: ${store}`)
      await deleter(uid, id)
      return
    } catch {
      // Persist below and retry on the next reconnect.
    }
  }
  await enqueueSync(uid, { store, op: 'delete', id, ts: Date.now() })
}

// Merge remote snapshots with pending local operations so a snapshot cannot
// temporarily hide an offline write or resurrect a locally deleted record.
export async function reconcileRemote(uid, store, remoteItems) {
  const byId = new Map(remoteItems.map(item => [item.id, item]))
  const queue = await getSyncQueue(uid)

  for (const entry of queue) {
    if (entry.uid !== uid || entry.store !== store) continue
    if (entry.op === 'write') byId.set(entry.data.id, entry.data)
    if (entry.op === 'delete') byId.delete(entry.id)
  }

  const merged = [...byId.values()]
  await dbReplaceAll(uid, store, merged)
  return merged
}

async function runFlush(uid) {
  const queue = await getSyncQueue(uid)
  for (const entry of queue) {
    // Never redirect another account's legacy queue entry into this account.
    if (entry.uid !== uid) continue
    try {
      if (entry.op === 'write') await writerFor(entry.store)(entry.uid, entry.data)
      if (entry.op === 'delete') {
        const deleter = DELETERS[entry.store]
        if (!deleter) throw new Error(`Unsupported delete store: ${entry.store}`)
        await deleter(entry.uid, entry.id)
      }
      await dequeueSync(uid, entry.qid)
    } catch (error) {
      console.warn('[JSave sync] retry failed:', { store: entry.store, op: entry.op }, error)
    }
  }
}

export function flushQueue(uid) {
  if (!uid) return Promise.resolve()
  if (activeFlushes.has(uid)) return activeFlushes.get(uid)
  const promise = runFlush(uid).finally(() => activeFlushes.delete(uid))
  activeFlushes.set(uid, promise)
  return promise
}
