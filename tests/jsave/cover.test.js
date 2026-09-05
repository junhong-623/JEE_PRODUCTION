import { describe, expect, it } from 'vitest'
import { MAX_COVER_SOURCE_MB, validateCoverSource } from '../../src/jsave/services/goalCover'

describe('JSave cover photo validation', () => {
  it('allows phone photos up to the documented source limit', () => {
    expect(() => validateCoverSource({ type: 'image/jpeg', size: MAX_COVER_SOURCE_MB * 1024 * 1024 })).not.toThrow()
  })

  it('distinguishes oversized and invalid source files', () => {
    expect(() => validateCoverSource({ type: 'image/jpeg', size: (MAX_COVER_SOURCE_MB + 1) * 1024 * 1024 })).toThrow('cover-too-large')
    expect(() => validateCoverSource({ type: 'application/pdf', size: 1000 })).toThrow('cover-invalid')
  })
})
