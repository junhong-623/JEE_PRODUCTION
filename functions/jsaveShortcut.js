const crypto = require('crypto')

const EXPENSE_CATEGORIES = new Set([
  'catFood', 'catTransport', 'catBills', 'catEntertainment',
  'catHealth', 'catShopping', 'catOther',
])
const INCOME_CATEGORIES = new Set([
  'catSalary', 'catFreelance', 'catInvestment', 'catGift', 'catOtherIncome',
])

function fieldAfter(text, label) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const index = lines.findIndex(line => line === label || line.startsWith(`${label} `) || line.startsWith(`${label}：`) || line.startsWith(`${label}:`))
  if (index < 0) return ''
  const inline = lines[index].slice(label.length).replace(/^[\s:：]+/, '').trim()
  return inline || lines[index + 1] || ''
}

function parseAmountValue(value) {
  let normalized = value.replace(/\s/g, '')
  if (normalized.includes('.')) {
    normalized = normalized.replace(/,/g, '')
  } else if (/^\d+,\d{2}$/.test(normalized)) {
    normalized = normalized.replace(',', '.')
  } else {
    normalized = normalized.replace(/,/g, '')
  }
  return Number(normalized)
}

function continuedFieldAfter(text, label) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const labelIndex = lines.findIndex(line => line === label || line.startsWith(`${label} `) || line.startsWith(`${label}：`) || line.startsWith(`${label}:`))
  if (labelIndex < 0) return ''

  const inline = lines[labelIndex].slice(label.length).replace(/^[\s:：]+/, '').trim()
  let valueIndex = labelIndex
  let value = inline
  if (!value) {
    valueIndex += 1
    value = lines[valueIndex] || ''
  }
  if (!/^[A-Z0-9-]+$/i.test(value)) return value

  // Long TNG IDs can wrap without a hyphen. Join only adjacent ID-shaped lines;
  // the next Chinese field label naturally stops the scan.
  for (let index = valueIndex + 1; index < lines.length; index += 1) {
    const continuation = lines[index]
    if (!/^[A-Z0-9-]+$/i.test(continuation) || value.length + continuation.length > 80) break
    value += continuation
  }
  return value
}

function scanPaymentParty(text, dateIndex, confirmationEnd) {
  // Vision can emit the three left-column labels before the right-column values.
  // Only inspect the transaction details above the date; the ad begins below it.
  const details = text.slice(confirmationEnd, dateIndex)
  const candidates = details.split('\n').map(line => line.trim()
    .replace(/^(?:接收者|接纳者|备注)\s*[:：]?\s*/, '')
    .replace(/\s*(?:备注|日期与时间)\s*[:：]?$/, '')
    .trim())
  return candidates.find(line => line && line.length <= 120 && /[\p{L}]/u.test(line) &&
    !/^(?:[+-]?\s*\d+\s*分|接收|接纳|备注|日期|时间|状态|完成|已转账|已付|RM\b)/i.test(line)) || ''
}

