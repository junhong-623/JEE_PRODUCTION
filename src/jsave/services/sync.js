import { dbPut, dbDelete, enqueueSync, getSyncQueue, dequeueSync } from './db'
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

export async function syncWrite(uid, store, data, online) {
  await dbPut(store, data)
  if (online) {
    try {
      await WRITERS[store](uid, data)
    } catch {
      await enqueueSync({ store, op: 'write', data, uid, ts: Date.now() })
    }
  } else {
    await enqueueSync({ store, op: 'write', data, uid, ts: Date.now() })
  }
}

export async function syncDelete(uid, store, id, online) {
  await dbDelete(store, id)
  if (online) {
    try {
      await DELETERS[store]?.(uid, id)
    } catch {
      await enqueueSync({ store, op: 'delete', id, uid, ts: Date.now() })
    }
  } else {
    await enqueueSync({ store, op: 'delete', id, uid, ts: Date.now() })
  }
}

export async function flushQueue(uid) {
  const queue = await getSyncQueue()
  for (const entry of queue) {
    try {
      if (entry.op === 'write') await WRITERS[entry.store](uid, entry.data)
      if (entry.op === 'delete') await DELETERS[entry.store]?.(uid, entry.id)
      await dequeueSync(entry.qid)
    } catch (e) {
      console.warn('[JSave sync] failed:', entry, e)
    }
  }
}
