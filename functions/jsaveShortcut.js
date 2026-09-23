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

function scanPaymentParty(text, dateIndex) {
  // Vision can emit the three left-column labels before the right-column values.
  // Only inspect the transaction details above the date; the ad begins below it.
  const details = text.slice(text.indexOf('已转账') + '已转账'.length, dateIndex)
  const candidates = details.split('\n').map(line => line.trim()
    .replace(/^(?:接收者|备注)\s*[:：]?\s*/, '')
    .replace(/\s*(?:备注|日期与时间)\s*[:：]?$/, '')
    .trim())
  return candidates.find(line => line && line.length <= 120 && /[\p{L}]/u.test(line) &&
    !/^(?:接收|备注|日期|时间|状态|完成|已转账|RM\b)/i.test(line)) || ''
}

function parseTngScreenshot(ocrText) {
  if (typeof ocrText !== 'string' || !ocrText.trim() || ocrText.length > 8000) {
    throw new Error('invalid-ocr')
  }
  const text = ocrText.normalize('NFKC').replace(/\r/g, '')
  const transferSuccess = /(?:^|\n)\s*已转账\s*(?=\n|$)/.test(text)
  const amountMatch = transferSuccess
    ? text.slice(0, text.indexOf('已转账')).match(/(?:^|\n)\s*RM\s*([\d,]+(?:\.\d{2})?)\s*(?=\n|$)/i)
    : text.match(/(^|\n|\s)([+-])\s*RM\s*([\d,]+(?:\.\d{2})?)/i)
  if (!amountMatch) throw new Error('missing-amount')
  const amount = Number((transferSuccess ? amountMatch[1] : amountMatch[3]).replace(/,/g, ''))
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) throw new Error('invalid-amount')

  const type = transferSuccess || amountMatch[2] === '-' ? 'expense' : 'income'
  if (type === 'expense' && !transferSuccess && !/支付/.test(text)) throw new Error('invalid-type')
  if (type === 'income' && !/(从钱包接收|接收转账)/.test(text)) throw new Error('invalid-type')
  if (!transferSuccess && fieldAfter(text, '状态') !== '成功') throw new Error('not-successful')

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

  let note = transferSuccess ? scanPaymentParty(text, dateMatch.index) : type === 'expense' ? fieldAfter(text, '商家') : fieldAfter(text, '接收转账')
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
    sourceTransactionId = fieldAfter(text, '交易编号')
    if (sourceTransactionId.endsWith('-')) {
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
      const index = lines.findIndex(line => line.includes(sourceTransactionId))
      sourceTransactionId += lines[index + 1] || ''
    }
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
