import type { CompoundingFrequency } from '@/lib/compoundInterest'
import type { InterestRatePeriod } from '@/lib/compoundModes'
import { nominalAnnualPercentFromInput } from '@/lib/compoundModes'
import type { CurrencyCode } from '@/lib/currency'
import { isCurrencyCode } from '@/lib/currency'

export type NumericField = number | ''

export type CalculatorFormState = {
  currency: CurrencyCode | ''
  principal: NumericField
  annualRate: NumericField
  /** How the interest rate number should be read (daily / weekly / … / annual). */
  ratePeriod: InterestRatePeriod
  years: NumericField
  extraMonths: NumericField
  compounding: CompoundingFrequency
  monthlyContribution: NumericField
  withdrawalsEnabled: boolean
  monthlyWithdrawal: NumericField
  excludeWeekends: boolean
}

const C_OUT: Record<CompoundingFrequency, string> = {
  daily365: 'd365',
  daily360: 'd360',
  semiweekly104: 'sw104',
  weekly52: 'w52',
  biweekly26: 'bw26',
  semimonthly24: 'sm24',
  monthly12: 'm12',
  bimonthly6: 'bm6',
  quarterly4: 'q4',
  halfyearly2: 'h2',
  yearly1: 'y1',
}

const C_IN: Record<string, CompoundingFrequency> = {
  d365: 'daily365',
  d360: 'daily360',
  sw104: 'semiweekly104',
  w52: 'weekly52',
  bw26: 'biweekly26',
  sm24: 'semimonthly24',
  m12: 'monthly12',
  bm6: 'bimonthly6',
  q4: 'quarterly4',
  h2: 'halfyearly2',
  y1: 'yearly1',
  d: 'daily365',
  m: 'monthly12',
  y: 'yearly1',
}

const RP_OUT: Record<InterestRatePeriod, string> = {
  daily: 'd',
  weekly: 'w',
  monthly: 'm',
  quarterly: 'q',
  annual: 'a',
}

const RP_IN: Record<string, InterestRatePeriod> = {
  d: 'daily',
  w: 'weekly',
  m: 'monthly',
  q: 'quarterly',
  a: 'annual',
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function parseOptNum(raw: string | null): NumericField {
  if (raw === null || raw === '') return ''
  const n = Number(raw)
  return Number.isFinite(n) ? n : ''
}

/** Map form fields to numbers for simulation (`''` becomes `0`). */
export function formValuesForSimulation(s: CalculatorFormState): {
  initialPrincipal: number
  nominalAnnualPercent: number
  years: number
  extraMonths: number
  compoundingFrequency: CompoundingFrequency
  monthlyContribution: number
  monthlyWithdrawal: number
  withdrawalsEnabled: boolean
  excludeWeekends: boolean
} {
  const n = (v: NumericField) => (v === '' ? 0 : v)
  const rate = n(s.annualRate)
  return {
    initialPrincipal: n(s.principal),
    nominalAnnualPercent: nominalAnnualPercentFromInput(rate, s.ratePeriod),
    years: n(s.years),
    extraMonths: n(s.extraMonths),
    compoundingFrequency: s.compounding,
    monthlyContribution: n(s.monthlyContribution),
    monthlyWithdrawal: n(s.monthlyWithdrawal),
    withdrawalsEnabled: s.withdrawalsEnabled,
    excludeWeekends: s.excludeWeekends,
  }
}

export function encodeCalculatorParams(s: CalculatorFormState): string {
  const qs = new URLSearchParams()
  if (s.currency) qs.set('cur', s.currency)
  if (s.principal !== '') qs.set('p', String(s.principal))
  if (s.annualRate !== '') qs.set('r', String(s.annualRate))
  if (s.ratePeriod !== 'annual') qs.set('rp', RP_OUT[s.ratePeriod])
  if (s.years !== '') qs.set('y', String(s.years))
  if (s.extraMonths !== '') qs.set('em', String(s.extraMonths))
  qs.set('c', C_OUT[s.compounding])
  if (s.monthlyContribution !== '') qs.set('mc', String(s.monthlyContribution))
  qs.set('w', s.withdrawalsEnabled ? '1' : '0')
  if (s.monthlyWithdrawal !== '') qs.set('mw', String(s.monthlyWithdrawal))
  qs.set('ew', s.excludeWeekends ? '1' : '0')
  return qs.toString()
}

/** Hydrate form from URL. Returns `null` when the query string is empty. */
export function decodeCalculatorParams(searchParams: URLSearchParams): CalculatorFormState | null {
  if (searchParams.toString() === '') return null

  const curRaw = searchParams.get('cur')
  const currency: CurrencyCode | '' = isCurrencyCode(curRaw) ? curRaw : ''

  const principal = parseOptNum(searchParams.get('p'))
  const annualRate = parseOptNum(searchParams.get('r'))
  const yearsRaw = parseOptNum(searchParams.get('y'))
  const emRaw = parseOptNum(searchParams.get('em'))
  const years = yearsRaw === '' ? '' : clamp(yearsRaw as number, 0, 200)
  const extraMonths = emRaw === '' ? '' : clamp(emRaw as number, 0, 11)

  const rpRaw = searchParams.get('rp')
  const ratePeriod: InterestRatePeriod =
    rpRaw && rpRaw in RP_IN ? RP_IN[rpRaw] : 'annual'

  const cRaw = searchParams.get('c') ?? 'd365'
  const compounding = C_IN[cRaw] ?? 'daily365'

  const mcRaw = searchParams.get('mc')
  const monthlyContribution =
    mcRaw === null || mcRaw === '' ? '' : Math.max(0, Number(mcRaw) || 0)

  const w = searchParams.get('w') === '1'
  const mwRaw = searchParams.get('mw')
  const monthlyWithdrawal = mwRaw === null || mwRaw === '' ? '' : Math.max(0, Number(mwRaw) || 0)
  const ew = searchParams.get('ew') === '1'

  return {
    currency,
    principal,
    annualRate,
    ratePeriod,
    years,
    extraMonths,
    compounding,
    monthlyContribution,
    withdrawalsEnabled: w,
    monthlyWithdrawal,
    excludeWeekends: ew,
  }
}

export function getDefaultCalculatorForm(): CalculatorFormState {
  return {
    currency: '',
    principal: '',
    annualRate: '',
    ratePeriod: 'annual',
    years: '',
    extraMonths: '',
    compounding: 'daily365',
    monthlyContribution: '',
    withdrawalsEnabled: false,
    monthlyWithdrawal: '',
    excludeWeekends: false,
  }
}

/** True if user filled enough to run the simulation meaningfully. */
export function canRunSimulation(s: CalculatorFormState): boolean {
  if (!s.currency) return false
  if (s.principal === '' || s.annualRate === '') return false
  return true
}
