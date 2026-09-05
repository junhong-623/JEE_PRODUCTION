import { describe, expect, it } from 'vitest'
import { preferredGoalsTab } from '../../src/jsave/pages/GoalsPage'

describe('JSave Goals default tab', () => {
  it('opens Things when only item records exist', () => {
    expect(preferredGoalsTab([], [{ id: 'laptop' }])).toBe('things')
  })

  it('keeps Goals first when a savings goal exists', () => {
    expect(preferredGoalsTab([{ id: 'trip' }], [{ id: 'laptop' }])).toBe('goals')
  })

  it('keeps Goals first when both sections are empty', () => {
    expect(preferredGoalsTab([], [])).toBe('goals')
  })
})
