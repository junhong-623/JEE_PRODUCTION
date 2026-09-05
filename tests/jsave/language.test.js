import { describe, expect, it } from 'vitest'
import { languageFromPath } from '../../src/jsave/contexts/LangContext'

describe('JSave localized routes', () => {
  it('recognizes English and Chinese page paths', () => {
    expect(languageFromPath('/en/')).toBe('en')
    expect(languageFromPath('/en/#dashboard')).toBe('en')
    expect(languageFromPath('/zh/')).toBe('zh')
    expect(languageFromPath('/zh')).toBe('zh')
  })

  it('does not mistake ordinary app paths for a language', () => {
    expect(languageFromPath('/')).toBeNull()
    expect(languageFromPath('/settings')).toBeNull()
    expect(languageFromPath('/english')).toBeNull()
  })
})
