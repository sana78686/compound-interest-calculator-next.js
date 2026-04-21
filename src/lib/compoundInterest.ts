/**
 * Compound interest simulation for the public calculator (UK £, ISA allowance optional).
 * See docs/COMPOUND_INTEREST_CALCULATOR.md for formulas and assumptions.
 */

import { formatCurrencyAmount } from '@/lib/currency'
import type { CurrencyCode } from '@/lib/currency'
import { apyFromNominal, periodsPerYear, type CompoundingFrequency } from '@/lib/compoundModes'

export type { CompoundingFrequency } from '@/lib/compoundModes'

export interface SimulationParams {
  /** Nominal annual rate % (from interest input + rate period). */
  nominalAnnualPercent: number
  years: number
  extraMonths: number
  compoundingFrequency: CompoundingFrequency
  initialPrincipal: number
  monthlyContribution: number
  monthlyWithdrawal: number
  withdrawalsEnabled: boolean
  excludeWeekends: boolean
  isaMode: boolean
  startDate: Date
}

export interface MonthPoint {
  monthIndex: number
  label: string
  /** Balance after this period's deposit/withdrawal, before compounding. */
  balanceAfterDeposit: number
  balance: number
  principal: number
  cumulativeContributions: number
  interest: number
  depositThisMonth: number
  interestThisMonth: number
}

export type BreakdownTableRow = {
  period: string
  deposit: number
  interest: number
  totalInterest: number
  balance: number
  monthIndex: number
}

export interface SimulationResult {
  finalBalance: number
  totalInterest: number
  totalContributions: number
  principal: number
  roiPercent: number
  apyPercent: number
  doubleTimeMonths: number | null
  monthlyPoints: MonthPoint[]
  isaCappedTotal: number
  tableRows: BreakdownTableRow[]
  yearTableRows: BreakdownTableRow[]
  dayTableRows: BreakdownTableRow[]
}

const ISA_ANNUAL_ALLOWANCE = 20_000

