import { toLocalDateString } from '../utils/date'

function safeCsvCell(value) {
  if (value == null) return ''
  let text = String(value)
  // Prevent spreadsheet formula execution when users open their own notes in Excel.
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function buildTransactionsCsv({ transactions, accounts, currency }) {
  const accountNames = new Map(accounts.map(account => [account.id, account.name]))
  const headings = [
    'id', 'date', 'type', 'category', 'amount', 'currency',
    'account', 'fromAccount', 'toAccount', 'note', 'recurring', 'createdAt',
  ]
  const rows = [...transactions]
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(transaction => [
      transaction.id,
      transaction.date,
      transaction.type,
      transaction.category,
      transaction.amount,
      currency,
      accountNames.get(transaction.accountId) || '',
      accountNames.get(transaction.fromAccountId) || '',
      accountNames.get(transaction.toAccountId) || '',
      transaction.note || '',
      transaction.recurring ? 'true' : 'false',
      transaction.createdAt ? new Date(transaction.createdAt).toISOString() : '',
    ])

  return [headings, ...rows]
    .map(row => row.map(safeCsvCell).join(','))
    .join('\r\n')
}

export function downloadTransactionsCsv(data) {
  const csv = buildTransactionsCsv(data)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `jsave-transactions-${toLocalDateString()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
