import { createRequire } from 'node:module'
import crypto from 'node:crypto'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const { normalizeReceiptAccounts, resolveReceiptAccounts } = require('../../functions/jsaveReceiptAccounts.js')
const { parseReceiptScreenshot, receiptTransactionDocumentId } = require('../../functions/jsaveReceiptShortcut.js')
const walletDraft = { provider: 'tng', accountKind: 'wallet', type: 'expense' }
const transferDraft = { provider: 'cimb', accountKind: 'bank', type: 'transfer', transferTarget: 'tng' }
const cardDraft = { ...transferDraft, transferTarget: 'uobCredit', note: 'UOB 0401' }
const account = (id, name, type = 'accEwallet') => ({ id, name, type })

describe('receipt account selection', () => {
  it('allows keys without links and rejects invalid or duplicate links', () => {
    expect(Object.values(normalizeReceiptAccounts())).toEqual(['', '', '', ''])
    expect(() => normalizeReceiptAccounts({ tngAccountId: 'a/b' })).toThrow()
    expect(() => normalizeReceiptAccounts({ tngAccountId: 'same', cimbBankAccountId: 'same' })).toThrow()
  })
  it('matches a unique provider name but asks for generic or ambiguous accounts', () => {
    expect(resolveReceiptAccounts(walletDraft, [account('w', 'TNG wallet')]).sourceAccountId).toBe('w')
    expect(resolveReceiptAccounts(walletDraft, [account('w', 'My wallet')]).pending.selectionRole).toBe('source')
    expect(resolveReceiptAccounts(walletDraft, [account('w', 'TNG one'), account('w2', 'TNG two')]).pending.accountLabels).toHaveLength(2)
  })
  it('preserves a saved valid choice and replaces a missing or wrong-type choice', () => {
    const accounts = [account('w', 'My wallet'), account('other', 'TNG')]
    expect(resolveReceiptAccounts(walletDraft, accounts, { tngAccountId: 'w' }).sourceAccountId).toBe('w')
    expect(resolveReceiptAccounts(walletDraft, accounts, { tngAccountId: 'gone' }).sourceAccountId).toBe('other')
    expect(resolveReceiptAccounts(walletDraft, [account('w', 'TNG', 'accBank')], { tngAccountId: 'w' }).pending.error).toBe('no-compatible-account')
  })
  it('selects source then destination for transfers and remembers both', () => {
    const accounts = [account('bank', 'Main bank', 'accBank'), account('wallet', 'Wallet')]
    expect(resolveReceiptAccounts(transferDraft, accounts).pending.selectionRole).toBe('source')
    expect(resolveReceiptAccounts(transferDraft, accounts, {}, { source: 'bank' }).pending.selectionRole).toBe('target')
    expect(resolveReceiptAccounts(transferDraft, accounts, {}, { source: 'bank', target: 'wallet' })).toMatchObject({
      sourceAccountId: 'bank', targetAccountId: 'wallet', rememberedIds: { cimbBankAccountId: 'bank', tngAccountId: 'wallet' },
    })
  })
  it('matches UOB card suffix and refuses another card or a forged account id', () => {
    const accounts = [account('b', 'CIMB', 'accBank'), account('c', 'UOB (0401)', 'accCredit'), account('x', 'UOB 1234', 'accCredit')]
    expect(resolveReceiptAccounts(cardDraft, accounts).targetAccountId).toBe('c')
    expect(() => resolveReceiptAccounts(cardDraft, accounts, {}, { target: 'x' })).toThrow('invalid-account-selection')
    expect(() => resolveReceiptAccounts(walletDraft, [], {}, { source: 'foreign' })).toThrow('invalid-account-selection')
  })
  it('uses unique labels safely even for special account names', () => {
    const result = resolveReceiptAccounts(walletDraft, [account('a', '__proto__'), account('b', '__proto__')]).pending
    expect(result.accountOptions.__proto__).toBe('a')
    expect(result.accountOptions['__proto__ (2)']).toBe('b')
    expect(Object.getPrototypeOf(result.accountOptions)).toBe(Object.prototype)
  })
})

