import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../../src/jsave/App.css', import.meta.url), 'utf8')
const html = readFileSync(new URL('../../jsave.html', import.meta.url), 'utf8')

describe('JSave mobile form controls', () => {
  it('keeps editable controls at the iOS focus-safe font size', () => {
    expect(css).toContain("input:not([type='checkbox'])")
    expect(css).toContain('.jsave-root select')
    expect(css).toContain('.jsave-root textarea')
    expect(css).toContain('font-size: 16px !important')
  })

  it('does not disable user zoom in the viewport', () => {
    expect(html).not.toMatch(/user-scalable\s*=\s*no/i)
    expect(html).not.toMatch(/maximum-scale\s*=\s*1/i)
  })
})
