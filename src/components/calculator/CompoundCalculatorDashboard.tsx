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
import { CURRENCY_OPTIONS, formatCurrencyAmount, formatCurrencyAxisCompact } from '@/lib/currency'
import type { InterestRatePeriod } from '@/lib/compoundModes'
import { COMPOUNDING_OPTIONS, INTEREST_RATE_PERIOD_OPTIONS } from '@/lib/compoundModes'
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
  const [ratePeriod, setRatePeriod] = useState<InterestRatePeriod>('annual')
  const [years, setYears] = useState<NumericField>('')
  const [extraMonths, setExtraMonths] = useState<NumericField>('')
  const [compounding, setCompounding] = useState<CompoundingFrequency>('daily365')
  const [monthlyContribution, setMonthlyContribution] = useState<NumericField>('')
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(false)
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState<NumericField>('')
  const [excludeWeekends, setExcludeWeekends] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(true)
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('daily')
  const [tableGranularity, setTableGranularity] = useState<TableGranularity>('monthly')

  const [hydrated, setHydrated] = useState(false)
  const [chartHeight, setChartHeight] = useState(320)
  useEffect(() => {
    const setH = () => {
      if (typeof window === 'undefined') return
      const w = window.innerWidth
      if (w < 480) setChartHeight(220)
      else if (w < 768) setChartHeight(260)
      else setChartHeight(320)
    }
    setH()
    window.addEventListener('resize', setH)
    return () => window.removeEventListener('resize', setH)
  }, [])

  useLayoutEffect(() => {
    const d = decodeCalculatorParams(searchParams)
    if (d) {
      setCurrency(d.currency)
      setPrincipal(d.principal)
      setAnnualRate(d.annualRate)
      setRatePeriod(d.ratePeriod)
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
      ratePeriod,
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
      ratePeriod,
      years,
      extraMonths,
      compounding,
      monthlyContribution,
      withdrawalsEnabled,
      monthlyWithdrawal,
      excludeWeekends,
    ],
  )

  useEffect(() => {
    if (compounding !== 'daily365' && excludeWeekends) setExcludeWeekends(false)
  }, [compounding, excludeWeekends])

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
        label: p.label,
        principal: params.initialPrincipal,
        contributions: p.cumulativeContributions,
        interest: Math.max(0, p.balance - params.initialPrincipal - p.cumulativeContributions),
        balance: p.balance,
      }))
    }
    if (chartGranularity === 'yearly') {
      if (pts.length === 0) return []
      // One point per year bucket (end of year); avoid duplicate indices from y <= ceil (bug: broke Recharts)
      const yearCount = Math.max(1, Math.ceil(pts.length / 12))
      const out: {
        name: string
        label: string
        principal: number
        contributions: number
        interest: number
        balance: number
      }[] = []
      for (let y = 0; y < yearCount; y++) {
        const idx = Math.min((y + 1) * 12 - 1, pts.length - 1)
        const p = pts[idx]!
        out.push({
          name: `Y${y + 1}`,
          label: `Year ${y + 1}`,
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
      label: p.label,
      principal: params.initialPrincipal,
      contributions: p.cumulativeContributions,
      interest: Math.max(0, p.balance - params.initialPrincipal - p.cumulativeContributions),
      balance: p.balance,
    }))
  }, [result.monthlyPoints, chartGranularity, params])

  const tableData = useMemo(() => {
    if (tableGranularity === 'monthly') return result.tableRows
    if (tableGranularity === 'yearly') return result.yearTableRows
    return result.dayTableRows
  }, [result.tableRows, result.yearTableRows, result.dayTableRows, tableGranularity])

  const doubleLabel =
    result.doubleTimeMonths != null
      ? `${Math.floor(result.doubleTimeMonths / 12)} years ${result.doubleTimeMonths % 12} months`
      : '—'

  const q = encodeCalculatorParams(formState)

  function onCalcFieldsKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    const t = e.target
    if (t instanceof HTMLSelectElement) return
    if (t instanceof HTMLInputElement && t.type === 'checkbox') return
    if (t instanceof HTMLInputElement) {
      e.preventDefault()
      replaceUrl()
    }
  }

  const pageTitle = isaMode ? 'ISA Compound Interest Calculator' : 'Daily Compound Interest Calculator'

  const tablePeriodHeader =
    tableGranularity === 'monthly' ? 'Month' : tableGranularity === 'yearly' ? 'Year' : 'Day'

  return (
    <div className="cic-page cic-page--dashboard">
      <header className="cic-hero">
        <h1 className="cic-hero__title">{pageTitle}</h1>
        {isaMode && (
          <p className="cic-hero__isa">
            ISA mode — UK Stocks &amp; Shares ISA subscriptions are limited to £20,000 per tax year (6 April – 5
            April). Growth inside an ISA is free of UK income and capital gains tax.
          </p>
        )}
        <p className="cic-hero__sub">
          {isaMode
            ? 'Model your allowance, contributions, and tax-free returns below.'
            : 'Calculate the growth of your investments with daily compounding.'}
        </p>
        <div className="cic-badges">
          <span className="cic-badge">★ Trusted by millions</span>
          <span className="cic-badge cic-badge--warm">★ Accurate &amp; fast</span>
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
          <div className="cic-card__head cic-card__head--solo">
            <h2 className="cic-card__title cic-card__title--with-isa cic-card__title--details">Investment Details</h2>
          </div>
          <hr className="cic-card__hr" aria-hidden />
          <div
            className="cic-form cic-form--mock"
            role="group"
            aria-label="Calculator inputs"
            onKeyDown={onCalcFieldsKeyDown}
          >
            <div className="cic-mock-primary">
              <div className="cic-mock-row">
                <span className="cic-mock-row__label" id="cic-db-lbl-mock-p">
                  Initial Investment
                  <span className="cic-req" aria-hidden="true">
                    {' '}
                    *
                  </span>
                </span>
                <div className="cic-mock-row__value" role="group" aria-labelledby="cic-db-lbl-mock-p">
                  <div className="cic-mock-row__val-main">
                    <input
                      id="cic-db-principal"
                      className="cic-mock-ghost-in"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={principal === '' ? '' : String(principal)}
                      onChange={(e) => applyNumericField(setPrincipal, e.target.value)}
                      aria-required
                    />
                  </div>
                  <span className="cic-mock-chevbar" aria-hidden />
                  <div className="cic-mock-chevcell">
                    <label htmlFor="cic-db-currency-main" className="cic-ref-visually-hidden">
                      Currency
                    </label>
                    <select
                      id="cic-db-currency-main"
                      className="cic-mock-sel--row"
                      value={currency}
                      onChange={(e) => setCurrency((e.target.value || '') as CurrencyCode | '')}
                      aria-label="Currency (required)"
                      aria-required
                    >
                      <option value="">Set</option>
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="cic-mock-row">
                <span className="cic-mock-row__label" id="cic-db-lbl-mock-r">
                  Annual Interest Rate
                  <span className="cic-req" aria-hidden="true">
                    {' '}
                    *
                  </span>
                </span>
                <div className="cic-mock-row__value" role="group" aria-labelledby="cic-db-lbl-mock-r">
                  <div className="cic-mock-row__val-main">
                    <div className="cic-mock-rate__left">
                      <input
                        id="cic-db-annual-rate"
                        className="cic-mock-ghost-in"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        value={annualRate === '' ? '' : String(annualRate)}
                        onChange={(e) => applyNumericField(setAnnualRate, e.target.value)}
                        aria-label="Interest rate percent"
                        aria-required
                      />
                      <span className="cic-mock-ghost-suffix">%</span>
                    </div>
                  </div>
                  <span className="cic-mock-chevbar" aria-hidden />
                  <div className="cic-mock-chevcell">
                    <label htmlFor="cic-db-rate-period" className="cic-ref-visually-hidden">
                      Rate applies per
                    </label>
                    <select
                      id="cic-db-rate-period"
                      className="cic-mock-sel--row"
                      value={ratePeriod}
                      onChange={(e) => setRatePeriod(e.target.value as InterestRatePeriod)}
                      aria-label="How often the rate applies"
                    >
                      {INTEREST_RATE_PERIOD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="cic-mock-row">
                <span className="cic-mock-row__label" id="cic-db-lbl-mock-t">
                  Time Period
                </span>
                <div className="cic-mock-row__value" role="group" aria-labelledby="cic-db-lbl-mock-t">
                  <div className="cic-mock-row__val-main cic-mock-row__val-main--time">
                  <div className="cic-mock-time-pair">
                    <div className="cic-mock-time-pair__cell">
                      <input
                        className="cic-mock-ghost-in"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0"
                        value={years === '' ? '' : String(years)}
                        onChange={(e) => applyNumericField(setYears, e.target.value, 'int')}
                        aria-label="Years"
                      />
                      <span className="cic-mock-time-pair__unit">Years</span>
                    </div>
                    <span className="cic-mock-time-pair__v" aria-hidden />
                    <div className="cic-mock-time-pair__cell">
                      <input
                        className="cic-mock-ghost-in"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0"
                        value={extraMonths === '' ? '' : String(extraMonths)}
                        onChange={(e) => applyNumericField(setExtraMonths, e.target.value, 'int')}
                        aria-label="Months"
                      />
                      <span className="cic-mock-time-pair__unit">Months</span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cic-mock-adv">
              <button
                type="button"
                className="cic-mock-adv__toggle"
                onClick={() => setAdvancedOpen((o) => !o)}
                aria-expanded={advancedOpen}
              >
                <span className="cic-mock-ico-chev" aria-hidden />
                <span className="cic-mock-adv__title">Advanced Options</span>
                <span
                  className={
                    advancedOpen
                      ? 'cic-mock-ico-chev cic-mock-ico-chev--right'
                      : 'cic-mock-ico-chev cic-mock-ico-chev--right cic-mock-ico-chev--collapsed'
                  }
                  aria-hidden
                />
              </button>

              {advancedOpen && (
                <div className="cic-mock-adv__body">
                  <div className="cic-mock-adv__line">
                    <div className="cic-mock-adv__label">Compounding Frequency</div>
                    <div className="cic-mock-adv__field">
                      <label htmlFor="cic-db-compound" className="cic-ref-visually-hidden">
                        Compounding frequency
                      </label>
                      <select
                        id="cic-db-compound"
                        className="cic-mock-sel"
                        value={compounding}
                        onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                      >
                        {COMPOUNDING_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.labelShort}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="cic-mock-adv__line">
                    <div className="cic-mock-adv__label">
                      Monthly Contribution
                      <HelpTip
                        icon="info"
                        text="Money you add each month. In ISA mode we cap subscriptions at £20,000 per tax year."
                      />
                    </div>
                    <div className="cic-mock-adv__field">
                      <input
                        id="cic-db-monthly-contrib"
                        className="cic-mock-txt"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        value={monthlyContribution === '' ? '' : String(monthlyContribution)}
                        onChange={(e) => applyNumericField(setMonthlyContribution, e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="cic-mock-adv__checkline">
                    <label className="cic-check">
                      <input
                        type="checkbox"
                        checked={withdrawalsEnabled}
                        onChange={(e) => setWithdrawalsEnabled(e.target.checked)}
                      />
                      Withdrawals
                    </label>
                  </div>

                  {withdrawalsEnabled && (
                    <div className="cic-mock-adv__line">
                      <div className="cic-mock-adv__label">Monthly withdrawal</div>
                      <div className="cic-mock-adv__field">
                        <input
                          id="cic-db-withdraw"
                          className="cic-mock-txt"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="0"
                          value={monthlyWithdrawal === '' ? '' : String(monthlyWithdrawal)}
                          onChange={(e) => applyNumericField(setMonthlyWithdrawal, e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {compounding === 'daily365' && (
                    <div className="cic-mock-adv__checkline">
                      <label className="cic-check">
                        <input
                          type="checkbox"
                          checked={excludeWeekends}
                          onChange={(e) => setExcludeWeekends(e.target.checked)}
                        />
                        Exclude Weekends
                        <HelpTip
                          icon="info"
                          text="If selected, no interest is applied on Saturday or Sunday (daily 365/yr compounding only)."
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="button" className="cic-btn-calc" onClick={replaceUrl}>
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
                  setRatePeriod(d.ratePeriod)
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
          </div>
        </section>

        <section className="cic-card cic-card--results" id="results">
          <h2 className="cic-card__title">Results</h2>
          <div className="cic-result-summary">
            <p className="cic-result-label">Final balance</p>
            <p className="cic-result-main">{formatMoney(result.finalBalance)}</p>
            <div className="cic-breakdown" aria-label="Breakdown">
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
          </div>
          <ul className="cic-stats">
            <li>
              <strong>ROI</strong>
              <span className="cic-stats__val">{formatPct(result.roiPercent)}</span>
            </li>
            <li>
              <strong>Time to double</strong>
              <span className="cic-stats__val">{doubleLabel}</span>
            </li>
            <li>
              <strong>Effective rate (APY)</strong>
              <span className="cic-stats__val">{formatPct(result.apyPercent)}</span>
            </li>
          </ul>
          {insights.length > 0 && (
            <div className="cic-result-insights" aria-label="Insights">
              <h3 className="cic-result-insights__title">Insights</h3>
              <ul className="cic-result-insights__list">
                {insights.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="cic-card cic-card--wide">
        <div className="cic-section-head">
          <h2 className="cic-card__title">Growth Over Time</h2>
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
          {chartData.length === 0 ? (
            <p className="cic-chart-empty" role="status">
              Add a time period (years and/or months) to see the chart.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 8, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={6}
                  angle={chartHeight < 280 ? -30 : 0}
                  textAnchor={chartHeight < 280 ? 'end' : 'middle'}
                  height={chartHeight < 280 ? 64 : 36}
                />
                <YAxis
                  width={56}
                  tickFormatter={(v) => formatCurrencyAxisCompact(v, displayCurrency)}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                  labelFormatter={(_, p) => (p?.[0]?.payload?.label as string) ?? ''}
                  contentStyle={{
                    background: '#1e293b',
                    border: 'none',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#cbd5e1', fontWeight: 600 }}
                />
                <Legend verticalAlign="bottom" height={40} />
                <Area
                  type="monotone"
                  dataKey="principal"
                  name="Principal"
                  stackId="1"
                  stroke="#d97706"
                  fill="#fef9c3"
                />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  name="Contributions"
                  stackId="1"
                  stroke="#1d4ed8"
                  fill="#3b82f6"
                />
                <Area
                  type="monotone"
                  dataKey="interest"
                  name="Interest"
                  stackId="1"
                  stroke="#16a34a"
                  fill="#4ade80"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="cic-card cic-card--wide">
        <div className="cic-section-head">
          <h2 className="cic-card__title">Detailed Breakdown</h2>
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
                <th>{tablePeriodHeader}</th>
                <th>Deposit</th>
                <th>Interest</th>
                <th>Total interest</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={`${row.period}-${row.monthIndex}-${i}`}>
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
    </div>
  )
}
