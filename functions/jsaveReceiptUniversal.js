const crypto = require('crypto')
const { parseReceiptScreenshot, receiptAccountKey, receiptTransferAccountKey, receiptTransactionDocumentId } = require('./jsaveReceiptShortcut')

const ACCOUNT_TYPES = ['accCash', 'accBank', 'accEwallet', 'accCredit']
const TYPE_NAMES = { accCash: '现金', accBank: '银行', accEwallet: '钱包', accCredit: '信用卡' }
const BANK_NAMES = { tng: /\bTNG\b|touch\s*['’]?\s*n\s*['’]?\s*go/i, cimb: /\bCIMB\b/i, uob: /\bUOB\b|United\s+Overseas\s+Bank/i,
  maybank: /\bMaybank\b|\bMAE\b|\bMBB\b/i, rhb: /\bRHB\b/i, 'public bank': /\bPublic\s+Bank\b|\bPBB\b/i, 'hong leong': /\bHong\s+Leong\b|\bHLB\b/i }
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
const clean = (value, max) => {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error('invalid-review-fields')
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ')
}
const textField = (text, label) => text.match(new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:：]?\\s*(?:\\n\\s*)?([^\\n]+)`, 'i'))?.[1]?.trim() || ''
const lastFour = value => String(value).match(/(?:^|\D)(\d{4})\s*\)?\s*$/)?.[1] || ''
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(y, m - 1, d))
  return y >= 2000 && y <= 2100 && parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d
}

function receiptSuggestions(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 8000) throw new Error('invalid-ocr')
  text = text.normalize('NFKC').replace(/\r/g, '')
  const amounts = [...new Set([...text.matchAll(/\b(?:RM|MYR)\s*([\d,]+\.\d{2})\b/gi)]
    .map(match => Number(match[1].replace(/,/g, ''))).filter(value => value > 0 && value <= 1000000))]
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const dates = [...text.matchAll(/\b(?:(\d{4})-(\d{2})-(\d{2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})|(\d{1,2})\s*([A-Za-z]{3,4})\s*(\d{4}))\b/g)].map(m => {
    if (m[1]) return `${m[1]}-${m[2]}-${m[3]}`
    if (m[4]) return `${m[6]}-${m[5].padStart(2, '0')}-${m[4].padStart(2, '0')}`
    const month = monthNames.indexOf(m[8].toLowerCase().slice(0, 3)) + 1
    return `${m[9]}-${String(month).padStart(2, '0')}-${m[7].padStart(2, '0')}`
  }).filter(validDate)
  let sourceLabel = ''
  for (const [name, pattern] of Object.entries(BANK_NAMES)) if (pattern.test(text)) { sourceLabel = name.toUpperCase(); break }
  if (/\bShopee\b/i.test(text)) sourceLabel = 'Shopee'
  else if (/\bGrab\b/i.test(text)) sourceLabel = 'Grab'
  const note = textField(text, '商家|商户|店家|Merchant|Seller|Store|Recipient|To')
  const reference = textField(text, '交易编号|订单编号|Order ID|Order SN|Transaction ID|Reference No\\.?|Reference Number|Ref No\\.?')
  return { amount: amounts.length === 1 ? amounts[0].toFixed(2) : '', date: new Set(dates).size === 1 ? dates[0] : '',
    note: note.slice(0, 240), sourceLabel, reference: reference === '-' ? '' : reference.slice(0, 128) }
}

function manualReceiptDraft(text, fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('invalid-review-fields')
  const suggestion = receiptSuggestions(text)
  if (!['expense', 'income', 'transfer'].includes(fields.type)) throw new Error('invalid-review-type')
  const amountText = clean(String(fields.amount ?? ''), 40)
  const match = amountText.match(/^(?:RM\s*|MYR\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)$/i)
  const amount = match ? Number(match[1].replace(/,/g, '')) : 0
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) throw new Error('invalid-review-amount')
  const date = clean(fields.date || '', 10)
  if (!validDate(date)) throw new Error('invalid-review-date')
  const note = clean(fields.note || '', 240)
  if (!note) throw new Error('invalid-review-note')
  const sourceLabel = clean(fields.sourceLabel || suggestion.sourceLabel || '其他收据', 60) || '其他收据'
  const reference = clean(fields.reference || '', 128)
  // A reference is preferred; without one, same-day identical entries may be duplicates.
  const fingerprint = [sourceLabel.toUpperCase(), fields.type, date, amount.toFixed(2), reference.toUpperCase() || note.toUpperCase()]
  return { provider: 'manual', sourceLabel, type: fields.type, amount, date, currency: 'MYR', time: '', note,
    reference, accountKind: 'any', transferTarget: '', sourceTransactionId: `MANUAL-${hash(fingerprint).slice(0, 40)}` }
}

function universalReceiptDraft(input) {
  const text = input.text
  const suggestions = receiptSuggestions(text)
  if (input.manualFields != null) {
    const draft = manualReceiptDraft(text, input.manualFields)
    const native = universalReceiptDraft({ ...input, manualFields: undefined }).draft
    if (native) {
      draft.legacyDocumentId = receiptTransactionDocumentId(native)
      draft.sourceTransactionId = native.sourceTransactionId
    }
    return { draft }
  }
  const hint = input.sourceHint || ''
  if (!['', 'tng', 'cimb', 'other'].includes(hint)) throw new Error('unsupported-provider')
  const cimbLayout = /Transaction\s+Details/i.test(text) && /\bMYR\b/i.test(text)
  const brandedCimb = /\bWithin\s+CIMB\s+Bank\b/i.test(text) || /\bCIMB\b/i.test(text.split(/Transaction\s+Details/i)[0])
  // A generic English heading does not identify the bank. Ask rather than label it CIMB.
  if (!hint && cimbLayout && !brandedCimb) return { pending: { error: 'source-selection-required',
    sourceLabels: ['CIMB', '其他银行／平台', '跳过这张截图'], sourceOptions: { CIMB: 'cimb', '其他银行／平台': 'other', '跳过这张截图': 'skip' } } }
  if (hint !== 'other' && (!cimbLayout || brandedCimb || hint === 'cimb')) {
    try {
      const draft = parseReceiptScreenshot(text, hint)
      return { draft: { ...draft, sourceLabel: draft.provider.toUpperCase() } }
    } catch (error) {
      if (error.message === 'invalid-ocr') throw error
    }
  }
  const receiptLike = /\b(?:RM|MYR)\s*[\d,]+(?:\.\d{1,2})?\b/i.test(text) &&
    /payment|paid|transfer|transaction|receipt|order|merchant|seller|收据|交易|商家|支付|付款|收款|已付|已转账|订单/i.test(text)
  return { pending: { error: 'manual-review-required', receiptLike: receiptLike ? '1' : '0', suggestions,
    message: '请核对并补全单笔交易资料。金额、日期、交易类型和账户需由你确认。' } }
}

function universalDocumentId(draft) {
  if (draft.legacyDocumentId) return draft.legacyDocumentId
  if (draft.provider !== 'manual') return receiptTransactionDocumentId(draft)
  return `receipt_${hash(draft.sourceTransactionId).slice(0, 40)}`
}
function accountHints(draft, text) {
  const native = draft.provider !== 'manual'
  const sourceProvider = draft.sourceLabel.toLowerCase()
  const creditTarget = native && ['cimbCredit', 'uobCredit'].includes(draft.transferTarget)
  const targetProvider = creditTarget ? draft.transferTarget.replace('Credit', '') : native && draft.type === 'transfer' ? 'tng' : ''
  const fromIndex = text.search(/(?:^|\n)From\b/i)
  const sourceSuffix = native && draft.provider === 'cimb' && fromIndex >= 0 ? text.slice(fromIndex).split(/\b(?:When|Repeat|Transfer Type|Transfer Method|Payment Type|Done)\b/i)[0].match(/\b(?:\d[ -]?){7,19}\d\b/)?.[0]?.replace(/\D/g, '').slice(-4) || '' : ''
  return {
    source: { provider: sourceProvider, suffix: sourceSuffix, accountTypes: ACCOUNT_TYPES,
      preferredType: native ? draft.provider === 'tng' ? 'accEwallet' : draft.accountKind === 'credit' ? 'accCredit' : 'accBank' : '',
      legacyKey: native ? receiptAccountKey(draft) : '', title: draft.type === 'transfer' ? '转出账户' : draft.type === 'income' ? '收款账户' : '付款账户' },
    target: { provider: targetProvider, suffix: creditTarget ? draft.note.replace(/\D/g, '').slice(-4) : '',
      accountTypes: creditTarget ? ['accCredit'] : ACCOUNT_TYPES, preferredType: creditTarget ? 'accCredit' : targetProvider === 'tng' ? 'accEwallet' : '',
      legacyKey: native && draft.type === 'transfer' ? receiptTransferAccountKey(draft) : '', title: '转入账户' },
  }
}
function preferenceKey(draft, role, hint) { return hash([draft.sourceLabel.toLowerCase(), draft.type, role, hint.provider, hint.suffix, hint.preferredType]) }
function selectionMenu(accounts, role, suggestedId = '') {
  const accountOptions = {}
  const accountLabels = accounts.map(account => {
    const base = `${account.name || '未命名账户'} · ${TYPE_NAMES[account.type]}${account.id === suggestedId ? '（推荐）' : ''}`
    let label = base, count = 2
    while (Object.hasOwn(accountOptions, label)) label = `${base} (${count++})`
    Object.defineProperty(accountOptions, label, { value: account.id, enumerable: true })
    return label
  })
  return { selectionRole: role, accountLabels, accountOptions }
}
function resolveUniversalAccounts(draft, text, accounts, keyData, selections = {}, forceSelection = false) {
  if (!selections || typeof selections !== 'object' || Array.isArray(selections)) throw new Error('invalid-account-selection')
  for (const role of ['source', 'target']) if (selections[role] != null && (typeof selections[role] !== 'string' ||
    (selections[role] && !/^[A-Za-z0-9_-]{1,128}$/.test(selections[role])))) throw new Error('invalid-account-selection')
  if (draft.type !== 'transfer' && selections.target) throw new Error('invalid-account-selection')
  const hints = accountHints(draft, text)
  const result = { sourceAccountId: '', targetAccountId: '', preferences: {}, menus: {} }
  for (const role of draft.type === 'transfer' ? ['source', 'target'] : ['source']) {
    const hint = hints[role]
    const linkKey = preferenceKey(draft, role, hint)
    const candidates = accounts.filter(account => ACCOUNT_TYPES.includes(account.type) && hint.accountTypes.includes(account.type) &&
      account.id !== result.sourceAccountId && (!hint.suffix || !lastFour(account.name) || lastFour(account.name) === hint.suffix))
    const requested = selections[role] || ''
    if (typeof requested !== 'string' || (requested && !/^[A-Za-z0-9_-]{1,128}$/.test(requested))) throw new Error('invalid-account-selection')
    let selected = requested ? candidates.find(account => account.id === requested) : null
    if (requested && !selected) throw new Error('invalid-account-selection')
    const saved = candidates.find(account => account.id === keyData.accountLinks?.[linkKey]?.accountId)
    const legacy = candidates.find(account => account.id === keyData.accountIds?.[hint.legacyKey] && (!hint.preferredType || account.type === hint.preferredType))
    const named = candidates.filter(account => BANK_NAMES[hint.provider]?.test(account.name || '') && (!hint.preferredType || account.type === hint.preferredType))
    const numbered = hint.suffix ? named.filter(account => lastFour(account.name) === hint.suffix) : []
    const suggested = saved || legacy || (numbered.length === 1 ? numbered[0] : named.length === 1 ? named[0] : null)
    const menu = { ...selectionMenu(candidates, role, suggested?.id), selectionPrompt: `选择${hint.title}` }
    result.menus[role] = menu
    if (!selected && !forceSelection) selected = suggested
    if (!selected) return { ...result, pending: { ...menu, error: candidates.length ? 'account-selection-required' : 'no-compatible-account',
      message: hint.accountTypes.length === 1 ? '请先在 JSave 建立对应信用卡账户。' : '请先在 JSave 建立账户，再重新运行指令。' } }
    result[role === 'source' ? 'sourceAccountId' : 'targetAccountId'] = selected.id
    result.preferences[linkKey] = { accountId: selected.id, label: `${draft.sourceLabel} · ${draft.type === 'expense' ? '支出' : draft.type === 'income' ? '收入' : '转账'} · ${hint.title}${hint.suffix ? ` · ${hint.suffix}` : ''}`,
      accountTypes: hint.accountTypes }
  }
  return result
}
function preferenceDigest(keyData) { return hash([keyData.accountIds || {}, Object.entries(keyData.accountLinks || {}).sort(([a], [b]) => a.localeCompare(b))]) }
function universalRoutingToken(keyHash, draft, text, keyData, selections) {
  return crypto.createHmac('sha256', keyHash).update(JSON.stringify([draft, hash(text), preferenceDigest(keyData), selections.source, selections.target || ''])).digest('hex')
}
function rememberUniversalAccounts(existing, changes) {
  const entries = Object.entries(existing || {})
  const changed = new Set(Object.keys(changes))
  return Object.fromEntries([...entries.filter(([key]) => !changed.has(key)), ...Object.entries(changes)].slice(-100))
}

module.exports = { ACCOUNT_TYPES, receiptSuggestions, manualReceiptDraft, universalReceiptDraft, universalDocumentId,
  resolveUniversalAccounts, universalRoutingToken, rememberUniversalAccounts }
