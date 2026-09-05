import { describe, expect, it } from 'vitest'
import { isSingleEmoji, singleEmoji } from '../../src/jsave/utils/emoji'

describe('JSave emoji validation', () => {
  it('accepts one visible emoji, including joined and flag emoji', () => {
    expect(isSingleEmoji('📷')).toBe(true)
    expect(isSingleEmoji('👨‍👩‍👧‍👦')).toBe(true)
    expect(isSingleEmoji('🇲🇾')).toBe(true)
    expect(singleEmoji('  🎒  ')).toBe('🎒')
  })

  it('rejects text, multiple emoji and mixed content', () => {
    expect(isSingleEmoji('camera')).toBe(false)
    expect(isSingleEmoji('📷🎒')).toBe(false)
    expect(isSingleEmoji('A📷')).toBe(false)
    expect(isSingleEmoji('')).toBe(false)
  })
})
