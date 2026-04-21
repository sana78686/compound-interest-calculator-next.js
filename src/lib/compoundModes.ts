/** UI labels + encoding for interest-rate period and compounding frequency. */

export type InterestRatePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'

export type CompoundingFrequency =
  | 'daily365'
  | 'daily360'
  | 'semiweekly104'
  | 'weekly52'
  | 'biweekly26'
  | 'semimonthly24'
  | 'monthly12'
  | 'bimonthly6'
  | 'quarterly4'
  | 'halfyearly2'
  | 'yearly1'

/** Simple annualization of the entered rate into a nominal annual % (APR-style). */
export function nominalAnnualPercentFromInput(ratePercent: number, period: InterestRatePeriod): number {
  const r = Math.max(0, ratePercent)
  switch (period) {
    case 'annual':
      return r
    case 'monthly':
      return r * 12
    case 'quarterly':
      return r * 4
    case 'weekly':
      return r * 52
    case 'daily':
      return r * 365
    default:
      return r
  }
}

export const INTEREST_RATE_PERIOD_OPTIONS: { value: InterestRatePeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
]

/** `label` = full description; `labelShort` = compact text for reference-style dropdowns. */
export const COMPOUNDING_OPTIONS: { value: CompoundingFrequency; label: string; labelShort: string }[] = [
  { value: 'daily365', label: 'Daily (365/yr)', labelShort: 'Daily' },
  { value: 'daily360', label: 'Daily (360/yr)', labelShort: 'Daily (360)' },
  { value: 'semiweekly104', label: 'Semi-Weekly (104/yr)', labelShort: 'Semi-Weekly' },
  { value: 'weekly52', label: 'Weekly (52/yr)', labelShort: 'Weekly' },
  { value: 'biweekly26', label: 'Bi-Weekly (26/yr)', labelShort: 'Bi-Weekly' },
  { value: 'semimonthly24', label: 'Semi-Monthly (24/yr)', labelShort: 'Semi-Monthly' },
  { value: 'monthly12', label: 'Monthly (12/yr)', labelShort: 'Monthly' },
  { value: 'bimonthly6', label: 'Bi-Monthly (6/yr)', labelShort: 'Bi-Monthly' },
  { value: 'quarterly4', label: 'Quarterly (4/yr)', labelShort: 'Quarterly' },
  { value: 'halfyearly2', label: 'Half-Yearly (2/yr)', labelShort: 'Half-Yearly' },
  { value: 'yearly1', label: 'Yearly (1/yr)', labelShort: 'Yearly' },
]

export function periodsPerYear(mode: CompoundingFrequency): number {
  const map: Record<CompoundingFrequency, number> = {
    daily365: 365,
    daily360: 360,
    semiweekly104: 104,
    weekly52: 52,
    biweekly26: 26,
    semimonthly24: 24,
    monthly12: 12,
    bimonthly6: 6,
    quarterly4: 4,
    halfyearly2: 2,
    yearly1: 1,
  }
  return map[mode]
}

/** APY from nominal annual % compounded n times per year. */
export function apyFromNominal(nominalAnnualPercent: number, nPerYear: number): number {
  const r = nominalAnnualPercent / 100
  return ((1 + r / nPerYear) ** nPerYear - 1) * 100
}