const tng = `详情
-RM4.00
交易类型 支付
商家 SAMPLE MALL
日期/时间 22/09/2026 21:23:15
状态 成功
交易编号 TNGSAMPLE12345678`
const topup = `Transaction Details
Amount
- MYR 12.00
Date 16 Sep 2026
Details POS DEBIT 20260915TNG EWALLET TOPUPA2-EC KUALA L
Done`
const uid = 'receipt_test_user'
const key = `jsv1_${uid}_${'a'.repeat(64)}`
const keyHash = crypto.createHash('sha256').update(key).digest('hex')
const keyPath = `jsave_receipt_shortcut_tokens/${uid}`
let rows, api, mutateBeforeCommit

function ref(path) {
  return {
    path, id: path.split('/').at(-1),
    collection: name => collection(`${path}/${name}`),
    get: async () => snapshot(path),
    set: async data => rows.set(path, structuredClone(data)),
    update: async data => rows.set(path, { ...rows.get(path), ...structuredClone(data) }),
    delete: async () => rows.delete(path),
  }
}
function snapshot(path) { return { exists: rows.has(path), id: ref(path).id, ref: ref(path), data: () => structuredClone(rows.get(path)) } }
function collection(path) {
  return { doc: id => ref(`${path}/${id}`), get: async () => ({ docs: [...rows.keys()].filter(key => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1).map(snapshot) }) }
}
const db = {
  collection,
  runTransaction: async callback => {
    mutateBeforeCommit?.()
    const writes = []
    const transaction = {
      get: reference => reference.get(),
      create: (reference, data) => writes.push(() => rows.set(reference.path, structuredClone(data))),
      set: (reference, data, options) => writes.push(() => rows.set(reference.path, { ...(options?.merge ? rows.get(reference.path) : {}), ...structuredClone(data) })),
    }
    const result = await callback(transaction)
    writes.forEach(write => write())
    return result
  },
}
function addAccount(id, name, type) { rows.set(`users/${uid}/jsave_accounts/${id}`, { name, type }) }
async function request(body, auth = key) {
  let code = 200, value
  const res = { set: () => res, status: next => { code = next; return res }, json: data => { value = data; return res } }
  await api.jsaveReceiptShortcutImport({ method: 'POST', body, get: () => `Bearer ${auth}` }, res)
  return { code, ...value }
}
const preview = (more = {}) => request({ action: 'preview', protocolVersion: 2, text: tng, ...more })
async function commit(draft, more = {}) {
  return request({ action: 'commit', protocolVersion: 2, text: tng, category: 'catFood', routingToken: draft.routingToken,
    accountSelections: { source: draft.sourceAccountId, target: draft.targetAccountId }, ...more })
}
const ledgerRows = () => [...rows.keys()].filter(path => path.includes('/jsave_transactions/'))

