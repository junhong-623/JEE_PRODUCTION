import { openDB } from 'idb'

const DB_NAME = 'jsave-db'
const DB_VERSION = 1

let _db = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('accounts')) {
        db.createObjectStore('accounts', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const s = db.createObjectStore('transactions', { keyPath: 'id' })
        s.createIndex('by-date', 'date')
        s.createIndex('by-account', 'accountId')
      }
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'qid', autoIncrement: true })
      }
    },
  })
  return _db
}

export async function dbGetAll(store) {
  return (await getDB()).getAll(store)
}

export async function dbGet(store, id) {
  return (await getDB()).get(store, id)
}

export async function dbPut(store, item) {
  return (await getDB()).put(store, item)
}

export async function dbDelete(store, id) {
  return (await getDB()).delete(store, id)
}

export async function dbClear(store) {
  return (await getDB()).clear(store)
}

export async function enqueueSync(entry) {
  const db = await getDB()
  return db.put('syncQueue', entry)
}

export async function getSyncQueue() {
  return (await getDB()).getAll('syncQueue')
}

export async function dequeueSync(qid) {
  return (await getDB()).delete('syncQueue', qid)
}
