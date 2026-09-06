export function needsCurrencyOnboarding({
  uid,
  newUserUid,
  preferencesReady,
  onboardingCompleted,
}) {
  if (!uid) return false
  if (newUserUid === uid) return true
  return Boolean(preferencesReady && !onboardingCompleted)
}
