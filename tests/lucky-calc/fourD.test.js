import { describe, expect, it } from 'vitest'
import {
  decodeHistoryRows,
  getPayout,
  historyShardUrl,
  isValidFourD,
  sanitizeFourDInput,
  STRAIGHT_PAYOUT,
  summarizeHistory,
} from '../../src/lucky-calc/lib/fourD'

describe('4D input', () => {
  it('preserves leading zeroes and removes non-digits', () => {
    expect(sanitizeFourDInput(' 00-63x')).toBe('0063')
    expect(isValidFourD('0063')).toBe(true)
    expect(isValidFourD('63')).toBe(false)
    expect(historyShardUrl('0063')).toBe('/luck-calc/data/history/00.json')
  })
})

describe('straight-play payout table', () => {
  const expected = {
    big: { first: 2500, second: 1000, third: 500, special: 180, consolation: 60 },
    small: { first: 3500, second: 2000, third: 1000, special: null, consolation: null },
  }

  it('matches the verified official table', () => {
    expect(STRAIGHT_PAYOUT).toEqual(expected)
  })

  for (const [betType, prizes] of Object.entries(expected)) {
    for (const [prize, unitPrize] of Object.entries(prizes)) {
      it(`${betType} ${prize}`, () => {
        const result = getPayout({ betType, prize, amount: 2 })
        if (unitPrize == null) expect(result.error).toMatch(/Small/)
        else expect(result).toMatchObject({ stake: 2, unitPrize, payout: unitPrize * 2 })
      })
    }
  }

  it('rejects zero and negative stakes', () => {
    expect(getPayout({ betType: 'big', prize: 'first', amount: 0 }).error).toBeTruthy()
    expect(getPayout({ betType: 'big', prize: 'first', amount: -1 }).error).toBeTruthy()
  })
})

describe('history records', () => {
  const decoded = decodeHistoryRows([
    ['2026-09-06', 'm', '1', '419'],
    ['2023-12-20', 't', 's', '6000'],
  ])

  it('decodes the compact data schema', () => {
    expect(decoded[0]).toEqual({ date: '2026-09-06', operator: 'magnum', prize: 'first', drawNo: '419' })
  })

  it('summarizes records', () => {
    expect(summarizeHistory(decoded)).toMatchObject({
      total: 2,
      lastWin: '2026-09-06',
      byPrize: { first: 1, special: 1 },
      byOperator: { magnum: 1, sportstoto: 1 },
    })
  })
})

