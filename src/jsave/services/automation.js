import { localMonthKey, toLocalDateString } from '../utils/date'

function stableHash(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function recurringSignature(transaction) {
  return [
    transaction.amount,
    transaction.category,
    transaction.accountId,
    transaction.recurringBaseNote ?? transaction.note ?? '',
  ].join('|')
}

export function getDueRecurringTransactions({ transactions, uid, language = 'en', now = new Date() }) {
  const monthKey = localMonthKey(now)
  const recurring = transactions.filter(tx => tx.recurring && tx.type === 'expense' && !tx.deleted)
  const latestBySignature = new Map()

  for (const transaction of recurring) {
    const signature = recurringSignature(transaction)
    const previous = latestBySignature.get(signature)
    if (!previous || transaction.date > previous.date) latestBySignature.set(signature, transaction)
  }

  const prefix = language === 'zh'
    ? `${now.getMonth() + 1}月`
    : now.toLocaleString('en', { month: 'short' })

  return [...latestBySignature.entries()].flatMap(([signature, template]) => {
    const alreadyExists = recurring.some(tx =>
      tx.date?.startsWith(monthKey) && recurringSignature(tx) === signature
    )
    if (alreadyExists) return []

    const baseNote = template.recurringBaseNote ?? template.note ?? ''
    return [{
      ...template,
      id: `auto-recurring-${monthKey}-${stableHash(signature)}`,
      date: toLocalDateString(now),
      note: baseNote ? `${prefix} - ${baseNote}` : prefix,
      recurringBaseNote: baseNote,
      recurring: true,
      autoAdded: true,
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      deleted: false,
      userId: uid,
    }]
  })
}

export function getDueAutoSalary({ transactions, settings, uid, now = new Date() }) {
  const { autoSalary, salaryDay, salaryAccountId, monthlyIncome } = settings
  if (!autoSalary || !salaryDay || !salaryAccountId || !monthlyIncome) return null
  // JSave automations run when the app opens. Catch up after the configured day
  // so users do not miss a month simply because they did not open it that day.
  if (now.getDate() < Number(salaryDay)) return null

  const monthKey = localMonthKey(now)
  if (settings.lastAutoSalaryMonth === monthKey) return null

  const id = `auto-salary-${monthKey}`
  const alreadyExists = transactions.some(tx =>
    tx.id === id || (tx.autoAdded && tx.category === 'catSalary' && tx.date?.startsWith(monthKey))
  )
  if (alreadyExists) return { transaction: null, monthKey }

  return {
    monthKey,
    transaction: {
      type: 'income',
      amount: Number(monthlyIncome),
      category: 'catSalary',
      accountId: salaryAccountId,
      date: `${monthKey}-${String(salaryDay).padStart(2, '0')}`,
      note: 'Auto salary',
      autoAdded: true,
      userId: uid,
      id,
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      deleted: false,
    },
  }
}
