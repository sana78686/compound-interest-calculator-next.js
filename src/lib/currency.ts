/** Supported display currencies for the compound interest calculator (math is unit-agnostic). */

export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'INR', 'JPY'] as const
export type CurrencyCode = (typeof CURRENCY_CODES)[number]

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
]

const LOCALE: Record<CurrencyCode, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  JPY: 'ja-JP',
}

export function isCurrencyCode(v: string | null | undefined): v is CurrencyCode {
  return v != null && (CURRENCY_CODES as readonly string[]).includes(v)
}

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCY_OPTIONS.find((c) => c.code === code)?.symbol ?? code
}

/** Format a numeric amount in the selected currency. */
export function formatCurrencyAmount(value: number, code: CurrencyCode): string {
  const max = code === 'JPY' ? 0 : 2
  return value.toLocaleString(LOCALE[code], {
    style: 'currency',
    currency: code,
    maximumFractionDigits: max,
    minimumFractionDigits: code === 'JPY' ? 0 : undefined,
  })
}

/** Short axis label (e.g. "£1.2k") for charts. */
export function formatCurrencyAxisCompact(value: number, code: CurrencyCode): string {
  const sym = currencySymbol(code)
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1000) return `${sym}${(value / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return formatCurrencyAmount(value, code)
}
