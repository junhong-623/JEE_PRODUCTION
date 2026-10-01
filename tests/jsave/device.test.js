import { describe, expect, it } from 'vitest'
import { isIPhoneDevice } from '../../src/jsave/utils/device'

describe('iPhone shortcut availability', () => {
  it('recognizes iPhone Safari and other iPhone browsers', () => {
    expect(isIPhoneDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')).toBe(true)
    expect(isIPhoneDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 CriOS/127.0.0.0 Mobile/15E148 Safari/604.1')).toBe(true)
  })

  it('does not offer the download on iPad, desktop or Android', () => {
    expect(isIPhoneDevice('Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')).toBe(false)
    expect(isIPhoneDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15')).toBe(false)
    expect(isIPhoneDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/127.0 Mobile Safari/537.36')).toBe(false)
  })
})
