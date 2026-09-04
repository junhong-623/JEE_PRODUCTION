export function toLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function localDateDaysAgo(days, from = new Date()) {
  const date = new Date(from)
  date.setDate(date.getDate() - days)
  return toLocalDateString(date)
}

export function localMonthKey(date = new Date()) {
  return toLocalDateString(date).slice(0, 7)
}

export function parseLocalDateString(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function calendarDayDifference(later, earlier) {
  const laterDate = typeof later === 'string' ? parseLocalDateString(later) : later
  const earlierDate = typeof earlier === 'string' ? parseLocalDateString(earlier) : earlier
  const laterUtc = Date.UTC(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate())
  const earlierUtc = Date.UTC(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate())
  return Math.round((laterUtc - earlierUtc) / 86400000)
}