function scanMerchantConfirmationParty(text, dateIndex) {
  const invalidParty = /^(?:交易类型|DuitNow\s*参考编号|日期\/时间|日期与时间|电子钱包参考编号|付款方式|DuitNow\s*QR|电子钱包余额)$/i
  const merchantIndex = text.indexOf('商家')
  const typeIndex = text.indexOf('交易类型', merchantIndex)
  if (merchantIndex >= 0 && merchantIndex < dateIndex && typeIndex > merchantIndex) {
    const merchantLines = text.slice(merchantIndex + '商家'.length, typeIndex).split('\n')
      .map(line => line.trim()).filter(line => line && !invalidParty.test(line))
    if (merchantLines.length) return merchantLines.slice(0, 2).join(' ')
  }
  const direct = fieldAfter(text, '商家')
  if (direct && !invalidParty.test(direct)) return direct

  // Vision often reads all left-column labels first and all right-column values
  // afterwards. In that layout the merchant is the first useful value after the
  // final label and before the transaction date.
  const lines = text.slice(0, dateIndex).split('\n').map(line => line.trim()).filter(Boolean)
  const labelPattern = /^(?:商家|交易类型|DuitNow\s*参考编号|日期\/时间|日期与时间|电子钱包参考编号|付款方式)$/i
  let lastLabelIndex = -1
  lines.forEach((line, index) => {
    if (labelPattern.test(line)) lastLabelIndex = index
  })
  const values = lines.slice(lastLabelIndex + 1)
  const first = values.findIndex(line =>
    line.length <= 120 && /[\p{L}]/u.test(line) && !invalidParty.test(line) &&
    !/^(?:[eE][1Il][tT]|[+-]?\s*\d+\s*分|RM\b|\W*\d+:\d+|\W*4G\b)/i.test(line) &&
    !/^[A-Z0-9-]{8,}$/i.test(line))
  if (first < 0) return ''
  const merchantLines = [values[first]]
  const next = values[first + 1]
  if (next && /[\p{L}]/u.test(next) && !invalidParty.test(next) &&
      !/^DuitNow\b/i.test(next) && !/^[A-Z0-9-]{8,}$/i.test(next)) merchantLines.push(next)
  return merchantLines.join(' ')
}

