import { describe, expect, it } from 'vitest'
import { getDueAutoSalary, getDueRecurringTransactions } from '../../src/jsave/services/automation'

const now = new Date(2026, 8, 4, 8, 0)

describe('JSave automatic transactions', () => {
  it('generates the same recurring id on every device', () => {
    const input = {
      transactions: [{
        id: 'source', type: 'expense', amount: 19.9, category: 'catBills', accountId: 'bank',
        date: '2026-08-04', note: 'Aug - Music', recurringBaseNote: 'Music', recurring: true,
      }],
      uid: 'user-a',
      language: 'en',
      now,
    }
    const first = getDueRecurringTransactions(input)
    const second = getDueRecurringTransactions(input)
    expect(first).toHaveLength(1)
    expect(second[0].id).toBe(first[0].id)
    expect(first[0]).toMatchObject({ date: '2026-09-04', note: 'Sep - Music', userId: 'user-a' })
  })

  it('does not regenerate a recurring transaction already present this month', () => {
    const transactions = [
      { type: 'expense', amount: 10, category: 'catBills', accountId: 'bank', date: '2026-08-01', recurringBaseNote: 'Cloud', recurring: true },
      { type: 'expense', amount: 10, category: 'catBills', accountId: 'bank', date: '2026-09-02', recurringBaseNote: 'Cloud', recurring: true },
    ]
    expect(getDueRecurringTransactions({ transactions, uid: 'user-a', now })).toEqual([])
  })

  it('creates one deterministic salary transaction on the configured day', () => {
    const settings = {
      autoSalary: true, salaryDay: 4, salaryAccountId: 'bank', monthlyIncome: 5000,
    }
    const due = getDueAutoSalary({ transactions: [], settings, uid: 'user-a', now })
    expect(due.monthKey).toBe('2026-09')
    expect(due.transaction).toMatchObject({
      id: 'auto-salary-2026-09', date: '2026-09-04', amount: 5000, userId: 'user-a',
    })
    expect(getDueAutoSalary({
      transactions: [due.transaction], settings, uid: 'user-a', now,
    }).transaction).toBeNull()
  })

  it('catches up salary when the app is opened after the configured day', () => {
    const settings = {
      autoSalary: true, salaryDay: 4, salaryAccountId: 'bank', monthlyIncome: 5000,
    }
    const due = getDueAutoSalary({
      transactions: [], settings, uid: 'user-a', now: new Date(2026, 8, 9, 18, 0),
    })
    expect(due.transaction).toMatchObject({
      id: 'auto-salary-2026-09', date: '2026-09-04', amount: 5000,
    })
  })

  it('waits until the configured salary day and respects a skipped month', () => {
    const settings = {
      autoSalary: true, salaryDay: 10, salaryAccountId: 'bank', monthlyIncome: 5000,
    }
    expect(getDueAutoSalary({
      transactions: [], settings, uid: 'user-a', now: new Date(2026, 8, 9, 18, 0),
    })).toBeNull()
    expect(getDueAutoSalary({
      transactions: [], settings: { ...settings, salaryDay: 4, lastAutoSalaryMonth: '2026-09' },
      uid: 'user-a', now: new Date(2026, 8, 9, 18, 0),
    })).toBeNull()
  })
})
