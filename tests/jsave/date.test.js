import { describe, expect, it } from 'vitest'
import {
  calendarDayDifference, localDateDaysAgo, localMonthKey, parseLocalDateString, toLocalDateString,
} from '../../src/jsave/utils/date'

describe('JSave local date utilities', () => {
  it('formats local calendar dates without converting through UTC', () => {
    const localMidnight = new Date(2026, 8, 4, 0, 30)
    expect(toLocalDateString(localMidnight)).toBe('2026-09-04')
    expect(localMonthKey(localMidnight)).toBe('2026-09')
  })

  it('subtracts calendar days across month boundaries', () => {
    expect(localDateDaysAgo(1, new Date(2026, 8, 1, 0, 15))).toBe('2026-08-31')
  })

  it('parses date-only strings in local time and compares calendar days', () => {
    const parsed = parseLocalDateString('2026-09-04')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(8)
    expect(parsed.getDate()).toBe(4)
    expect(calendarDayDifference('2026-09-05', '2026-09-01')).toBe(4)
  })
})
