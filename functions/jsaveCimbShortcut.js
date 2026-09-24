const crypto = require('crypto')

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const LABELS = /^(?:Amount|Reference No\.?|Posted Date|Transacted Date|Date|Details|To|From|Transfer Type|Done)$/i

function rows(text) {
  return text.split('\n').map(row => row.trim()).filter(Boolean)
}

function field(lines, label) {
  const pattern = new RegExp(`^${label}(?:\\s*[:：]\\s*|\\s+)?(.*)$`, 'i')
  const index = lines.findIndex(line => pattern.test(line))
  if (index < 0) return ''
  const inline = lines[index].match(pattern)?.[1]?.trim()
  if (inline) return inline
  return lines[index + 1] && !LABELS.test(lines[index + 1]) ? lines[index + 1] : ''
}

function parseDate(value) {
  const match = value.match(/\b(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\b/)
  if (!match) throw new Error('missing-date')
  const day = Number(match[1])
  const month = MONTHS[match[2].toLowerCase()]
  const year = Number(match[3])
  if (!month || new Date(Date.UTC(year, month - 1, day)).getUTCDate() !== day) throw new Error('invalid-date')
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function afterLabel(lines, label, stops) {
  const index = lines.findIndex(line => new RegExp(`^${label}(?:\\s|$)`, 'i').test(line))
  if (index < 0) return ''
  const first = lines[index].replace(new RegExp(`^${label}\\s*[:：]?\\s*`, 'i'), '')
  const values = first ? [first] : []
  for (let i = index + 1; i < lines.length && values.length < 6; i++) {
    if (stops.test(lines[i])) break
    values.push(lines[i])
  }
  return values.join(' ').replace(/\s+/g, ' ').trim()
}

function parseCimbScreenshot(ocrText) {
  if (typeof ocrText !== 'string' || !ocrText.trim() || ocrText.length > 8000) throw new Error('invalid-ocr')
  const text = ocrText.normalize('NFKC').replace(/\r/g, '')
  if (!/Transaction\s+Details/i.test(text) || !/\bAmount\b/i.test(text)) throw new Error('unsupported-receipt')
  const lines = rows(text)
  const amountMatch = text.split(/\bAmount\b/i)[1]?.slice(0, 80).match(/([-+])?\s*MYR\s*([\d,]+\.\d{2})/i)
  if (!amountMatch) throw new Error('missing-amount')
  const amount = Number(amountMatch[2].replace(/,/g, ''))
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) throw new Error('invalid-amount')

  const isCard = /Transfer\s+Type\s*[:：]?\s*Credit\s+Card/i.test(text) ||
    lines.some((line, i) => /^Transfer Type$/i.test(line) && /^Credit Card$/i.test(lines[i + 1] || ''))
  const date = parseDate(isCard
    ? field(lines, 'Transacted Date') || field(lines, 'Posted Date')
    : field(lines, 'Date'))

  let note = isCard
    ? afterLabel(lines, 'To', /^(?:From|Transfer Type|Done)(?:\s|$)/i)
    : afterLabel(lines, 'Details', /^(?:Done|Reference No\.?|Posted Date|Transacted Date|Date|To|From|Transfer Type)(?:\s|$)/i)
  note = note.replace(/\s+/g, ' ').trim()
  if (!note || note === '-' || note.length > 240) throw new Error('missing-party')

  const isTopup = !isCard && amountMatch[1] !== '+' && /TNG\s+E\s*WALLET\b/i.test(note) &&
    /\bTOP\s*UP/i.test(note) && (amountMatch[1] === '-' || /\bPOS DEBIT\b/i.test(note))
  let type
  if (isTopup) type = 'transfer'
  else if (amountMatch[1] === '-' || /\b(?:POS DEBIT|DEBIT|\bDR\b)/i.test(note)) type = 'expense'
  else if (amountMatch[1] === '+' || /\b(?:CR|CREDIT|RECEIVED)\b/i.test(note)) type = 'income'
  else throw new Error('ambiguous-direction')
  const accountKind = isCard ? 'credit' : 'bank'
  const fingerprint = `${accountKind}|${type}|${date}|${amount.toFixed(2)}|${note.toUpperCase()}`
  const sourceTransactionId = `CIMB-${crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 40).toUpperCase()}`
  return { type, accountKind, amount, currency: 'MYR', date, time: '', note, sourceTransactionId }
}

function cimbTransactionDocumentId(sourceTransactionId) {
  return `cimb_${crypto.createHash('sha256').update(sourceTransactionId).digest('hex').slice(0, 40)}`
}

module.exports = { parseCimbScreenshot, cimbTransactionDocumentId }
