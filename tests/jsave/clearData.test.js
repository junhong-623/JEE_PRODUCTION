import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const { clearJSaveData, validateSelection } = require('../../functions/jsaveClearData.js')

function fakeFirestore(seed) {
  const rows = new Map(Object.entries(seed))
  const ref = path => ({
    path,
    collection: name => collection(`${path}/${name}`),
    get: async () => snapshot(path),
    update: async patch => rows.set(path, { ...rows.get(path), ...patch }),
  })
  const snapshot = path => ({ exists: rows.has(path), ref: ref(path), data: () => rows.get(path) })
  const collection = path => ({
    doc: id => ref(`${path}/${id}`),
    get: async () => {
      const docs = [...rows.keys()].filter(key => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1).map(snapshot)
      return { docs, size: docs.length }
    },
  })
  const db = {
    collection,
    runTransaction: async callback => callback({
      get: target => target.get(),
      set: (target, data) => rows.set(target.path, data),
    }),
    bulkWriter: () => ({
      delete: target => Promise.resolve(rows.delete(target.path)),
      update: (target, patch) => Promise.resolve(rows.set(target.path, { ...rows.get(target.path), ...patch })),
      close: async () => {},
    }),
  }
  return { db, rows }
}

describe('JSave selected data clearing', () => {
  it('requires transactions when accounts are selected', () => {
    expect(() => validateSelection(['accounts'])).toThrow('transactions-required')
  })

  it('deletes selected items, preserves actual expenses, and removes their installment links', async () => {
    const { db, rows } = fakeFirestore({
      'users/alice/jsave_items/item-1': { id: 'item-1', coverPath: 'jsave/alice/items/item-1/cover' },
      'users/alice/jsave_transactions/tx-1': { id: 'tx-1', amount: 50, installmentItemId: 'item-1', installmentNumber: 2 },
      'users/alice/jsave_settings/config': { id: 'config', homeItemId: 'item-1', onboardingCompleted: true },
    })
    const destroyCover = vi.fn(async () => {})
    const result = await clearJSaveData({ db, uid: 'alice', selected: ['items'], destroyCover })

    expect(rows.has('users/alice/jsave_items/item-1')).toBe(false)
    expect(rows.get('users/alice/jsave_transactions/tx-1')).toMatchObject({
      amount: 50, installmentItemId: null, installmentNumber: null, syncEpoch: result.epochs.transactions,
    })
    expect(rows.get('users/alice/jsave_settings/config')).toMatchObject({
      homeItemId: null, onboardingCompleted: true, syncEpoch: result.epochs.settings,
    })
    expect(destroyCover).toHaveBeenCalledWith('jsave/alice/items/item-1/cover')
    expect(rows.get('jsave_clear_state/alice').clearingStores).toEqual([])
  })

  it('removes all five selected categories while leaving other user records alone', async () => {
    const seed = {
      'users/alice/jsave_transactions/tx': { id: 'tx' },
      'users/alice/jsave_accounts/account': { id: 'account' },
      'users/alice/jsave_items/item': { id: 'item' },
      'users/alice/jsave_goals/goal': { id: 'goal' },
      'users/alice/jsave_settings/config': { id: 'config' },
      'users/alice/jsave_donations/donation': { amount: 10 },
      'users/bob/jsave_transactions/tx': { id: 'tx' },
    }
    const { db, rows } = fakeFirestore(seed)
    const selected = ['transactions', 'accounts', 'items', 'goals', 'settings']
    const result = await clearJSaveData({ db, uid: 'alice', selected, destroyCover: async () => {} })

    for (const store of selected) expect(result.counts[store]).toBe(1)
    expect(rows.has('users/alice/jsave_transactions/tx')).toBe(false)
    expect(rows.has('users/alice/jsave_accounts/account')).toBe(false)
    expect(rows.has('users/alice/jsave_items/item')).toBe(false)
    expect(rows.has('users/alice/jsave_goals/goal')).toBe(false)
    expect(rows.has('users/alice/jsave_settings/config')).toBe(false)
    expect(rows.has('users/alice/jsave_donations/donation')).toBe(true)
    expect(rows.has('users/bob/jsave_transactions/tx')).toBe(true)
  })
})
