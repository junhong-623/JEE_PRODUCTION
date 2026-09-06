import { calendarDayDifference } from './date'

export function isItemGroup(item) {
  return item?.kind === 'group'
}

export function itemStatus(item) {
  if (item?.status) return item.status
  if (item?.disposeDate) return 'retired'
  return 'active'
}

export function itemEndDate(item) {
  return item?.retiredDate ?? item?.saleDate ?? item?.disposeDate ?? null
}

export function itemDaysOwned(item, now = new Date()) {
  if (!item?.purchaseDate) return 1
  return Math.max(1, calendarDayDifference(itemEndDate(item) || now, item.purchaseDate))
}

export function itemCostPerDay(item, now = new Date()) {
  return (Number(item?.cost) || 0) / itemDaysOwned(item, now)
}

export function buildItemEntries(items, now = new Date()) {
  const groups = items.filter(isItemGroup)
  const regularItems = items.filter(item => !isItemGroup(item))
  const groupIds = new Set(groups.map(group => group.id))
  const groupedIds = new Set()

  const groupEntries = groups.map(group => {
    const members = regularItems.filter(item => item.parentItemId === group.id)
    const activeMembers = members.filter(member => itemStatus(member) === 'active')
    members.forEach(member => groupedIds.add(member.id))
    return {
      ...group,
      isGroup: true,
      members,
      activeMembers,
      totalCost: members.reduce((sum, member) => sum + (Number(member.cost) || 0), 0),
      activeTotalCost: activeMembers.reduce((sum, member) => sum + (Number(member.cost) || 0), 0),
      cpd: members.reduce((sum, member) => sum + itemCostPerDay(member, now), 0),
    }
  })

  const ungroupedEntries = regularItems
    .filter(item => !groupedIds.has(item.id) || (item.parentItemId && !groupIds.has(item.parentItemId)))
    .map(item => ({
      ...item,
      isGroup: false,
      members: [],
      activeMembers: itemStatus(item) === 'active' ? [item] : [],
      totalCost: Number(item.cost) || 0,
      activeTotalCost: itemStatus(item) === 'active' ? (Number(item.cost) || 0) : 0,
      cpd: itemCostPerDay(item, now),
    }))

  return [...groupEntries, ...ungroupedEntries]
}

function regularItemEntry(item, now) {
  const active = itemStatus(item) === 'active'
  return {
    ...item,
    isGroup: false,
    members: [],
    activeMembers: active ? [item] : [],
    totalCost: Number(item.cost) || 0,
    activeTotalCost: active ? (Number(item.cost) || 0) : 0,
    cpd: itemCostPerDay(item, now),
  }
}

export function getDashboardItem(items = [], featuredItemId = null, allowFallback = false, now = new Date()) {
  const entries = buildItemEntries(items, now)

  if (featuredItemId) {
    const topLevelEntry = entries.find(item => item.id === featuredItemId)
    if (topLevelEntry) return topLevelEntry

    const groupedItem = items.find(item => item.id === featuredItemId && !isItemGroup(item))
    if (groupedItem) return regularItemEntry(groupedItem, now)
  }

  if (!allowFallback || entries.length === 0) return null

  const newestFirst = (left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0)
  const activeEntries = entries.filter(item => item.isGroup
    ? item.activeMembers.length > 0
    : itemStatus(item) === 'active')

  return [...(activeEntries.length ? activeEntries : entries)].sort(newestFirst)[0] || null
}