beforeEach(() => {
  rows = new Map([[keyPath, { keyHash, accountIds: {} }]])
  mutateBeforeCommit = null
  const original = Module._load
  const index = require.resolve('../../functions/index.js')
  delete require.cache[index]
  Module._load = function (name, ...args) {
    if (name === 'firebase-functions/v2/https') return { onCall: (...args) => args.at(-1), onRequest: (...args) => args.at(-1), HttpsError: class extends Error {} }
    if (name === 'firebase-functions/v2/scheduler') return { onSchedule: (...args) => args.at(-1) }
    if (name === 'firebase-functions/params') return { defineSecret: () => ({ value: () => '' }) }
    if (name === 'firebase-admin/app') return { initializeApp() {} }
    if (name === 'firebase-admin/firestore') return { getFirestore: () => db, FieldValue: { serverTimestamp: () => 'timestamp' } }
    return original.call(this, name, ...args)
  }
  try { api = require(index) } finally { Module._load = original }
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('receipt import endpoint account protocol', () => {
  it('creates and clears links without creating or rotating a second key', async () => {
    const created = await api.jsaveCreateReceiptShortcutKey({ auth: { uid }, data: {} })
    expect(Object.values(created.accountIds)).toEqual(['', '', '', ''])
    const savedHash = rows.get(keyPath).keyHash
    await api.jsaveUpdateReceiptShortcutAccounts({ auth: { uid }, data: { accountIds: {} } })
    expect(rows.get(keyPath).keyHash).toBe(savedHash)
    expect(ledgerRows()).toHaveLength(0)
  })
  it('does not remember a preview; remembers only after a confirmed save and deduplicates', async () => {
    addAccount('w', 'TNG wallet', 'accEwallet')
    const first = await preview()
    expect(first.draft.accountName).toBe('TNG wallet')
    expect(rows.get(keyPath).accountIds).toEqual({})
    expect(ledgerRows()).toHaveLength(0)
    expect((await commit(first.draft)).status).toBe('created')
    expect(rows.get(keyPath).accountIds.tngAccountId).toBe('w')
    const second = await preview()
    expect((await commit(second.draft)).status).toBe('duplicate')
    expect(ledgerRows()).toHaveLength(1)
  })
  it('asks for an account and refuses foreign or incompatible ids', async () => {
    addAccount('w', 'Wallet', 'accEwallet')
    addAccount('b', 'Bank', 'accBank')
    rows.set('users/another_user/jsave_accounts/foreign', { type: 'accEwallet' })
    expect((await preview()).accountOptions).toEqual({ Wallet: 'w' })
    expect((await preview({ accountSelections: { source: 'foreign' } })).error).toBe('invalid-account-selection')
    expect((await preview({ accountSelections: { source: 'b' } })).error).toBe('invalid-account-selection')
    const selected = await preview({ accountSelections: { source: 'w' } })
    expect((await commit(selected.draft)).status).toBe('created')
  })
  it('supports transfer selections and saves a single transfer with both accounts', async () => {
    addAccount('b', 'Main bank', 'accBank')
    addAccount('w', 'Wallet', 'accEwallet')
    expect((await preview({ text: topup })).selectionRole).toBe('source')
    expect((await preview({ text: topup, accountSelections: { source: 'b' } })).selectionRole).toBe('target')
    const selected = await preview({ text: topup, accountSelections: { source: 'b', target: 'w' } })
    expect(selected.draft.accountName).toBe('Main bank → Wallet')
    expect((await commit(selected.draft, { text: topup, category: '' })).status).toBe('created')
    expect(rows.get(ledgerRows()[0])).toMatchObject({ type: 'transfer', fromAccountId: 'b', toAccountId: 'w', category: 'txTransfer' })
    expect(rows.get(keyPath).accountIds).toMatchObject({ cimbBankAccountId: 'b', tngAccountId: 'w' })
  })
  it('routes CIMB credit purchases and bank income to separate accounts', async () => {
    addAccount('bank', 'CIMB Bank', 'accBank')
    addAccount('card', 'CIMB Card', 'accCredit')
    const purchase = `Transaction Details\nAmount\n- MYR 43.60\nPosted Date 16 Sep 2026\nTransacted Date 14 Sep 2026\nTo RESTORAN SAMPLE IPOH MY\nFrom -\nTransfer Type Credit Card\nDone`
    const income = `Transaction Details\nAmount\nMYR 381.50\nDate 01 Sep 2026\nDetails AUTOPAY CR SAMPLE SOFTWARE INTERN\nDone`
    const card = await preview({ text: purchase })
    expect((await commit(card.draft, { text: purchase })).status).toBe('created')
    const bank = await preview({ text: income })
    expect((await commit(bank.draft, { text: income, category: 'catSalary' })).status).toBe('created')
    expect(rows.get(keyPath).accountIds).toMatchObject({ cimbBankAccountId: 'bank', cimbCreditAccountId: 'card' })
    const transactions = ledgerRows().map(path => rows.get(path))
    expect(transactions).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'income', accountId: 'bank' }), expect.objectContaining({ type: 'expense', accountId: 'card' })]))
  })
  it('routes UOB repayments to the matching card without creating an expense', async () => {
    addAccount('bank', 'CIMB Bank', 'accBank')
    addAccount('card', 'UOB (0401)', 'accCredit')
    addAccount('other', 'UOB (1234)', 'accCredit')
    const repayment = `Transaction Details\nAmount\n- MYR 1,690.00\n01 Sep 2026 9:14:44 AM\nReference No. 223991066\nTo SAMPLE PERSON United Overseas Bank Berhad 4599 1441 0504 0401\nFrom BASIC SA 7076892808\nWhen 01 Sep 2026\nTransfer Method DuitNow to Account\nPayment Type Credit Card\nDone`
    const { draft } = await preview({ text: repayment })
    expect(draft.targetAccountId).toBe('card')
    expect((await commit(draft, { text: repayment, category: '' })).status).toBe('created')
    expect(ledgerRows()).toHaveLength(1)
    expect(rows.get(ledgerRows()[0])).toMatchObject({ type: 'transfer', fromAccountId: 'bank', toAccountId: 'card' })
  })
  it('requires the exact preview receipt and account choices before saving', async () => {
    addAccount('w', 'TNG', 'accEwallet')
    addAccount('w2', 'Other', 'accEwallet')
    const { draft } = await preview()
    expect((await commit(draft, { accountSelections: { source: 'w2' } })).error).toBe('account-configuration-changed')
    expect((await commit(draft, { text: tng.replace('TNGSAMPLE12345678', 'TNGSAMPLE12345679') })).error).toBe('account-configuration-changed')
    expect((await commit(draft, { text: tng.replace('RM4.00', 'RM5.00') })).error).toBe('account-configuration-changed')
    expect(ledgerRows()).toHaveLength(0)
  })
  it.each(['deleted', 'changed-type', 'rotated', 'changed-links'])('rejects a %s account/key during commit', async change => {
    addAccount('w', 'TNG', 'accEwallet')
    const { draft } = await preview()
    mutateBeforeCommit = () => {
      if (change === 'deleted') rows.delete(`users/${uid}/jsave_accounts/w`)
      if (change === 'changed-type') addAccount('w', 'TNG', 'accBank')
      if (change === 'rotated') rows.set(keyPath, { keyHash: 'b'.repeat(64), accountIds: {} })
      if (change === 'changed-links') rows.set(keyPath, { keyHash, accountIds: { tngAccountId: 'different' } })
    }
    expect((await commit(draft)).code).toBe(409)
    expect(ledgerRows()).toHaveLength(0)
  })
  it('does not remember accounts on daily limit or invalid category', async () => {
    addAccount('w', 'TNG', 'accEwallet')
    rows.set(`jsave_shortcut_usage/${uid}_${new Date().toISOString().slice(0, 10)}`, { count: 100 })
    const { draft } = await preview()
    expect((await commit(draft, { category: 'bogus' })).error).toBe('invalid-category')
    expect((await commit(draft)).error).toBe('daily-limit')
    expect(rows.get(keyPath).accountIds).toEqual({})
    expect(ledgerRows()).toHaveLength(0)
  })
  it('can remember a confirmed duplicate without changing its ledger data', async () => {
    addAccount('w', 'TNG', 'accEwallet')
    const id = receiptTransactionDocumentId(parseReceiptScreenshot(tng))
    rows.set(`users/${uid}/jsave_transactions/${id}`, { note: 'Existing note' })
    const { draft } = await preview()
    expect((await commit(draft)).status).toBe('duplicate')
    expect(rows.get(ledgerRows()[0])).toEqual({ note: 'Existing note' })
    expect(rows.get(keyPath).accountIds.tngAccountId).toBe('w')
  })
  it('continues to support an installed legacy unified shortcut and its key', async () => {
    addAccount('w', 'TNG', 'accEwallet')
    rows.set(keyPath, { keyHash, accountIds: { tngAccountId: 'w' } })
    const old = await preview({ protocolVersion: undefined })
    expect(old.draft.sourceAccountId).toBeUndefined()
    const result = await commit(old.draft, { protocolVersion: undefined, accountSelections: undefined })
    expect(result.status).toBe('created')
  })
})
