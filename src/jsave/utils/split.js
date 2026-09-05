export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function allocateEqualShares(total, count) {
  const people = Math.max(2, Math.floor(Number(count) || 2))
  const cents = Math.max(0, Math.round((Number(total) || 0) * 100))
  const base = Math.floor(cents / people)
  const remainder = cents - base * people
  return Array.from({ length: people }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100)
}

export function customSplitRemaining(total, shares) {
  return roundMoney(Number(total) - shares.reduce((sum, share) => sum + (Number(share) || 0), 0))
}

export function isCustomSplitValid(total, shares) {
  return Number(total) > 0
    && shares.every(share => {
      const amount = Number(share)
      return Number.isFinite(amount) && amount >= 0 && Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-8
    })
    && customSplitRemaining(total, shares) === 0
}
