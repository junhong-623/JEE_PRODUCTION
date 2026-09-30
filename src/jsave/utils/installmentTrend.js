import { fromCents, toCents } from './installments'

const monthKey = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.slice(0, 7) : null

export function monthlyInstallmentTrend(items = [], transactions = [], today = new Date(), count = 6) {
  const months = Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - index - 1), 1)
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, scheduledCents: 0, recordedCents: 0, newPlans: 0 }
  })
  const byMonth = new Map(months.map(month => [month.key, month]))
  const planIds = new Set()

  for (const item of items) {
    if (!item.installmentPlan?.installments?.length) continue
    planIds.add(item.id)
    const purchase = byMonth.get(monthKey(item.purchaseDate))
    if (purchase) purchase.newPlans += 1
    for (const payment of item.installmentPlan.installments) {
      const month = byMonth.get(monthKey(payment.dueDate))
      if (month) month.scheduledCents += toCents(payment.amount)
    }
  }

  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !planIds.has(transaction.installmentItemId)) continue
    const month = byMonth.get(monthKey(transaction.date))
    if (month) month.recordedCents += toCents(transaction.amount)
  }

  return months.map(({ scheduledCents, recordedCents, ...month }) => ({
    ...month,
    scheduled: fromCents(scheduledCents),
    recorded: fromCents(recordedCents),
  }))
}
