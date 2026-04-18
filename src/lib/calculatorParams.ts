import type { CompoundingFrequency } from '@/lib/compoundInterest'
import type { CurrencyCode } from '@/lib/currency'
import { isCurrencyCode } from '@/lib/currency'

export type NumericField = number | ''

export type CalculatorFormState = {
  currency: CurrencyCode | ''
  principal: NumericField
  annualRate: NumericField
  years: NumericField
  extraMonths: NumericField
  compounding: CompoundingFrequency
  monthlyContribution: NumericField
  withdrawalsEnabled: boolean
  monthlyWithdrawal: NumericField
  excludeWeekends: boolean
}

const C_OUT: Record<CompoundingFrequency, string> = {
  daily: 'd',
  monthly: 'm',
  yearly: 'y',
}

const C_IN: Record<string, CompoundingFrequency> = {
  d: 'daily',
  m: 'monthly',
  y: 'yearly',
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
  annualRatePercent: number
  years: number
  extraMonths: number
  compoundingFrequency: CompoundingFrequency
  monthlyContribution: number
  monthlyWithdrawal: number
  withdrawalsEnabled: boolean
  excludeWeekends: boolean
} {
  const n = (v: NumericField) => (v === '' ? 0 : v)
  return {
    initialPrincipal: n(s.principal),
    annualRatePercent: n(s.annualRate),
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

  const cRaw = searchParams.get('c') ?? 'd'
  const compounding = C_IN[cRaw] ?? 'daily'

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
    years: '',
    extraMonths: '',
    compounding: 'daily',
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
