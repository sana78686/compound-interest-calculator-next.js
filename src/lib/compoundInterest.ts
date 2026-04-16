/**
 * Compound interest simulation for the public calculator (UK £, ISA allowance optional).
 * See docs/COMPOUND_INTEREST_CALCULATOR.md for formulas and assumptions.
 */

export type CompoundingFrequency = 'daily' | 'monthly' | 'yearly'

export interface SimulationParams {
  initialPrincipal: number
  annualRatePercent: number
  years: number
  extraMonths: number
  compoundingFrequency: CompoundingFrequency
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
  balance: number
  principal: number
  cumulativeContributions: number
  interest: number
  depositThisMonth: number
  interestThisMonth: number
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
  tableRows: {
    period: string
    deposit: number
    interest: number
    totalInterest: number
    balance: number
  }[]
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

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function simulateCompoundInterest(raw: SimulationParams): SimulationResult {
  const annualRate = raw.annualRatePercent / 100
  const dailyRate = (1 + annualRate) ** (1 / 365) - 1
  const monthlyRate = (1 + annualRate) ** (1 / 12) - 1
  const yearlyRate = annualRate

  const totalMonths = Math.max(0, Math.floor(raw.years) * 12 + Math.floor(raw.extraMonths))
  const P0 = Math.max(0, raw.initialPrincipal)
  let balance = P0
  let cumContrib = 0
  let isaCappedTotal = 0

  let usedIsaThisTaxYear = 0
  let lastTaxYearStart = getUkTaxYearStart(raw.startDate)
  let cursor = new Date(raw.startDate)
  cursor.setHours(12, 0, 0, 0)

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
  const tableRows: SimulationResult['tableRows'] = []

  const dayMs = 86400000

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

    let interestThis = 0

    if (raw.compoundingFrequency === 'daily') {
      const dim = daysInMonth(cursor)
      for (let day = 0; day < dim; day++) {
        const dow = cursor.getDay()
        const weekend = dow === 0 || dow === 6
        const accrue = !raw.excludeWeekends || !weekend
        if (accrue) {
          const b0 = balance
          balance *= 1 + dailyRate
          interestThis += balance - b0
        }
        cursor = new Date(cursor.getTime() + dayMs)
      }
    } else if (raw.compoundingFrequency === 'monthly') {
      const b0 = balance
      balance *= 1 + monthlyRate
      interestThis = balance - b0
      cursor = addMonths(cursor, 1)
    } else {
      const b0 = balance
      if ((m + 1) % 12 === 0) {
        balance *= 1 + yearlyRate
      }
      interestThis = balance - b0
      cursor = addMonths(cursor, 1)
    }

    const interestTotal = Math.max(0, balance - P0 - cumContrib)
    monthlyPoints.push({
      monthIndex: m,
      label: m === 0 ? 'Start' : `Month ${m}`,
      balance,
      principal: P0,
      cumulativeContributions: cumContrib,
      interest: interestTotal,
      depositThisMonth: deposit,
      interestThisMonth: interestThis,
    })

    if (m > 0) {
      tableRows.push({
        period: `Month ${m}`,
        deposit,
        interest: interestThis,
        totalInterest: interestTotal,
        balance,
      })
    }
  }

  if (totalMonths === 0) {
    monthlyPoints.push({
      monthIndex: 0,
      label: 'Start',
      balance: P0,
      principal: P0,
      cumulativeContributions: 0,
      interest: 0,
      depositThisMonth: 0,
      interestThisMonth: 0,
    })
  }

  const finalBalance = balance
  const totalContributions = cumContrib
  const totalInvested = P0 + totalContributions
  const totalInterest = Math.max(0, finalBalance - totalInvested)

  const roiPercent = totalInvested > 0 ? (totalInterest / totalInvested) * 100 : 0
  const n = raw.compoundingFrequency === 'daily' ? 365 : raw.compoundingFrequency === 'monthly' ? 12 : 1
  const apyPercent = ((1 + annualRate / n) ** n - 1) * 100

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
    tableRows,
  }
}

export function buildInsights(result: SimulationResult, params: SimulationParams): string[] {
  const out: string[] = []
  const { monthlyPoints, totalInterest } = result

  if (params.monthlyContribution > 0 && monthlyPoints.length > 12) {
    for (let y = 1; y < 50; y++) {
      const idx = y * 12
      if (idx >= monthlyPoints.length) break
      const p = monthlyPoints[idx]
      const interestPart = p.balance - params.initialPrincipal - p.cumulativeContributions
      if (interestPart > p.cumulativeContributions) {
        out.push(
          `Compound interest may exceed your total monthly contributions by about year ${y + 1}, depending on rate and timing.`,
        )
        break
      }
    }
  }

  if (params.compoundingFrequency === 'daily') {
    out.push('Daily compounding usually returns slightly more than monthly compounding at the same headline rate.')
  }

  if (params.monthlyContribution > 0 && params.years > 0) {
    const extra = params.monthlyContribution * 12 * params.years
    out.push(
      `Regular deposits add about £${extra.toLocaleString('en-GB', { maximumFractionDigits: 0 })} in contributions over ${params.years} year(s) (excluding interest).`,
    )
  }

  if (params.isaMode && result.isaCappedTotal > 0) {
    out.push(
      `Some planned subscriptions were not applied inside the ISA because of the UK £${ISA_ANNUAL_ALLOWANCE.toLocaleString('en-GB')} per tax-year limit.`,
    )
  }

  if (out.length === 0) {
    out.push(`Estimated interest over the period: about £${totalInterest.toLocaleString('en-GB', { maximumFractionDigits: 2 })}.`)
  }

  return out.slice(0, 5)
}
