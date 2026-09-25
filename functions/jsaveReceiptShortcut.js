const { parseTngScreenshot, transactionDocumentId } = require('./jsaveShortcut')
const { parseCimbScreenshot, cimbTransactionDocumentId } = require('./jsaveCimbShortcut')

function parseReceiptScreenshot(ocrText, sourceHint = '') {
  if (typeof ocrText !== 'string' || !ocrText.trim() || ocrText.length > 8000) throw new Error('invalid-ocr')
  const text = ocrText.normalize('NFKC')
  if (sourceHint && !['tng', 'cimb'].includes(sourceHint)) throw new Error('unsupported-provider')
  if (sourceHint === 'cimb' || (!sourceHint && /Transaction\s+Details/i.test(text) && /\bMYR\b/i.test(text))) {
    return { ...parseCimbScreenshot(text), provider: 'cimb' }
  }
  if (sourceHint === 'tng' || (!sourceHint && /(?:交易类型|钱包参考号|电子钱包参考编号|已转账|已付)/.test(text) && /\bRM\s*[\d,]+/i.test(text))) {
    return { ...parseTngScreenshot(text), provider: 'tng', accountKind: 'wallet' }
  }
  throw new Error('unsupported-receipt')
}

function receiptTransactionDocumentId(draft) {
  if (draft.provider === 'tng') return transactionDocumentId(draft.sourceTransactionId)
  if (draft.provider === 'cimb') return cimbTransactionDocumentId(draft.sourceTransactionId)
  throw new Error('unsupported-provider')
}

function receiptAccountKey(draft) {
  if (draft.provider === 'tng') return 'tngAccountId'
  if (draft.provider === 'cimb' && draft.accountKind === 'credit') return 'cimbCreditAccountId'
  if (draft.provider === 'cimb' && draft.accountKind === 'bank') return 'cimbBankAccountId'
  throw new Error('unsupported-provider')
}

function matchUobCreditAccount(accounts, payee) {
  const matches = accounts.filter(account => account.type === 'accCredit' &&
    /\bUOB\b|United\s+Overseas\s+Bank/i.test(account.name || ''))
  const digits = (payee || '').replace(/\D/g, '')
  const lastFour = digits.slice(-4)
  if (matches.length === 1) {
    const namedLastFour = (matches[0].name || '').match(/(?:^|\D)(\d{4})\s*\)?\s*$/)?.[1]
    return namedLastFour && lastFour && namedLastFour !== lastFour ? '' : matches[0].id
  }
  if (lastFour.length !== 4) return ''
  const numbered = matches.filter(account => (account.name || '').includes(lastFour))
  return numbered.length === 1 ? numbered[0].id : ''
}

module.exports = { parseReceiptScreenshot, receiptTransactionDocumentId, receiptAccountKey, matchUobCreditAccount }
