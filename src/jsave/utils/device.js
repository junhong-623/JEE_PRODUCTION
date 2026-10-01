export function isIPhoneDevice(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  return /\biPhone\b/i.test(userAgent)
}
