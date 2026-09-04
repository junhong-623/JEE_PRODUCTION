import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { openDB } from 'idb'
import { dbGetAll, dbPut, enqueueSync, getSyncQueue, migrateLegacyData } from '../../src/jsave/services/db'

describe('JSave IndexedDB user isolation', () => {
  it('keeps records from different UIDs in separate databases', async () => {
    const uidA = `user-a-${crypto.randomUUID()}`
    const uidB = `user-b-${crypto.randomUUID()}`
    await dbPut(uidA, 'transactions', { id: 'same-id', userId: uidA, amount: 10 })
    await dbPut(uidB, 'transactions', { id: 'same-id', userId: uidB, amount: 20 })

    expect(await dbGetAll(uidA, 'transactions')).toEqual([
      { id: 'same-id', userId: uidA, amount: 10 },
    ])
    expect(await dbGetAll(uidB, 'transactions')).toEqual([
      { id: 'same-id', userId: uidB, amount: 20 },
    ])
  })

  it('stamps queue entries with the database owner', async () => {
    const uid = `queue-user-${crypto.randomUUID()}`
    await enqueueSync(uid, { store: 'transactions', op: 'delete', id: 'tx-1' })
    expect(await getSyncQueue(uid)).toMatchObject([
      { uid, store: 'transactions', op: 'delete', id: 'tx-1' },
    ])
  })

  it('migrates only legacy records whose ownership can be verified', async () => {
    const uid = `legacy-user-${crypto.randomUUID()}`
    const legacy = await openDB('jsave-db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' })
        }
      },
    })
    await legacy.put('transactions', { id: `owned-${uid}`, userId: uid, amount: 10 })
    await legacy.put('transactions', { id: `other-${uid}`, userId: 'someone-else', amount: 20 })
    legacy.close()

    await migrateLegacyData(uid)
    expect(await dbGetAll(uid, 'transactions')).toEqual([
      { id: `owned-${uid}`, userId: uid, amount: 10 },
    ])
  })
})
