import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_COVER_SOURCE_MB, uploadPreparedCover, validateCoverSource } from '../../src/jsave/services/goalCover'

describe('JSave cover photo validation', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('allows phone photos up to the documented source limit', () => {
    expect(() => validateCoverSource({ type: 'image/jpeg', size: MAX_COVER_SOURCE_MB * 1024 * 1024 })).not.toThrow()
  })

  it('distinguishes oversized and invalid source files', () => {
    expect(() => validateCoverSource({ type: 'image/jpeg', size: (MAX_COVER_SOURCE_MB + 1) * 1024 * 1024 })).toThrow('cover-too-large')
    expect(() => validateCoverSource({ type: 'application/pdf', size: 1000 })).toThrow('cover-invalid')
  })

  it('uploads the compressed cover to an account-scoped Cloudinary folder', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        public_id: 'jsave/user-1/items/item-1/generated-id',
        secure_url: 'https://res.cloudinary.com/db2ixn8zh/image/upload/v1/jsave/user-1/items/item-1/generated-id.webp',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await uploadPreparedCover('user-1', 'items', 'item-1', new Blob(['photo'], { type: 'image/webp' }))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.cloudinary.com/v1_1/db2ixn8zh/image/upload')
    expect(options.method).toBe('POST')
    expect(options.body.get('upload_preset')).toBe('H-Agency')
    expect(options.body.get('folder')).toBe('jsave/user-1/items/item-1')
    expect(result.coverPath).toBe('jsave/user-1/items/item-1/generated-id')
    expect(result.coverUrl).toContain('res.cloudinary.com/db2ixn8zh')
  })
})
