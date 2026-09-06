import { describe, expect, it } from 'vitest'
import { SUPPORTED_CURRENCIES, currencyFractionDigits, currencyName, currencySymbol, formatCurrency } from '../../src/jsave/utils/currency'

describe('JSave currency helpers', () => {
  it('includes the main currencies needed by regional and international users', () => {
    expect(SUPPORTED_CURRENCIES).toEqual(expect.arrayContaining(['MYR', 'USD', 'SGD', 'CNY', 'JPY', 'IDR']))
  })

  it('uses the selected currency instead of a hard-coded ringgit symbol', () => {
    expect(formatCurrency(12.5, 'USD')).toContain('$')
    expect(formatCurrency(12.5, 'CNY', 'zh')).toContain('¥')
    expect(currencySymbol('MYR')).toBe('RM')
  })

  it('returns a readable localized currency name', () => {
    expect(currencyName('CNY', 'en')).toMatch(/yuan|renminbi/i)
    expect(currencyName('CNY', 'zh')).toContain('人民币')
  })

  it('respects currencies that do not normally use decimal places', () => {
    expect(currencyFractionDigits('JPY')).toBe(0)
    expect(formatCurrency(1200, 'JPY')).not.toContain('.')
  })
})
