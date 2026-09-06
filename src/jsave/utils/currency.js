export const SUPPORTED_CURRENCIES = [
  'MYR', 'USD', 'SGD', 'CNY', 'EUR', 'GBP', 'JPY', 'AUD',
  'CAD', 'HKD', 'TWD', 'THB', 'IDR', 'PHP', 'INR',
]

export function currencyLocale(lang = 'en') {
  return lang === 'zh' ? 'zh-CN' : 'en-MY'
}

export function currencySymbol(currency = 'MYR', lang = 'en') {
  try {
    return new Intl.NumberFormat(currencyLocale(lang), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0).find(part => part.type === 'currency')?.value || currency
  } catch {
    return currency
  }
}

export function currencyName(currency, lang = 'en') {
  try {
    return new Intl.DisplayNames([currencyLocale(lang)], { type: 'currency' }).of(currency) || currency
  } catch {
    return currency
  }
}

export function currencyFractionDigits(currency = 'MYR') {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency })
      .resolvedOptions().maximumFractionDigits
  } catch {
    return 2
  }
}

export function formatCurrency(amount, currency = 'MYR', lang = 'en', options = {}) {
  try {
    return new Intl.NumberFormat(currencyLocale(lang), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      ...options,
    }).format(Number(amount) || 0)
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(options.maximumFractionDigits ?? 2)}`
  }
}
