import { describe, expect, it } from 'vitest'
import { needsCurrencyOnboarding } from '../../src/jsave/utils/onboarding'

describe('JSave first-run setup timing', () => {
  it('opens immediately for a user created in the current login flow', () => {
    expect(needsCurrencyOnboarding({
      uid: 'new-user',
      newUserUid: 'new-user',
      preferencesReady: false,
      onboardingCompleted: false,
    })).toBe(true)
  })

  it('waits for stored preferences for a returning login', () => {
    expect(needsCurrencyOnboarding({
      uid: 'returning-user',
      newUserUid: null,
      preferencesReady: false,
      onboardingCompleted: false,
    })).toBe(false)
  })

  it('does not reopen after setup is complete', () => {
    expect(needsCurrencyOnboarding({
      uid: 'returning-user',
      newUserUid: null,
      preferencesReady: true,
      onboardingCompleted: true,
    })).toBe(false)
  })
})
