const { parseTngScreenshot, transactionDocumentId } = require('./jsaveShortcut')
const { parseCimbScreenshot, cimbTransactionDocumentId } = require('./jsaveCimbShortcut')

function parseReceiptScreenshot(ocrText, sourceHint = '') {
  if (typeof ocrText !== 'string' || !ocrText.trim() || ocrText.length > 8000) throw new Error('invalid-ocr')
  const text = ocrText.normalize('NFKC')
  if (sourceHint && !['tng', 'cimb'].includes(sourceHint)) throw new Error('unsupported-provider')
  if (sourceHint === 'cimb' || (!sourceHint && /Transaction\s+Details/i.test(text) && /\bMYR\b/i.test(text))) {
    return { ...parseCimbScreenshot(text), provider: 'cimb' }
  }
  const hasTngFields = /(?:交易类型|钱包参考号|电子钱包参考编号|接收者|接纳者|已\s*转\s*账|[已己]\s*付)/.test(text)
  const hasAmount = /\bR\s*M\s*[\d,]+/i.test(text) || /\d{1,7}\s*[.,]\s*\d{2}/.test(text)
  if (sourceHint === 'tng' || (!sourceHint && hasTngFields && hasAmount)) {
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

function receiptTransferAccountKey(draft) {
  if (draft.type !== 'transfer') return ''
  switch (draft.transferTarget || '') {
    case 'uobCredit': return 'uobCreditAccountId'
    case 'cimbCredit': return 'cimbCreditAccountId'
    case '':
    case 'tng': return 'tngAccountId'
    default: throw new Error('unsupported-transfer-target')
  }
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

module.exports = { parseReceiptScreenshot, receiptTransactionDocumentId, receiptAccountKey, receiptTransferAccountKey, matchUobCreditAccount }
