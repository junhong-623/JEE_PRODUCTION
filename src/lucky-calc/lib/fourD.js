export const OPERATOR_LABELS = {
  magnum: 'Magnum',
  sportstoto: 'Sports Toto',
  damacai: 'Da Ma Cai',
}

export const OPERATOR_SHORT_LABELS = {
  m: 'Magnum',
  t: 'Sports Toto',
  d: 'Da Ma Cai',
}

export const PRIZE_LABELS = {
  first: '头奖',
  second: '二奖',
  third: '三奖',
  special: '特别奖',
  consolation: '安慰奖',
}

export const PRIZE_SHORT_LABELS = {
  1: '头奖',
  2: '二奖',
  3: '三奖',
  s: '特别奖',
  c: '安慰奖',
}

export const PRIZE_ORDER = ['first', 'second', 'third', 'special', 'consolation']

// Standard straight-play payout per RM1 for the three supported operators.
// Sources: official Sports Toto and Da Ma Cai prize tables (verified Sep 2026).
export const STRAIGHT_PAYOUT = {
  big: {
    first: 2500,
    second: 1000,
    third: 500,
    special: 180,
    consolation: 60,
  },
  small: {
    first: 3500,
    second: 2000,
    third: 1000,
    special: null,
    consolation: null,
  },
}

const OPERATOR_CODES = { m: 'magnum', t: 'sportstoto', d: 'damacai' }
const PRIZE_CODES = { 1: 'first', 2: 'second', 3: 'third', s: 'special', c: 'consolation' }

export function sanitizeFourDInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 4)
}

export function isValidFourD(value) {
  return /^\d{4}$/.test(String(value ?? ''))
}

export function isValidQianziNumber(value) {
  return /^\d{1,4}$/.test(String(value ?? ''))
}

export function getPayout({ betType, prize, amount }) {
  const stake = Number(amount)
  if (!['big', 'small'].includes(betType)) return { error: '请选择投注方式' }
  if (!PRIZE_ORDER.includes(prize)) return { error: '请选择奖项' }
  if (!Number.isFinite(stake) || stake <= 0) return { error: '投注金额必须大于 RM0' }

  const unitPrize = STRAIGHT_PAYOUT[betType][prize]
  if (unitPrize == null) return { error: '小字（Small）只包括头奖、二奖和三奖' }

  return { stake, unitPrize, payout: stake * unitPrize }
}

export function decodeHistoryRows(rows = []) {
  return rows.map(([date, operatorCode, prizeCode, drawNo]) => ({
    date,
    operator: OPERATOR_CODES[operatorCode] || operatorCode,
    prize: PRIZE_CODES[prizeCode] || prizeCode,
    drawNo: String(drawNo ?? ''),
  }))
}

export function decodeSuffixRows(rows = []) {
  return rows.map(([number, date, operatorCode, prizeCode, drawNo]) => ({
    number,
    date,
    operator: OPERATOR_CODES[operatorCode] || operatorCode,
    prize: PRIZE_CODES[prizeCode] || prizeCode,
    drawNo: String(drawNo ?? ''),
  }))
}

export function summarizeHistory(records = []) {
  const byPrize = Object.fromEntries(PRIZE_ORDER.map(prize => [prize, 0]))
  const byOperator = Object.fromEntries(Object.keys(OPERATOR_LABELS).map(operator => [operator, 0]))

  for (const record of records) {
    if (record.prize in byPrize) byPrize[record.prize] += 1
    if (record.operator in byOperator) byOperator[record.operator] += 1
  }

  return {
    total: records.length,
    lastWin: records[0]?.date || null,
    byPrize,
    byOperator,
  }
}

export function historyShardUrl(number) {
  if (!isValidFourD(number)) return null
  return `/luck-calc/data/history/${number.slice(0, 2)}.json`
}

export function suffixShardUrl(number) {
  if (!isValidFourD(number)) return null
  return `/luck-calc/data/suffix/${number.slice(-2)}.json`
}

export function drawYearUrl(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) return null
  return `/luck-calc/data/draws/${date.slice(0, 4)}.json`
}

export function latestCoverageDate(manifest) {
  return Object.values(manifest?.coverage || {})
    .map(item => item.to)
    .filter(Boolean)
    .sort()
    .at(-1) || ''
}

export function malaysiaDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function formatMYR(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

export function formatDrawDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return value || '—'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

