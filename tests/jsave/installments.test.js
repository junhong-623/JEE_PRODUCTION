import { describe, expect, it } from 'vitest'
import { installmentProgress, makeFixedInstallments, makeInstallments, monthDueDate, totalFutureInstallments, validateInstallmentPlan } from '../../src/jsave/utils/installments'

const phone = {
  id: 'phone', cost: 7000,
  installmentPlan: {
    provider: 'PayLater', upfrontAmount: 0, totalPayable: 7000,
    startDate: '2026-01-31', openingPaidCount: 0,
    installments: makeInstallments(7000, 7, '2026-01-31'),
  },
}

describe('JSave item installments', () => {
  it('keeps month-end due dates and allocates every cent', () => {
    expect(monthDueDate('2026-01-31', 1)).toBe('2026-02-28')
    expect(monthDueDate('2024-01-31', 1)).toBe('2024-02-29')
    expect(monthDueDate('2026-02-30', 0)).toBe('')
    const installments = makeInstallments(7000, 3, '2026-01-31')
    expect(installments.map(row => row.amount)).toEqual([2333.33, 2333.33, 2333.34])
    expect(installments.map(row => row.dueDate)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  })

  it('projects a nine-year monthly payment without requiring an interest rate', () => {
    const installments = makeFixedInstallments(877, 9 * 12, '2026-10-01')
    const totalPayable = installments.reduce((sum, row) => sum + row.amount, 0)
    expect(installments).toHaveLength(108)
    expect(totalPayable).toBe(94716)
    expect(installments[107]).toMatchObject({ dueDate: '2035-09-01', amount: 877 })
    expect(validateInstallmentPlan({ amountMode: 'monthly', monthlyAmount: 877, lastPaymentAmount: '', paymentCount: 108, upfrontAmount: 0, totalPayable, startDate: '2026-10-01', openingPaidCount: 0, installments }, 82400)).toBeNull()
    const adjusted = makeFixedInstallments(877, 108, '2026-10-01', 800)
    expect(adjusted[107].amount).toBe(800)
    expect(adjusted.reduce((sum, row) => sum + row.amount, 0)).toBe(94639)
  })

  it('tracks future payments from linked expenses without counting card repayments', () => {
    const firstCharge = { id: 'charge', type: 'expense', installmentItemId: 'phone', installmentNumber: 1, amount: 1000, accountId: 'card' }
    const cardRepayment = { id: 'repayment', type: 'transfer', amount: 1000, fromAccountId: 'bank', toAccountId: 'card' }
    expect(installmentProgress(phone, [])).toMatchObject({ futureAmount: 7000, paidCount: 0, status: 'notStarted' })
    expect(installmentProgress(phone, [firstCharge, cardRepayment])).toMatchObject({ futureAmount: 6000, paidCount: 1, remainingCount: 6, status: 'active' })
    expect(totalFutureInstallments([phone, { id: 'old', cost: 20 }], [firstCharge, cardRepayment])).toBe(6000)
    expect(installmentProgress(phone, [cardRepayment])).toMatchObject({ futureAmount: 7000, paidCount: 0 })
  })

  it('recalculates after an expense is edited, unlinked or deleted', () => {
    const tx = { id: 'one', type: 'expense', installmentItemId: 'phone', installmentNumber: 2, amount: 1000 }
    expect(installmentProgress(phone, [tx]).next.number).toBe(1)
    expect(installmentProgress(phone, [tx]).futureAmount).toBe(6000)
    expect(installmentProgress(phone, [{ ...tx, type: 'transfer' }]).futureAmount).toBe(7000)
    expect(installmentProgress(phone, [{ ...tx, installmentItemId: null }]).futureAmount).toBe(7000)
    expect(installmentProgress(phone, [tx], tx.id).futureAmount).toBe(7000)
  })

  it('supports past payments without inventing expense transactions', () => {
    const item = { ...phone, installmentPlan: { ...phone.installmentPlan, openingPaidCount: 2 } }
    expect(installmentProgress(item, [])).toMatchObject({ paidCount: 2, futureAmount: 5000, paidAmount: 2000 })
    expect(installmentProgress(item, []).rows[0]).toMatchObject({ opening: true, transaction: null })
  })

  it('rejects invalid plan totals and upfront amounts', () => {
    expect(validateInstallmentPlan(phone.installmentPlan, phone.cost)).toBeNull()
    expect(validateInstallmentPlan({ ...phone.installmentPlan, upfrontAmount: 7100 }, phone.cost)).toBe('amount')
    expect(validateInstallmentPlan({ ...phone.installmentPlan, totalPayable: 6999 }, phone.cost)).toBe('amount')
    expect(validateInstallmentPlan({ ...phone.installmentPlan, totalPayable: 7001 }, phone.cost)).toBe('total')
    expect(validateInstallmentPlan({ ...phone.installmentPlan, openingPaidCount: 8 }, phone.cost)).toBe('opening')
    const wrongOrder = phone.installmentPlan.installments.map(row => ({ ...row }))
    wrongOrder[1].dueDate = wrongOrder[0].dueDate
    expect(validateInstallmentPlan({ ...phone.installmentPlan, installments: wrongOrder }, phone.cost)).toBe('schedule')
  })

  it('keeps a down payment and fees explicit without manufacturing past expenses', () => {
    const installments = makeInstallments(6300, 3, '2026-10-01')
    const item = { id: 'camera', cost: 7000, installmentPlan: { upfrontAmount: 1000, totalPayable: 6300, startDate: '2026-10-01', openingPaidCount: 1, installments } }
    expect(validateInstallmentPlan(item.installmentPlan, item.cost)).toBeNull()
    expect(installmentProgress(item, [])).toMatchObject({ futureAmount: 4200, paidCount: 1 })
  })
})
