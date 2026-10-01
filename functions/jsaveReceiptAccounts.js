const crypto = require('crypto')
const { receiptAccountKey, receiptTransactionDocumentId } = require('./jsaveReceiptShortcut')

const RECEIPT_ACCOUNT_TYPES = Object.freeze({
  tngAccountId: 'accEwallet',
  cimbBankAccountId: 'accBank',
  cimbCreditAccountId: 'accCredit',
  uobCreditAccountId: 'accCredit',
})
const ID = /^[A-Za-z0-9_-]{1,128}$/
const ROUTES = {
  tngAccountId: { type: 'accEwallet', name: 'TNG 钱包', match: /\bTNG\b|touch\s*['’]?\s*n\s*['’]?\s*go|touch\s*(?:and|&)\s*go/i },
  cimbBankAccountId: { type: 'accBank', name: 'CIMB 银行', match: /\bCIMB\b/i },
  cimbCreditAccountId: { type: 'accCredit', name: 'CIMB 信用卡', match: /\bCIMB\b/i },
  uobCreditAccountId: { type: 'accCredit', name: 'UOB 信用卡', match: /\bUOB\b|United\s+Overseas\s+Bank/i },
}

function normalizeReceiptAccounts(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid-account-settings')
  const ids = {}
  for (const key of Object.keys(RECEIPT_ACCOUNT_TYPES)) {
    const id = input[key] ?? ''
    if (typeof id !== 'string' || (id && !ID.test(id))) throw new Error('invalid-account-settings')
    ids[key] = id
  }
  const selected = Object.values(ids).filter(Boolean)
  if (new Set(selected).size !== selected.length) throw new Error('duplicate-account-settings')
  return ids
}

function receiptRoutingToken(accountIds, targetAccountId = '') {
  const routing = Object.keys(RECEIPT_ACCOUNT_TYPES).map(key => accountIds[key] || '')
  routing.push(targetAccountId)
  return crypto.createHash('sha256').update(JSON.stringify(routing)).digest('hex')
}

function receiptSelectionToken(keyHash, draft, accountIds, sourceAccountId, targetAccountId = '') {
  const selection = [receiptTransactionDocumentId(draft), draft.type, draft.amount, draft.currency,
    draft.date, draft.time || '', draft.note, draft.transferTarget || '',
    receiptRoutingToken(accountIds), sourceAccountId, targetAccountId]
  return crypto.createHmac('sha256', keyHash).update(JSON.stringify(selection)).digest('hex')
}

function namedCardLastFour(name = '') {
  return String(name).match(/(?:^|\D)(\d{4})\s*\)?\s*$/)?.[1] || ''
}

function resolveReceiptAccounts(draft, accounts, savedIds = {}, selections = {}) {
  for (const role of ['source', 'target']) {
    if (selections[role] != null && (typeof selections[role] !== 'string' ||
      (selections[role] && !ID.test(selections[role])))) throw new Error('invalid-account-selection')
  }
  const sourceKey = receiptAccountKey(draft)
  const targetKey = draft.type === 'transfer' ? (draft.transferTarget === 'uobCredit' ? 'uobCreditAccountId' : 'tngAccountId') : ''
  const resolved = { sourceAccountId: '', targetAccountId: '', rememberedIds: { ...savedIds } }

  for (const [role, key] of [['source', sourceKey], ['target', targetKey]]) {
    if (!key) continue
    const route = ROUTES[key]
    const lastFour = key === 'uobCreditAccountId' ? String(draft.note || '').replace(/\D/g, '').slice(-4) : ''
    const candidates = accounts.filter(account => account.type === route.type && account.id !== resolved.sourceAccountId &&
      (!lastFour || !namedCardLastFour(account.name) || namedCardLastFour(account.name) === lastFour))
    let chosen
    if (selections[role]) {
      chosen = candidates.find(account => account.id === selections[role])
      if (!chosen) throw new Error('invalid-account-selection')
    } else {
      chosen = candidates.find(account => account.id === savedIds[key])
      if (!chosen) {
        const named = candidates.filter(account => route.match.test(account.name || ''))
        const numbered = lastFour ? named.filter(account => namedCardLastFour(account.name) === lastFour) : []
        if (numbered.length === 1) chosen = numbered[0]
        else if (named.length === 1) chosen = named[0]
      }
    }
    if (!chosen) {
      const options = {}
      const labels = candidates.map(account => {
        const base = String(account.name || route.name).trim() || route.name
        let label = base
        let count = 2
        while (Object.hasOwn(options, label)) label = `${base} (${count++})`
        Object.defineProperty(options, label, { value: account.id, enumerable: true })
        return label
      })
      return { ...resolved, pending: {
        error: labels.length ? 'account-selection-required' : 'no-compatible-account',
        selectionRole: role,
        selectionPrompt: `${role === 'target' ? '选择转入' : '选择'}${route.name}账户（确认保存后记住）`,
        accountLabels: labels,
        accountOptions: options,
        message: `请先在 JSave 建立${route.name}账户，再重新运行快捷指令。`,
      } }
    }
    resolved[role === 'source' ? 'sourceAccountId' : 'targetAccountId'] = chosen.id
    resolved.rememberedIds[key] = chosen.id
  }
  return resolved
}

module.exports = { RECEIPT_ACCOUNT_TYPES, normalizeReceiptAccounts, receiptRoutingToken, receiptSelectionToken, resolveReceiptAccounts }