/** UK tax year start (April 6) containing date `d`. */
export function getUkTaxYearStart(d: Date): Date {
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  let startY = y
  if (m < 3 || (m === 3 && day < 6)) startY = y - 1
  return new Date(startY, 3, 6)
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

const dayMs = 86_400_000

function applyMonthlyFactorNominal(balance: number, rNomPercent: number, nPerYear: number): number {
  const r = rNomPercent / 100
  return balance * (1 + r / nPerYear) ** (nPerYear / 12)
}

/** E.g. "22 Apr '26" (optional * = partial period, matches reference UIs). */
function formatTableDayLabel(d: Date, star: boolean): string {
  const day = d.getDate()
  const mon = d.toLocaleString('en-GB', { month: 'short' })
  const yy = d.getFullYear() % 100
  return `${day} ${mon} '${String(yy).padStart(2, '0')}${star ? '*' : ''}`
}

/** Month/year at end of accrual m (inclusive of that accrual’s last day). */
function formatAccrualEndLabel(start: Date, m: number, totalMonths: number): string {
  if (totalMonths === 0) return '—'
  const s = new Date(start)
  s.setHours(12, 0, 0, 0)
  const dEnd = new Date(addMonths(s, m + 1).getTime() - dayMs)
  dEnd.setHours(12, 0, 0, 0)
  const mon = dEnd.toLocaleString('en-GB', { month: 'short' })
  const y = dEnd.getFullYear()
  const firstPartial = m === 0 && s.getDate() !== 1
  const lastPartial = m === totalMonths - 1 && addMonths(s, totalMonths).getDate() !== 1
  const star = firstPartial || lastPartial
  return `${mon} ${y}${star ? '*' : ''}`
}

/**
 * If the first accrual crosses a month boundary (start not 1st), split the first
 * anniversary into two table rows: up to EOM, then the rest. Keeps the same
 * compounding and final balances as the main simulation.
 */
function buildExpandedMonthlyTableRows(
  start: Date,
  p0: number,
  rows: BreakdownTableRow[],
  points: MonthPoint[],
  totalMonths: number,
): BreakdownTableRow[] {
  if (rows.length === 0) return rows
  const s = new Date(start)
  s.setHours(12, 0, 0, 0)
  const reLabel = (r: BreakdownTableRow) => ({
    ...r,
    period: formatAccrualEndLabel(s, r.monthIndex, totalMonths),
  })
  if (s.getDate() === 1) {
    return rows.map(reLabel)
  }
  const e1 = addMonths(s, 1)
  const eom0 = new Date(s.getFullYear(), s.getMonth() + 1, 0, 12, 0, 0, 0)
  eom0.setHours(12, 0, 0, 0)
  if (eom0.getTime() >= e1.getTime()) {
    return rows.map(reLabel)
  }
  const t = Math.max(0, Math.round((e1.getTime() - s.getTime()) / dayMs))
  const a = Math.max(0, Math.round((eom0.getTime() - s.getTime()) / dayMs))
  if (t <= 0 || a <= 0 || a >= t) {
    return rows.map(reLabel)
  }
  const p0pt = points[0]!
  const b0s = p0pt.balanceAfterDeposit
  const b0e = p0pt.balance
  const cum0 = p0pt.cumulativeContributions
  const f = b0s > 0 ? b0e / b0s : 1
  const fPer = t > 0 ? f ** (1 / t) : 1
  const bEom = b0s * fPer ** a
  const int1 = bEom - b0s
  const int2 = b0e - bEom
  const tot1 = Math.max(0, bEom - p0 - cum0)
  const tot2 = Math.max(0, b0e - p0 - cum0)
  const mon1 = eom0.toLocaleString('en-GB', { month: 'short' })
  const y1 = eom0.getFullYear()
  const e1m1 = new Date(e1.getTime() - dayMs)
  e1m1.setHours(12, 0, 0, 0)
  const mon2 = e1m1.toLocaleString('en-GB', { month: 'short' })
  const y2 = e1m1.getFullYear()
  const rest = rows.slice(1).map(reLabel)
  return [
    {
      period: `${mon1} ${y1}*`,
      deposit: 0,
      interest: int1,
      totalInterest: tot1,
      balance: bEom,
      monthIndex: 0,
    },
    {
      period: `${mon2} ${y2}`,
      deposit: 0,
      interest: int2,
      totalInterest: tot2,
      balance: b0e,
      monthIndex: 0,
    },
    ...rest,
  ]
}

function buildYearTableRows(startDate: Date, rows: BreakdownTableRow[]): BreakdownTableRow[] {
  if (rows.length === 0) return []
  const out: BreakdownTableRow[] = []
  for (let s = 0; s < rows.length; s += 12) {
    const chunk = rows.slice(s, s + 12)
    if (chunk.length === 0) continue
    const last = chunk[chunk.length - 1]!
    const prevCum = s > 0 ? rows[s - 1]!.totalInterest : 0
    const yearInterest = last.totalInterest - prevCum
    const depSum = chunk.reduce((a, r) => a + r.deposit, 0)
    const asOf = new Date(addMonths(new Date(startDate), last.monthIndex + 1).getTime() - dayMs)
    const y = asOf.getFullYear()
    const partial = chunk.length < 12
    out.push({
      period: partial ? `${y}*` : String(y),
      deposit: depSum,
      interest: yearInterest,
      totalInterest: last.totalInterest,
      balance: last.balance,
      monthIndex: last.monthIndex,
    })
  }
  return out
}

/** For non-daily compounding, split each month’s growth geometrically by calendar day to match a daily-style schedule view (month boundaries match the main simulation). */
function buildGeometricDayRows(
  startDate: Date,
  p0: number,
  points: MonthPoint[],
): BreakdownTableRow[] {
  const out: BreakdownTableRow[] = []
  for (let m = 0; m < points.length; m++) {
    const p = points[m]!
    const b0 = p.balanceAfterDeposit
    const b1 = p.balance
    const periodStart = addMonths(new Date(startDate), m)
    periodStart.setHours(12, 0, 0, 0)
    const periodEnd = addMonths(new Date(startDate), m + 1)
    const nDays = Math.max(0, Math.round((periodEnd.getTime() - periodStart.getTime()) / dayMs))
    if (nDays === 0) continue
    const f = b0 > 0 ? (b1 / b0) ** (1 / nDays) : 1
    let run = b0
    for (let k = 0; k < nDays; k++) {
      const bPrev = run
      run = k === nDays - 1 ? b1 : bPrev * f
      const dayInt = run - bPrev
      const d = new Date(periodStart.getTime() + k * dayMs)
      d.setHours(12, 0, 0, 0)
      const dep = m > 0 && k === 0 ? p.depositThisMonth : 0
      out.push({
        period: formatTableDayLabel(d, m === 0 && k === 0),
        deposit: dep,
        interest: dayInt,
        totalInterest: Math.max(0, run - p0 - p.cumulativeContributions),
        balance: run,
        monthIndex: m,
      })
    }
  }
  return out
}

export function simulateCompoundInterest(raw: SimulationParams): SimulationResult {
  const rNom = Math.max(0, raw.nominalAnnualPercent)
  const n = periodsPerYear(raw.compoundingFrequency)
  const baseMonths = Math.max(0, Math.floor(raw.years) * 12 + Math.floor(raw.extraMonths))
  const totalMonths = baseMonths
  const P0 = Math.max(0, raw.initialPrincipal)
  let balance = P0
  let cumContrib = 0
  let isaCappedTotal = 0

  let usedIsaThisTaxYear = 0
  let lastTaxYearStart = getUkTaxYearStart(raw.startDate)
  const startAnchor = new Date(raw.startDate)
  startAnchor.setHours(12, 0, 0, 0)
  let cursor = new Date(startAnchor)

  function subscribeIsa(amount: number, when: Date): number {
    if (!raw.isaMode || amount <= 0) return amount
    const ty = getUkTaxYearStart(when)
    if (ty.getTime() !== lastTaxYearStart.getTime()) {
      usedIsaThisTaxYear = 0
      lastTaxYearStart = ty
    }
    const room = Math.max(0, ISA_ANNUAL_ALLOWANCE - usedIsaThisTaxYear)
    const applied = Math.min(amount, room)
    const capped = amount - applied
    if (capped > 0) isaCappedTotal += capped
    usedIsaThisTaxYear += applied
    return applied
  }

  const monthlyPoints: MonthPoint[] = []
  const tableRows: BreakdownTableRow[] = []
  const dayTableRows: BreakdownTableRow[] = []

  const isDaily = raw.compoundingFrequency === 'daily365' || raw.compoundingFrequency === 'daily360'
  const dayDivisor = raw.compoundingFrequency === 'daily360' ? 360 : 365

  for (let m = 0; m < totalMonths; m++) {
    let deposit = 0
    if (m > 0) {
      deposit = subscribeIsa(raw.monthlyContribution, cursor)
      balance += deposit
      cumContrib += deposit
      if (raw.withdrawalsEnabled && raw.monthlyWithdrawal > 0) {
        balance = Math.max(0, balance - raw.monthlyWithdrawal)
      }
    }

    const balanceAfterDeposit = balance
    let interestThis = 0

    if (isDaily) {
      const periodStart = new Date(cursor)
      const periodEnd = addMonths(new Date(startAnchor), m + 1)
      const nDays = Math.max(0, Math.round((periodEnd.getTime() - periodStart.getTime()) / dayMs))
      const dailyR = rNom / (100 * dayDivisor)
      for (let day = 0; day < nDays; day++) {
        const dow = cursor.getDay()
        const weekend = dow === 0 || dow === 6
        const accrue =
          raw.compoundingFrequency === 'daily360' || !raw.excludeWeekends || !weekend
        const bBefore = balance
        if (accrue) {
          balance *= 1 + dailyR
        }
        const dayInt = balance - bBefore
        interestThis += dayInt
        const tot = Math.max(0, balance - P0 - cumContrib)
        dayTableRows.push({
          period: formatTableDayLabel(new Date(cursor), m === 0 && day === 0),
          deposit: m > 0 && day === 0 ? deposit : 0,
          interest: dayInt,
          totalInterest: tot,
          balance,
          monthIndex: m,
        })
        cursor = new Date(cursor.getTime() + dayMs)
      }
      cursor = new Date(periodEnd)
    } else {
      const b0 = balance
      balance = applyMonthlyFactorNominal(balance, rNom, n)
      interestThis = balance - b0
      cursor = addMonths(new Date(startAnchor), m + 1)
    }

    const interestTotal = Math.max(0, balance - P0 - cumContrib)
    const monthPeriodLabel = formatAccrualEndLabel(startAnchor, m, totalMonths)
    monthlyPoints.push({
      monthIndex: m,
      label: monthPeriodLabel,
      balanceAfterDeposit,
      balance,
      principal: P0,
      cumulativeContributions: cumContrib,
      interest: interestTotal,
      depositThisMonth: deposit,
      interestThisMonth: interestThis,
    })

    tableRows.push({
      period: monthPeriodLabel,
      deposit,
      interest: interestThis,
      totalInterest: interestTotal,
      balance,
      monthIndex: m,
    })
  }

  if (totalMonths === 0) {
    monthlyPoints.push({
      monthIndex: 0,
      label: 'Start',
      balanceAfterDeposit: P0,
      balance: P0,
      principal: P0,
      cumulativeContributions: 0,
      interest: 0,
      depositThisMonth: 0,
      interestThisMonth: 0,
    })
  }

  const geoDayRows = !isDaily && totalMonths > 0 ? buildGeometricDayRows(startAnchor, P0, monthlyPoints) : []
  const finalDayTableRows = isDaily ? dayTableRows : geoDayRows
  const tableRowsForUi =
    totalMonths > 0 ? buildExpandedMonthlyTableRows(startAnchor, P0, tableRows, monthlyPoints, totalMonths) : []
  const yearTableRows = buildYearTableRows(startAnchor, tableRowsForUi)

  const finalBalance = balance
  const totalContributions = cumContrib
  const totalInvested = P0 + totalContributions
  const totalInterest = Math.max(0, finalBalance - totalInvested)

  const roiPercent = totalInvested > 0 ? (totalInterest / totalInvested) * 100 : 0
  const apyPercent = apyFromNominal(rNom, n)

  let doubleTimeMonths: number | null = null
  if (P0 > 0) {
    const target = 2 * P0
    const hit = monthlyPoints.find((p) => p.balance >= target)
    doubleTimeMonths = hit ? hit.monthIndex : null
  }

  return {
    finalBalance,
    totalInterest,
    totalContributions,
    principal: P0,
    roiPercent,
    apyPercent,
    doubleTimeMonths,
    monthlyPoints,
    isaCappedTotal,
    tableRows: tableRowsForUi,
    yearTableRows,
    dayTableRows: finalDayTableRows,
  }
}

export function buildInsights(
  result: SimulationResult,
  params: SimulationParams,
  opts?: { currency?: CurrencyCode },
): string[] {
  const out: string[] = []
  const { monthlyPoints, totalInterest } = result
  const cur: CurrencyCode = opts?.currency ?? 'GBP'

  if (params.monthlyContribution > 0 && monthlyPoints.length > 12) {
    for (let y = 1; y < 50; y++) {
      const idx = y * 12 - 1
      if (idx < 0 || idx >= monthlyPoints.length) break
      const p = monthlyPoints[idx]
      const interestPart = p.balance - params.initialPrincipal - p.cumulativeContributions
      if (interestPart > p.cumulativeContributions) {
        out.push(
          `Compound interest may exceed your total monthly contributions by about the end of year ${y}, depending on rate and timing.`,
        )
        break
      }
    }
  }

  if (params.compoundingFrequency === 'daily365') {
    out.push('Daily compounding usually returns slightly more than monthly compounding at the same headline rate.')
  }

  if (params.monthlyContribution > 0 && params.years > 0) {
    const extra = params.monthlyContribution * 12 * params.years
    out.push(
      `Regular deposits add about ${formatCurrencyAmount(extra, cur)} in contributions over ${params.years} year(s) (excluding interest).`,
    )
  }

  if (params.isaMode && result.isaCappedTotal > 0) {
    out.push(
      `Some planned subscriptions were not applied inside the ISA because of the UK £${ISA_ANNUAL_ALLOWANCE.toLocaleString('en-GB')} per tax-year limit.`,
    )
  }

  if (out.length === 0) {
    out.push(`Estimated interest over the period: about ${formatCurrencyAmount(totalInterest, cur)}.`)
  }

  return out.slice(0, 5)
}
