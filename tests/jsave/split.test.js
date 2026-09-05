import { describe, expect, it } from 'vitest'
import { allocateEqualShares, customSplitRemaining, fillSplitRemainder, isCustomSplitValid } from '../../src/jsave/utils/split'

describe('JSave bill splitting', () => {
  it('allocates rounding cents without losing part of the bill', () => {
    const shares = allocateEqualShares(100, 3)
    expect(shares).toEqual([33.34, 33.33, 33.33])
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(100)
  })

  it('reports the unassigned amount for a custom split', () => {
    expect(customSplitRemaining(168, [50, 40, 40, 30])).toBe(8)
    expect(customSplitRemaining(168, [58, 40, 40, 30])).toBe(0)
  })

  it('fills the selected person with the exact remaining amount', () => {
    expect(fillSplitRemainder(168, [50, 40, 40, 0], 3)).toEqual([50, 40, 40, 38])
    expect(fillSplitRemainder(100, [33.33, 33.33, 0], 2)).toEqual([33.33, 33.33, 33.34])
  })

  it('accepts only a complete non-negative custom split', () => {
    expect(isCustomSplitValid(168, [58, 40, 40, 30])).toBe(true)
    expect(isCustomSplitValid(168, [50, 40, 40, 30])).toBe(false)
    expect(isCustomSplitValid(168, [198, -10, -10, -10])).toBe(false)
    expect(isCustomSplitValid(1, [0.333, 0.667])).toBe(false)
  })
})
