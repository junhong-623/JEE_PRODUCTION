import { toLocalDateString } from './date'

export const toCents = value => Math.round((Number(value) || 0) * 100)
export const fromCents = cents => Math.round(cents) / 100

export function monthDueDate(startDate, offset) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '')) return ''
  const [year, month, day] = startDate.split('-').map(Number)
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) return ''
  const target = new Date(year, month - 1 + offset, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return toLocalDateString(target)
}

export function makeInstallments(total, count, startDate) {
  const cents = toCents(total)
  const length = Math.trunc(Number(count))
  if (!Number.isFinite(cents) || cents <= 0 || length < 1 || length > 120 || !monthDueDate(startDate, 0)) return []
  const base = Math.floor(cents / length)
  return Array.from({ length }, (_, index) => ({
    number: index + 1,
    dueDate: monthDueDate(startDate, index),
    amount: fromCents(base + (index === length - 1 ? cents - base * length : 0)),
  }))
}

export function makeFixedInstallments(monthlyAmount, count, startDate, finalAmount = monthlyAmount) {
  const monthlyCents = toCents(monthlyAmount)
  const finalCents = toCents(finalAmount)
  const length = Math.trunc(Number(count))
  if (!Number.isFinite(monthlyCents) || !Number.isFinite(finalCents) || monthlyCents <= 0 || finalCents <= 0 || length < 1 || length > 120 || !monthDueDate(startDate, 0)) return []
  return Array.from({ length }, (_, index) => ({
    number: index + 1,
    dueDate: monthDueDate(startDate, index),
    amount: fromCents(index === length - 1 ? finalCents : monthlyCents),
  }))
}

export function dueInstallmentCount(startDate, count, asOfDate = toLocalDateString(new Date())) {
  const length = Math.min(120, Math.max(0, Math.trunc(Number(count) || 0)))
  if (!monthDueDate(startDate, 0) || !monthDueDate(asOfDate, 0)) return 0
  let due = 0
  for (let index = 0; index < length; index += 1) {
    if (monthDueDate(startDate, index) > asOfDate) break
    due += 1
  }
  return due
}

export function estimatedFinancingDifference(itemCost, upfrontAmount, totalPayable) {
  const difference = toCents(upfrontAmount) + toCents(totalPayable) - toCents(itemCost)
  return difference < 0 ? null : fromCents(difference)
}

export function estimatedAnnualFinancingRate(itemCost, upfrontAmount, installments) {
  const principal = toCents(itemCost) - toCents(upfrontAmount)
  const payments = (installments || []).map(row => toCents(row.amount))
  if (principal <= 0 || !payments.length || payments.length > 120 || payments.some(amount => !Number.isFinite(amount) || amount <= 0)) return null
  const total = payments.reduce((sum, amount) => sum + amount, 0)
  if (total < principal) return null
  if (total === principal) return 0

  // Infer a monthly rate from the scheduled cash flows, assuming the first
  // payment is one month after financing. Annualise by compounding 12 months.
  const presentValue = rate => payments.reduce((sum, amount, index) => sum + amount / (1 + rate) ** (index + 1), 0)
  let low = 0
  let high = 0.01
  while (presentValue(high) > principal && high < 100) high *= 2
  if (presentValue(high) > principal) return null
  for (let index = 0; index < 80; index += 1) {
    const midpoint = (low + high) / 2
    if (presentValue(midpoint) > principal) low = midpoint
    else high = midpoint
  }
  const monthlyRate = (low + high) / 2
  return Math.round(((1 + monthlyRate) ** 12 - 1) * 10000) / 100
}

export function validateInstallmentPlan(plan, itemCost) {
  if (!plan) return null
  const upfront = toCents(plan.upfrontAmount)
  const price = toCents(itemCost)
  const payable = toCents(plan.totalPayable)
  const rows = plan.installments || []
  if (plan.amountMode === 'monthly' && (toCents(plan.monthlyAmount) <= 0 || (plan.lastPaymentAmount !== '' && plan.lastPaymentAmount != null && toCents(plan.lastPaymentAmount) <= 0))) return 'amount'
  if (price <= 0 || upfront < 0 || upfront >= price || payable < price - upfront) return 'amount'
  if (plan.paymentCount != null && Number(plan.paymentCount) !== rows.length) return 'schedule'
  if (!rows.length || rows.length > 120 || !/^\d{4}-\d{2}-\d{2}$/.test(plan.startDate || '')) return 'schedule'
  if (!monthDueDate(plan.startDate, 0) || rows[0].dueDate !== plan.startDate || rows.some((row, index) => row.number !== index + 1 || !monthDueDate(row.dueDate, 0) || toCents(row.amount) <= 0 || (index > 0 && row.dueDate <= rows[index - 1].dueDate))) return 'schedule'
  if (rows.reduce((sum, row) => sum + toCents(row.amount), 0) !== payable) return 'total'
  if (!Number.isInteger(Number(plan.openingPaidCount)) || Number(plan.openingPaidCount) < 0 || Number(plan.openingPaidCount) > rows.length) return 'opening'
  return null
}

export function installmentLink(tx) {
  if (tx?.type !== 'expense' || !tx.installmentItemId || !Number.isInteger(Number(tx.installmentNumber)) || Number(tx.installmentNumber) <= 0) return null
  return `${tx.installmentItemId}:${Number(tx.installmentNumber)}`
}

export function installmentProgress(item, transactions = [], excludeTransactionId = null) {
  const plan = item?.installmentPlan
  if (!plan?.installments?.length) return null
  const linked = new Map()
  for (const tx of transactions) {
    if (tx.id === excludeTransactionId || tx.type !== 'expense' || tx.installmentItemId !== item.id) continue
    const number = Number(tx.installmentNumber)
    if (!linked.has(number)) linked.set(number, tx)
  }
  const rows = plan.installments.map(row => {
    const tx = linked.get(row.number)
    const opening = row.number <= Number(plan.openingPaidCount || 0)
    return { ...row, transaction: tx || null, opening, paid: Boolean(tx) || opening }
  })
  const pending = rows.filter(row => !row.paid)
  return {
    rows,
    paidCount: rows.length - pending.length,
    remainingCount: pending.length,
    futureAmount: fromCents(pending.reduce((sum, row) => sum + toCents(row.amount), 0)),
    paidAmount: fromCents(rows.reduce((sum, row) => sum + (row.opening ? toCents(row.amount) : row.transaction ? toCents(row.transaction.amount) : 0), 0)),
    next: pending[0] || null,
    status: pending.length === 0 ? 'settled' : rows.length === pending.length ? 'notStarted' : 'active',
  }
}

export function totalFutureInstallments(items = [], transactions = []) {
  return fromCents(items.reduce((sum, item) => sum + toCents(installmentProgress(item, transactions)?.futureAmount), 0))
}
