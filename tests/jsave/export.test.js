import { describe, expect, it } from 'vitest'
import { buildTransactionsCsv } from '../../src/jsave/services/export'

describe('JSave CSV export', () => {
  it('exports account names and escapes spreadsheet formulas', () => {
    const csv = buildTransactionsCsv({
      currency: 'MYR',
      accounts: [{ id: 'bank', name: 'Main, Bank' }],
      transactions: [{
        id: 'tx-1', date: '2026-09-04', type: 'expense', category: 'catFood',
        amount: 12.5, accountId: 'bank', note: '=IMPORTXML("bad")', recurring: false,
      }],
    })
    expect(csv).toContain('"Main, Bank"')
    expect(csv).toContain('"\'=IMPORTXML(""bad"")"')
  })
})