function parseTngScreenshot(ocrText) {
  if (typeof ocrText !== 'string' || !ocrText.trim() || ocrText.length > 8000) {
    throw new Error('invalid-ocr')
  }
  const text = ocrText.normalize('NFKC').replace(/\r/g, '')
  if (/(?:^|\n)\s*(?:失败|付款处理中|转账处理中|处理中|待处理|已取消|交易已取消|退款中)\s*(?=\n|$)/.test(text)) {
    throw new Error('not-successful')
  }
  const confirmationMatch = text.match(/(?:^|\n)[ \t]*(?:已[ \t]*转[ \t]*账|[已己][ \t]*付(?:[ \t]*款)?)[ \t]*(?=\n|$)/)
  const confirmationPartyMatch = text.match(/(?:接收者|接纳者)/)
  const hasMerchantConfirmationFields = /商家/.test(text) && /交易类型/.test(text) &&
    /电子钱包参考编号/.test(text) && /付款方式/.test(text) && /完成/.test(text)
  const hasConfirmationFields = (Boolean(confirmationPartyMatch) && /完成/.test(text)) ||
    (/电子钱包参考编号/.test(text) && /商家编号/.test(text)) || hasMerchantConfirmationFields
  const status = fieldAfter(text, '状态')
  // A detail page carries an explicit status and transaction ID. Text in an ad
  // must not turn it into a confirmation page with a synthetic duplicate ID.
  const transferSuccess = !status && Boolean(confirmationMatch || hasConfirmationFields)
  const signedAmountMatch = text.match(/(?:^|[^\p{L}\p{N}])([+\-−‒–—―])\s*R\s*M\s*([0-9][0-9,]*(?:\s*\.\s*[0-9]{1,2})?)/iu)
  const currencyAmountMatch = text.match(/\bR\s*M\s*([0-9][0-9,]*(?:\s*\.\s*[0-9]{1,2})?)/i)
  const decimalAmountMatch = text.match(/(?:^|[^\d/:])(\d{1,7}\s*[.,]\s*\d{2})(?!\d)/)
  const detailExpense = /商家/.test(text) && /(?:付款|DuitNow)/i.test(text)
  const duitNowQrPayment = /\bDuitNow\s*QR\s*TNGD\b/i.test(text)

  let amountText = ''
  let type = ''
  if (transferSuccess) {
    amountText = currencyAmountMatch?.[1] || decimalAmountMatch?.[1] || ''
    type = 'expense'
  } else if (signedAmountMatch) {
    amountText = signedAmountMatch[2]
    type = signedAmountMatch[1] === '+' ? 'income' : 'expense'
  } else if (detailExpense) {
    // Vision occasionally drops the minus sign or the RM prefix, while the
    // successful detail page still has enough structure to verify an expense.
    amountText = currencyAmountMatch?.[1] || decimalAmountMatch?.[1] || ''
    type = 'expense'
  }
  if (!amountText) throw new Error('missing-amount')
  const amount = parseAmountValue(amountText)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) throw new Error('invalid-amount')

  if (type === 'income' && !/(从钱包接收|接收转账)/.test(text)) throw new Error('invalid-type')
  if (type === 'expense' && !transferSuccess && !/支付/.test(text) && !duitNowQrPayment) throw new Error('invalid-type')
  if (status && status !== '成功') throw new Error('not-successful')
  if (!transferSuccess && status !== '成功') throw new Error('not-successful')

  // iPhone OCR may read the date value before its label or split date and time
  // across lines. The successful transfer page has one complete transaction date.
  const dateMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\b/)
  if (!dateMatch) throw new Error('missing-date')
  const [, dayText, monthText, yearText, hourText, minuteText, secondText = '00'] = dateMatch
  const [day, month, year, hour, minute, second] = [dayText, monthText, yearText, hourText, minuteText, secondText].map(Number)
  const checkDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() !== month - 1 ||
      checkDate.getUTCDate() !== day || checkDate.getUTCHours() !== hour ||
      checkDate.getUTCMinutes() !== minute || checkDate.getUTCSeconds() !== second) {
    throw new Error('invalid-date')
  }
  const date = `${yearText}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`

  const confirmationEnd = confirmationMatch
    ? confirmationMatch.index + confirmationMatch[0].length
    : confirmationPartyMatch?.index || 0
  let note = transferSuccess
    ? (confirmationPartyMatch
        ? scanPaymentParty(text, dateMatch.index, confirmationEnd)
        : scanMerchantConfirmationParty(text, dateMatch.index))
    : type === 'expense' ? fieldAfter(text, '商家') : fieldAfter(text, '接收转账')
  if (type === 'expense' && !note) {
    note = text.match(/支付\s*[-–—]\s*([^\n]+)/)?.[1]?.trim() || ''
  }
  if (!note || note.length > 120 || /^(备注|款项详情|付款方式|日期\/时间|日期与时间|钱包参考号|状态|交易编号)$/.test(note)) {
    throw new Error('missing-party')
  }

  let sourceTransactionId
  if (transferSuccess) {
    // The confirmation page has no TNG transaction ID. Hash only verified transaction fields,
    // so ad text and OCR line wrapping cannot affect deduplication.
    const fingerprint = `${date}T${time}|${amount.toFixed(2)}|${note.replace(/\s+/g, ' ').trim().toUpperCase()}`
    sourceTransactionId = `RECEIPT-${crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 40).toUpperCase()}`
  } else {
    // TNGD QR IDs remain recognizable when OCR moves them before their label.
    const qrTransactionId = duitNowQrPayment
      ? text.toUpperCase().replace(/\s+/g, '').match(/20\d{6}TNGD[A-Z0-9]{8,64}/)?.[0]
      : ''
    sourceTransactionId = qrTransactionId || continuedFieldAfter(text, '交易编号')
    sourceTransactionId = sourceTransactionId.replace(/\s+/g, '').toUpperCase()
  }
  if (!/^[A-Z0-9-]{8,80}$/.test(sourceTransactionId)) throw new Error('missing-transaction-id')

  return { type, amount, currency: 'MYR', date, time, note, sourceTransactionId }
}

function validateCategory(type, category) {
  return type === 'expense'
    ? EXPENSE_CATEGORIES.has(category)
    : INCOME_CATEGORIES.has(category)
}

function transactionDocumentId(sourceTransactionId) {
  return `tng_${crypto.createHash('sha256').update(sourceTransactionId).digest('hex').slice(0, 40)}`
}

module.exports = { parseTngScreenshot, validateCategory, transactionDocumentId }
