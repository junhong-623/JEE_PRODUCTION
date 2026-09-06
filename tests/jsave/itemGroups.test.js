import { describe, expect, it } from 'vitest'
import { buildItemEntries, getDashboardItem, itemCostPerDay } from '../../src/jsave/utils/itemGroups'

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

  it('uses the chosen item on home, including a component inside a group', () => {
    const items = [
      { id: 'pc', kind: 'group', name: 'Computer', createdAt: 1 },
      { id: 'ram', parentItemId: 'pc', name: 'RAM', cost: 100, purchaseDate: '2026-01-06', createdAt: 2 },
    ]

    expect(getDashboardItem(items, 'pc', false, now)).toMatchObject({ id: 'pc', isGroup: true })
    expect(getDashboardItem(items, 'ram', false, now)).toMatchObject({ id: 'ram', isGroup: false, cpd: 20 })
  })

  it('falls back to the newest active top-level item only when requested', () => {
    const items = [
      { id: 'older', name: 'Older', cost: 100, purchaseDate: '2026-01-01', createdAt: 1 },
      { id: 'newer', name: 'Newer', cost: 50, purchaseDate: '2026-01-06', createdAt: 2 },
      { id: 'sold', name: 'Sold', cost: 500, purchaseDate: '2026-01-01', status: 'sold', saleDate: '2026-01-10', createdAt: 3 },
    ]

    expect(getDashboardItem(items, null, false, now)).toBeNull()
    expect(getDashboardItem(items, null, true, now)?.id).toBe('newer')
  })
})
