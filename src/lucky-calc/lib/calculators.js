export function calculateFinance(mode, principal, annualRate, years) {
  const amount = Number(principal)
  const rate = Number(annualRate)
  const duration = Number(years)

  if (!Number.isFinite(amount) || amount <= 0) return { error: '金额必须大于 0' }
  if (!Number.isFinite(rate) || rate < 0) return { error: '年利率不能为负数' }
  if (!Number.isFinite(duration) || duration <= 0) return { error: '年限必须大于 0' }

  const decimalRate = rate / 100

  if (mode === 'loan') {
    const months = duration * 12
    const monthlyRate = decimalRate / 12
    const monthly = monthlyRate === 0
      ? amount / months
      : amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
    const total = monthly * months
    return { mode, monthly, total, interest: total - amount }
  }

  if (mode === 'flat') {
    const interest = amount * decimalRate * duration
    const total = amount + interest
    return { mode, monthly: total / (duration * 12), total, interest }
  }

  if (mode === 'fd') {
    const final = amount * Math.pow(1 + decimalRate, duration)
    return { mode, final, earned: final - amount }
  }

  if (mode === 'simple') {
    const interest = amount * decimalRate * duration
    return { mode, total: amount + interest, interest }
  }

  return { error: '不支持的计算方式' }
}

export function evaluateExpression(expression) {
  const input = String(expression ?? '').trim()
  if (!input || !/^[0-9+\-*/.()\s]+$/.test(input)) return { error: '算式无效' }
  try {
    // The allowlist above restricts the expression to numbers and arithmetic tokens.
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${input})`)()
    if (!Number.isFinite(value)) return { error: '算式无效' }
    return { value: Number(value.toFixed(10)) }
  } catch {
    return { error: '算式无效' }
  }
}

export const CARD_VALUES = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 10, Q: 10, K: 10 }
export const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const SUITS = ['♠', '♥', '♦', '♣']

export function scoreNiuNiu(cards) {
  if (!Array.isArray(cards) || cards.length !== 5) return null
  const values = cards.map(card => card.val)
  if (cards.every(card => card.val === 10)) return { type: '五花牛', score: 10, level: 'max' }

  for (let i = 0; i < 3; i += 1) {
    for (let j = i + 1; j < 4; j += 1) {
      for (let k = j + 1; k < 5; k += 1) {
        if ((values[i] + values[j] + values[k]) % 10 !== 0) continue
        const rest = values.filter((_, index) => ![i, j, k].includes(index))
        const rawScore = (rest[0] + rest[1]) % 10
        const score = rawScore === 0 ? 10 : rawScore
        return {
          type: rawScore === 0 ? '牛牛' : `牛${rawScore}`,
          score,
          level: score === 10 ? 'max' : score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low',
        }
      }
    }
  }

  return { type: '没牛', score: 0, level: 'none' }
}

export function bestWithSwap(cards) {
  const swappable = cards.reduce((indices, card, index) => {
    if (card.val === 3 || card.val === 6) indices.push(index)
    return indices
  }, [])
  const subsets = [[]]
  for (const index of swappable) {
    const size = subsets.length
    for (let i = 0; i < size; i += 1) subsets.push([...subsets[i], index])
  }

  let best = { result: scoreNiuNiu(cards), swapped: [], cards }
  for (const subset of subsets) {
    const candidate = cards.map((card, index) => {
      if (!subset.includes(index)) return card
      const val = card.val === 3 ? 6 : 3
      return { ...card, val, rank: String(val), swappedFrom: card.rank }
    })
    const result = scoreNiuNiu(candidate)
    if (result.score > best.result.score) best = { result, swapped: subset, cards: candidate }
  }
  return best
}

