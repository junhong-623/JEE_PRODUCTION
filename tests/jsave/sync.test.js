import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestoreMocks = vi.hoisted(() => ({
  writeTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}))

vi.mock('../../src/jsave/services/firestore', () => ({
  fsWriteAccount: vi.fn(),
  fsWriteTransaction: firestoreMocks.writeTransaction,
  fsWriteItem: vi.fn(),
  fsWriteSettings: vi.fn(),
  fsWriteGoal: vi.fn(),
  fsDeleteAccount: vi.fn(),
  fsDeleteTransaction: firestoreMocks.deleteTransaction,
  fsDeleteItem: vi.fn(),
  fsDeleteGoal: vi.fn(),
}))

import { dbGetAll, getSyncQueue } from '../../src/jsave/services/db'
import { flushQueue, reconcileRemote, syncDelete, syncWrite } from '../../src/jsave/services/sync'

describe('JSave offline sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('replays a queue entry only to its original UID', async () => {
    const uid = `sync-user-${crypto.randomUUID()}`
    const transaction = { id: 'tx-1', userId: uid, amount: 25 }
    await syncWrite(uid, 'transactions', transaction, false)
    await flushQueue(uid)

    expect(firestoreMocks.writeTransaction).toHaveBeenCalledWith(uid, transaction)
    expect(await getSyncQueue(uid)).toEqual([])
  })

  it('keeps pending writes and deletes while reconciling a remote snapshot', async () => {
    const uid = `merge-user-${crypto.randomUUID()}`
    const pending = { id: 'local', userId: uid, amount: 30 }
    await syncWrite(uid, 'transactions', pending, false)
    await syncDelete(uid, 'transactions', 'remote-deleted', false)

    const merged = await reconcileRemote(uid, 'transactions', [
      { id: 'remote', userId: uid, amount: 10 },
      { id: 'remote-deleted', userId: uid, amount: 20 },
    ])

    expect(merged.map(value => value.id).sort()).toEqual(['local', 'remote'])
    expect((await dbGetAll(uid, 'transactions')).map(value => value.id).sort()).toEqual(['local', 'remote'])
  })
})
