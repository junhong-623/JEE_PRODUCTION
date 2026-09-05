import { describe, expect, it } from 'vitest'
import { buildItemEntries, itemCostPerDay } from '../../src/jsave/utils/itemGroups'

describe('JSave item groups', () => {
  const now = new Date(2026, 0, 11, 12, 0)

  it('keeps each component purchase date in the combined daily cost', () => {
    const items = [
      { id: 'pc', kind: 'group', name: 'Computer' },
      { id: 'base', parentItemId: 'pc', cost: 1000, purchaseDate: '2026-01-01' },
      { id: 'ram', parentItemId: 'pc', cost: 100, purchaseDate: '2026-01-06' },
    ]
    const [group] = buildItemEntries(items, now)
    expect(group.members).toHaveLength(2)
    expect(group.totalCost).toBe(1100)
    expect(group.activeTotalCost).toBe(1100)
    expect(group.cpd).toBe(120)
  })

  it('keeps lifetime cost while excluding sold and retired components from active cost', () => {
    const items = [
      { id: 'pc', kind: 'group', name: 'Computer' },
      { id: 'base', parentItemId: 'pc', cost: 1000, purchaseDate: '2026-01-01', status: 'active' },
      { id: 'ram', parentItemId: 'pc', cost: 100, purchaseDate: '2026-01-06', status: 'sold', saleDate: '2026-01-10', salePrice: 60 },
      { id: 'ssd', parentItemId: 'pc', cost: 200, purchaseDate: '2026-01-07', status: 'retired', retiredDate: '2026-01-09' },
    ]
    const [group] = buildItemEntries(items, now)
    expect(group.totalCost).toBe(1300)
    expect(group.activeTotalCost).toBe(1000)
    expect(group.activeMembers.map(item => item.id)).toEqual(['base'])
  })

  it('shows orphaned items instead of hiding them', () => {
    const orphan = { id: 'ssd', parentItemId: 'missing', cost: 200, purchaseDate: '2026-01-01' }
    expect(buildItemEntries([orphan], now)).toHaveLength(1)
    expect(itemCostPerDay(orphan, now)).toBe(20)
  })
})
