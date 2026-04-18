'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CompoundingFrequency } from '@/lib/compoundInterest'
import { simulateCompoundInterest, buildInsights } from '@/lib/compoundInterest'
import {
  encodeCalculatorParams,
  decodeCalculatorParams,
  getDefaultCalculatorForm,
  formValuesForSimulation,
  type CalculatorFormState,
  type NumericField,
} from '@/lib/calculatorParams'
import type { CurrencyCode } from '@/lib/currency'
import { CURRENCY_OPTIONS, currencySymbol, formatCurrencyAmount, formatCurrencyAxisCompact } from '@/lib/currency'
import HelpTip from '@/components/calculator/HelpTip'
import './CompoundCalculator.css'

function applyNumericField(
  setter: React.Dispatch<React.SetStateAction<NumericField>>,
  raw: string,
  mode: 'float' | 'int' = 'float',
) {
  if (raw === '') {
    setter('')
    return
  }
  const n = mode === 'int' ? parseInt(raw, 10) : parseFloat(raw)
  setter(Number.isFinite(n) ? n : '')
}

function formatPct(n: number) {
  return `${n.toLocaleString('en-GB', { maximumFractionDigits: 2 })}%`
}

type ChartGranularity = 'monthly' | 'yearly' | 'daily'
type TableGranularity = 'monthly' | 'yearly' | 'daily'

type Props = {
  isaMode: boolean
}

