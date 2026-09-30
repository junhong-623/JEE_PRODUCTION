import { describe, expect, it } from 'vitest'
import { monthlyInstallmentTrend } from '../../src/jsave/utils/installmentTrend'

describe('monthly installment trend', () => {
  it('separates scheduled installments, recorded spending, and newly purchased plans', () => {
    const items = [
      { id: 'phone', purchaseDate: '2026-07-10', installmentPlan: { installments: [
        { dueDate: '2026-07-10', amount: 100 }, { dueDate: '2026-08-10', amount: 100 }, { dueDate: '2026-09-10', amount: 100 },
      ] } },
      { id: 'car', purchaseDate: '2025-01-01', installmentPlan: { installments: [
        { dueDate: '2026-08-01', amount: 877 }, { dueDate: '2026-09-01', amount: 877 },
      ] } },
    ]
    const transactions = [
      { type: 'expense', installmentItemId: 'phone', date: '2026-08-12', amount: 100 },
      { type: 'expense', installmentItemId: 'car', date: '2026-09-02', amount: 877 },
      { type: 'transfer', installmentItemId: 'phone', date: '2026-09-20', amount: 100 },
      { type: 'expense', installmentItemId: 'deleted', date: '2026-09-02', amount: 500 },
    ]
    const trend = monthlyInstallmentTrend(items, transactions, new Date(2026, 8, 30), 3)
    expect(trend).toEqual([
      { key: '2026-07', scheduled: 100, recorded: 0, newPlans: 1 },
      { key: '2026-08', scheduled: 977, recorded: 100, newPlans: 0 },
      { key: '2026-09', scheduled: 977, recorded: 877, newPlans: 0 },
    ])
  })
})
