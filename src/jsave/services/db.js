import { openDB } from 'idb'

const LEGACY_DB_NAME = 'jsave-db'
const USER_DB_PREFIX = 'jsave-db-user-'
const DB_VERSION = 1
const DATA_STORES = ['accounts', 'transactions', 'items', 'settings', 'goals']

const databases = new Map()

function assertUid(uid) {
  if (!uid || typeof uid !== 'string') throw new Error('A valid JSave user id is required')
}

function userDbName(uid) {
  return `${USER_DB_PREFIX}${uid}`
}

async function getDB(uid) {
  assertUid(uid)
  if (databases.has(uid)) return databases.get(uid)

  const promise = openDB(userDbName(uid), DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('accounts')) {
        db.createObjectStore('accounts', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' })
        store.createIndex('by-date', 'date')
        store.createIndex('by-account', 'accountId')
      }
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'qid', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'id' })
      }
    },
  })

  databases.set(uid, promise)
  return promise
}

async function legacyDatabaseExists() {
  if (typeof indexedDB.databases !== 'function') return true
  const list = await indexedDB.databases()
  return list.some(db => db.name === LEGACY_DB_NAME)
}

// One-time, ownership-safe migration from the original shared database.
export async function migrateLegacyData(uid) {
  const target = await getDB(uid)
  if (await target.get('meta', 'legacy-migrated')) return

  if (await legacyDatabaseExists()) {
    const legacy = await openDB(LEGACY_DB_NAME)
    for (const store of DATA_STORES) {
      if (!legacy.objectStoreNames.contains(store)) continue
      const records = await legacy.getAll(store)
      const owned = records.filter(record => record?.userId === uid)
      if (owned.length) {
        const tx = target.transaction(store, 'readwrite')
        await Promise.all([...owned.map(record => tx.store.put(record)), tx.done])
      }
    }

    if (legacy.objectStoreNames.contains('syncQueue')) {
      const entries = (await legacy.getAll('syncQueue')).filter(entry => entry?.uid === uid)
      if (entries.length) {
        const tx = target.transaction('syncQueue', 'readwrite')
        await Promise.all([
          ...entries.map(({ qid: _legacyId, ...entry }) => tx.store.add(entry)),
          tx.done,
        ])
      }
    }
    legacy.close()
  }

  await target.put('meta', { id: 'legacy-migrated', completedAt: Date.now() })
}

export async function dbGetAll(uid, store) {
  return (await getDB(uid)).getAll(store)
}

export async function dbGet(uid, store, id) {
  return (await getDB(uid)).get(store, id)
}

export async function dbPut(uid, store, item) {
  return (await getDB(uid)).put(store, item)
}

export async function dbDelete(uid, store, id) {
  return (await getDB(uid)).delete(store, id)
}

export async function dbClear(uid, store) {
  return (await getDB(uid)).clear(store)
}

export async function dbReplaceAll(uid, store, items) {
  const db = await getDB(uid)
  const tx = db.transaction(store, 'readwrite')
  await tx.store.clear()
  await Promise.all([...items.map(item => tx.store.put(item)), tx.done])
}

export async function enqueueSync(uid, entry) {
  return (await getDB(uid)).add('syncQueue', { ...entry, uid })
}

export async function getSyncQueue(uid) {
  return (await getDB(uid)).getAll('syncQueue')
}

export async function dequeueSync(uid, qid) {
  return (await getDB(uid)).delete('syncQueue', qid)
}