export default function CompoundCalculatorDashboard({ isaMode }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resultsPath = isaMode ? '/isa/results' : '/results'
  const otherResultsPath = isaMode ? '/results' : '/isa/results'

  const [currency, setCurrency] = useState<CurrencyCode | ''>('')
  const [principal, setPrincipal] = useState<NumericField>('')
  const [annualRate, setAnnualRate] = useState<NumericField>('')
  const [years, setYears] = useState<NumericField>('')
  const [extraMonths, setExtraMonths] = useState<NumericField>('')
  const [compounding, setCompounding] = useState<CompoundingFrequency>('daily')
  const [monthlyContribution, setMonthlyContribution] = useState<NumericField>('')
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(false)
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState<NumericField>('')
  const [excludeWeekends, setExcludeWeekends] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(true)
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('monthly')
  const [tableGranularity, setTableGranularity] = useState<TableGranularity>('monthly')

  const [hydrated, setHydrated] = useState(false)

  useLayoutEffect(() => {
    const d = decodeCalculatorParams(searchParams)
    if (d) {
      setCurrency(d.currency)
      setPrincipal(d.principal)
      setAnnualRate(d.annualRate)
      setYears(d.years)
      setExtraMonths(d.extraMonths)
      setCompounding(d.compounding)
      setMonthlyContribution(d.monthlyContribution)
      setWithdrawalsEnabled(d.withdrawalsEnabled)
      setMonthlyWithdrawal(d.monthlyWithdrawal)
      setExcludeWeekends(d.excludeWeekends)
    }
    setHydrated(true)
  }, [searchParams])

  const formState: CalculatorFormState = useMemo(
    () => ({
      currency,
      principal,
      annualRate,
      years,
      extraMonths,
      compounding,
      monthlyContribution,
      withdrawalsEnabled,
      monthlyWithdrawal,
      excludeWeekends,
    }),
    [
      currency,
      principal,
      annualRate,
      years,
      extraMonths,
      compounding,
      monthlyContribution,
      withdrawalsEnabled,
      monthlyWithdrawal,
      excludeWeekends,
    ],
  )

  const replaceUrl = useCallback(() => {
    const q = encodeCalculatorParams(formState)
    const cur = decodeCalculatorParams(searchParams)
    const curQ = cur ? encodeCalculatorParams(cur) : ''
    if (q === curQ) return
    router.replace(`${resultsPath}?${q}`, { scroll: false })
  }, [formState, resultsPath, router, searchParams])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!hydrated) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(replaceUrl, 280)
    return () => clearTimeout(debounceRef.current)
  }, [hydrated, replaceUrl])

  const params = useMemo(
    () => ({
      ...formValuesForSimulation(formState),
      isaMode,
      startDate: new Date(),
    }),
    [formState, isaMode],
  )

  const displayCurrency: CurrencyCode = currency || 'GBP'
  const sym = currency ? currencySymbol(currency) : ''
  const formatMoney = useCallback((n: number) => formatCurrencyAmount(n, displayCurrency), [displayCurrency])

  const result = useMemo(() => simulateCompoundInterest(params), [params])
  const insights = useMemo(
    () => buildInsights(result, params, { currency: displayCurrency }),
    [result, params, displayCurrency],
  )

  const chartData = useMemo(() => {
    const pts = result.monthlyPoints
    if (pts.length === 0) return []
    if (chartGranularity === 'monthly') {
      return pts.map((p, i) => ({
        name: i === 0 ? '0' : `${i}m`,
        label: `Month ${i}`,
        principal: params.initialPrincipal,
        contributions: p.cumulativeContributions,
        interest: Math.max(0, p.balance - params.initialPrincipal - p.cumulativeContributions),
        balance: p.balance,
      }))
    }
    if (chartGranularity === 'yearly') {
      const out: {
        name: string
        label: string
        principal: number
        contributions: number
        interest: number
        balance: number
      }[] = []
      for (let y = 0; y <= Math.ceil(pts.length / 12); y++) {
        const idx = Math.min(y * 12, pts.length - 1)
        if (idx < 0) break
        const p = pts[idx]
        out.push({
          name: `Y${y}`,
          label: `Year ${y}`,
          principal: params.initialPrincipal,
          contributions: p.cumulativeContributions,
          interest: Math.max(0, p.balance - params.initialPrincipal - p.cumulativeContributions),
          balance: p.balance,
        })
      }
      return out
    }
    return pts.map((p, i) => ({
      name: `${i}m`,
      label: `Month ${i}`,
      principal: params.initialPrincipal,
      contributions: p.cumulativeContributions,
      interest: Math.max(0, p.balance - params.initialPrincipal - p.cumulativeContributions),
      balance: p.balance,
    }))
  }, [result.monthlyPoints, chartGranularity, params.initialPrincipal])

  const tableData = useMemo(() => {
    if (tableGranularity === 'monthly') return result.tableRows
    if (tableGranularity === 'yearly') {
      const rows = result.tableRows
      const yearly: typeof rows = []
      for (let i = 11; i < rows.length; i += 12) {
        yearly.push(rows[i])
      }
      if (yearly.length === 0 && rows.length) yearly.push(rows[rows.length - 1])
      return yearly
    }
    return result.tableRows.filter((_, i) => i % 30 === 29 || i === result.tableRows.length - 1)
  }, [result.tableRows, tableGranularity])

  const doubleLabel =
    result.doubleTimeMonths != null
      ? `${Math.floor(result.doubleTimeMonths / 12)} years ${result.doubleTimeMonths % 12} months`
      : '—'

  const compoundingLabel =
    compounding === 'daily' ? 'daily' : compounding === 'monthly' ? 'monthly' : 'yearly'

  const q = encodeCalculatorParams(formState)

  function onCalculate(e: React.FormEvent) {
    e.preventDefault()
    replaceUrl()
  }

  return (
    <div className="cic-page cic-page--dashboard">
      <header className="cic-hero">
        <h1 className="cic-hero__title">Compound Interest Calculator</h1>
        {isaMode && (
          <p className="cic-hero__isa">
            ISA mode — UK Stocks &amp; Shares ISA subscriptions are limited to £20,000 per tax year (6 April – 5
            April). Growth inside an ISA is free of UK income and capital gains tax.
          </p>
        )}
        <p className="cic-hero__sub">
          Calculate the growth of your investments with {compoundingLabel} compounding.
        </p>
        <div className="cic-badges">
          <span className="cic-badge">★ Trusted by millions</span>
          <span className="cic-badge">★ Accurate &amp; fast</span>
        </div>
      </header>

      <div className="cic-switch">
        {isaMode ? (
          <Link href={`${otherResultsPath}?${q}`} className="cic-switch__link">
            ← Standard calculator (non-ISA)
          </Link>
        ) : (
          <Link href={`${otherResultsPath}?${q}`} className="cic-switch__link">
            ISA calculator (tax-year allowance) →
          </Link>
        )}
      </div>

      <div className="cic-grid">
        <section className="cic-card cic-card--inputs">
          <h2 className="cic-card__title">Investment details</h2>
          <form onSubmit={onCalculate} className="cic-form">
            <label className="cic-field">
              <span className="cic-field__label">
                Currency
                <HelpTip text="All amounts below are in this currency. The calculator uses the same compound formula for every currency." />
              </span>
              <select
                className="cic-currency-select"
                value={currency}
                onChange={(e) => setCurrency((e.target.value || '') as CurrencyCode | '')}
                aria-label="Currency"
              >
                <option value="">Select currency</option>
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.label} ({c.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="cic-field">
              <span className="cic-field__label">
                Initial investment
                <HelpTip text="The lump sum you put in at the start, in your selected currency." />
              </span>
              <div className="cic-field__row">
                {sym ? (
                  <span className="cic-prefix">{sym}</span>
                ) : (
                  <span className="cic-prefix cic-prefix--muted">—</span>
                )}
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={principal === '' ? '' : String(principal)}
                  onChange={(e) => applyNumericField(setPrincipal, e.target.value)}
                />
              </div>
            </label>
            <label className="cic-field">
              <span className="cic-field__label">
                Annual interest rate
                <HelpTip text="The yearly return you expect, as a percent." />
              </span>
              <div className="cic-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={annualRate === '' ? '' : String(annualRate)}
                  onChange={(e) => applyNumericField(setAnnualRate, e.target.value)}
                />
                <span className="cic-suffix">%</span>
              </div>
            </label>
            <div className="cic-field cic-field--split">
              <label>
                <span className="cic-field__label">
                  Years
                  <HelpTip text="Full years you plan to leave the money invested." />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  value={years === '' ? '' : String(years)}
                  onChange={(e) => applyNumericField(setYears, e.target.value, 'int')}
                />
              </label>
              <label>
                <span className="cic-field__label">
                  Extra months
                  <HelpTip text="Extra months (0–11) on top of the years." />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  value={extraMonths === '' ? '' : String(extraMonths)}
                  onChange={(e) => applyNumericField(setExtraMonths, e.target.value, 'int')}
                />
              </label>
            </div>

            <button
              type="button"
              className="cic-advanced-toggle"
              onClick={() => setAdvancedOpen((o) => !o)}
              aria-expanded={advancedOpen}
            >
              Advanced options {advancedOpen ? '▾' : '▸'}
            </button>

            {advancedOpen && (
              <div className="cic-advanced">
                <label className="cic-field">
                  <span className="cic-field__label">
                    Compounding frequency
                    <HelpTip text="How often interest is added to your balance." />
                  </span>
                  <select
                    value={compounding}
                    onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
                <label className="cic-field">
                  <span className="cic-field__label">
                    Monthly contribution
                    <HelpTip text="Money added each month after the first month. In ISA mode, we respect the £20,000 per tax year subscription cap." />
                  </span>
                  <div className="cic-field__row">
                    {sym ? (
                      <span className="cic-prefix">{sym}</span>
                    ) : (
                      <span className="cic-prefix cic-prefix--muted">—</span>
                    )}
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={monthlyContribution === '' ? '' : String(monthlyContribution)}
                      onChange={(e) => applyNumericField(setMonthlyContribution, e.target.value)}
                    />
                  </div>
                </label>
                <label className="cic-check">
                  <input
                    type="checkbox"
                    checked={withdrawalsEnabled}
                    onChange={(e) => setWithdrawalsEnabled(e.target.checked)}
                  />
                  Withdrawals
                  <HelpTip text="Take the same amount out every month." />
                </label>
                {withdrawalsEnabled && (
                  <label className="cic-field">
                    <span className="cic-field__label">
                      Monthly withdrawal
                      <HelpTip text="Withdrawal amount each month." />
                    </span>
                    <div className="cic-field__row">
                      {sym ? (
                        <span className="cic-prefix">{sym}</span>
                      ) : (
                        <span className="cic-prefix cic-prefix--muted">—</span>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        value={monthlyWithdrawal === '' ? '' : String(monthlyWithdrawal)}
                        onChange={(e) => applyNumericField(setMonthlyWithdrawal, e.target.value)}
                      />
                    </div>
                  </label>
                )}
                <label className="cic-check">
                  <input
                    type="checkbox"
                    checked={excludeWeekends}
                    onChange={(e) => setExcludeWeekends(e.target.checked)}
                  />
                  Exclude weekends (daily compounding only)
                  <HelpTip text="No interest on Saturday or Sunday when compounding is daily." />
                </label>
              </div>
            )}

            <button type="submit" className="cic-btn-calc">
              Calculate
            </button>
            <p className="cic-reset-hint">
              <button
                type="button"
                className="cic-link-reset"
                onClick={() => {
                  const d = getDefaultCalculatorForm()
                  setCurrency(d.currency)
                  setPrincipal(d.principal)
                  setAnnualRate(d.annualRate)
                  setYears(d.years)
                  setExtraMonths(d.extraMonths)
                  setCompounding(d.compounding)
                  setMonthlyContribution(d.monthlyContribution)
                  setWithdrawalsEnabled(d.withdrawalsEnabled)
                  setMonthlyWithdrawal(d.monthlyWithdrawal)
                  setExcludeWeekends(d.excludeWeekends)
                  router.replace(resultsPath, { scroll: false })
                }}
              >
                Clear form
              </button>
            </p>
          </form>
        </section>

        <section className="cic-card cic-card--results">
          <h2 className="cic-card__title">Results</h2>
          <p className="cic-result-main">{formatMoney(result.finalBalance)}</p>
          <p className="cic-result-label">Final balance</p>
          <div className="cic-breakdown">
            <div className="cic-breakdown__row cic-breakdown__row--interest">
              + {formatMoney(result.totalInterest)} interest earned
            </div>
            <div className="cic-breakdown__row cic-breakdown__row--principal">
              + {formatMoney(result.principal)} principal
            </div>
            {result.totalContributions > 0 && (
              <div className="cic-breakdown__row cic-breakdown__row--contrib">
                + {formatMoney(result.totalContributions)} contributions
              </div>
            )}
          </div>
          <ul className="cic-stats">
            <li>
              <strong>ROI</strong> {formatPct(result.roiPercent)}
            </li>
            <li>
              <strong>Time to double</strong> {doubleLabel}
            </li>
            <li>
              <strong>Effective rate (APY)</strong> {formatPct(result.apyPercent)}
            </li>
          </ul>
        </section>
      </div>

      <section className="cic-card cic-card--wide">
        <div className="cic-section-head">
          <h2 className="cic-card__title">Growth over time</h2>
          <div className="cic-toggles" role="group" aria-label="Chart granularity">
            {(['monthly', 'yearly', 'daily'] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={chartGranularity === g ? 'is-active' : ''}
                onClick={() => setChartGranularity(g)}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="cic-chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => formatCurrencyAxisCompact(v, displayCurrency)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => formatMoney(value)}
                labelFormatter={(_, p) => (p?.[0]?.payload?.label as string) ?? ''}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="principal"
                name="Principal"
                stackId="1"
                stroke="#fbbf24"
                fill="#fde68a"
              />
              <Area
                type="monotone"
                dataKey="contributions"
                name="Contributions"
                stackId="1"
                stroke="#2563eb"
                fill="#93c5fd"
              />
              <Area
                type="monotone"
                dataKey="interest"
                name="Interest"
                stackId="1"
                stroke="#16a34a"
                fill="#86efac"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="cic-card cic-card--wide">
        <div className="cic-section-head">
          <h2 className="cic-card__title">Detailed breakdown</h2>
          <div className="cic-toggles" role="group" aria-label="Table granularity">
            {(['monthly', 'yearly', 'daily'] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={tableGranularity === g ? 'is-active' : ''}
                onClick={() => setTableGranularity(g)}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="cic-table-wrap">
          <table className="cic-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Deposit</th>
                <th>Interest</th>
                <th>Total interest</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 24).map((row, i) => (
                <tr key={i}>
                  <td>{row.period}</td>
                  <td>{formatMoney(row.deposit)}</td>
                  <td>{formatMoney(row.interest)}</td>
                  <td>{formatMoney(row.totalInterest)}</td>
                  <td>{formatMoney(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="insights" className="cic-card cic-card--wide cic-insights">
        <h2 className="cic-card__title">Insights</h2>
        <ul>
          {insights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
