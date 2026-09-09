import { describe, expect, it } from 'vitest'
import { calculateFinance, evaluateExpression, scoreNiuNiu } from '../../src/lucky-calc/lib/calculators'

describe('expression calculator', () => {
  it('respects arithmetic precedence', () => {
    expect(evaluateExpression('2 + 3 * 4')).toEqual({ value: 14 })
  })

  it('rejects non-arithmetic input and non-finite results', () => {
    expect(evaluateExpression('alert(1)').error).toBeTruthy()
    expect(evaluateExpression('1 / 0').error).toBeTruthy()
  })
})

describe('finance calculators', () => {
  it('handles a zero-interest reducing-balance loan', () => {
    expect(calculateFinance('loan', 12000, 0, 1)).toMatchObject({ monthly: 1000, total: 12000, interest: 0 })
  })

  it('distinguishes flat-rate and reducing-balance loans', () => {
    const flat = calculateFinance('flat', 100000, 4, 5)
    const reducing = calculateFinance('loan', 100000, 4, 5)
    expect(flat.interest).toBe(20000)
    expect(reducing.interest).toBeLessThan(flat.interest)
  })

  it('rejects invalid money inputs', () => {
    expect(calculateFinance('loan', 0, 4, 5).error).toBeTruthy()
    expect(calculateFinance('loan', 1000, -1, 5).error).toBeTruthy()
    expect(calculateFinance('loan', 1000, 1, 0).error).toBeTruthy()
  })
})

describe('Niu Niu scoring', () => {
  it('scores a five-flower hand', () => {
    const cards = ['J', 'Q', 'K', '10', 'J'].map(rank => ({ rank, val: 10, suit: '♠' }))
    expect(scoreNiuNiu(cards)).toMatchObject({ type: '五花牛', score: 10 })
  })
})

