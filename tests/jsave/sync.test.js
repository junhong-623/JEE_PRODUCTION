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

import { applyClearEpochs, dbGet, dbGetAll, getSyncQueue } from '../../src/jsave/services/db'
import { flushQueue, reconcileRemote, setClearEpochs, syncDelete, syncWrite } from '../../src/jsave/services/sync'

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

  it('drops queued offline writes and local records when their store is cleared elsewhere', async () => {
    const uid = `cleared-user-${crypto.randomUUID()}`
    await syncWrite(uid, 'transactions', { id: 'old', userId: uid, amount: 20 }, false)
    await syncWrite(uid, 'accounts', { id: 'keep', userId: uid }, false)

    const changed = await applyClearEpochs(uid, { transactions: 'new-epoch' })
    setClearEpochs(uid, { transactions: 'new-epoch' })
    await flushQueue(uid)

    expect(changed).toEqual(['transactions'])
    expect(await dbGetAll(uid, 'transactions')).toEqual([])
    expect((await dbGetAll(uid, 'accounts')).map(account => account.id)).toEqual(['keep'])
    expect(firestoreMocks.writeTransaction).not.toHaveBeenCalled()
    expect(await getSyncQueue(uid)).toEqual([])
  })

  it('keeps the newer clear state when an older cached snapshot arrives later', async () => {
    const uid = `revision-user-${crypto.randomUUID()}`
    await applyClearEpochs(uid, { transactions: 'latest' }, 2)
    expect(await applyClearEpochs(uid, { transactions: 'old' }, 1)).toEqual([])
    expect((await dbGet(uid, 'meta', 'clear-epochs')).epochs.transactions).toBe('latest')
  })
})
