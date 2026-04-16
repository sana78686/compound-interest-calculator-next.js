'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
import {
  type CompoundingFrequency,
  simulateCompoundInterest,
  buildInsights,
} from '@/lib/compoundInterest'
import './CompoundCalculator.css'

function formatMoney(n: number) {
  return n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 })
}

function formatPct(n: number) {
  return `${n.toLocaleString('en-GB', { maximumFractionDigits: 2 })}%`
}

type ChartGranularity = 'monthly' | 'yearly' | 'daily'
type TableGranularity = 'monthly' | 'yearly' | 'daily'

type Props = {
  isaMode: boolean
}

export default function CompoundCalculatorClient({ isaMode }: Props) {
  const [principal, setPrincipal] = useState(5000)
  const [annualRate, setAnnualRate] = useState(5)
  const [years, setYears] = useState(5)
  const [extraMonths, setExtraMonths] = useState(0)
  const [compounding, setCompounding] = useState<CompoundingFrequency>('daily')
  const [monthlyContribution, setMonthlyContribution] = useState(100)
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(false)
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(0)
  const [excludeWeekends, setExcludeWeekends] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(true)
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('monthly')
  const [tableGranularity, setTableGranularity] = useState<TableGranularity>('monthly')

  const params = useMemo(
    () => ({
      initialPrincipal: principal,
      annualRatePercent: annualRate,
      years,
      extraMonths,
      compoundingFrequency: compounding,
      monthlyContribution,
      monthlyWithdrawal,
      withdrawalsEnabled,
      excludeWeekends,
      isaMode,
      startDate: new Date(),
    }),
    [
      principal,
      annualRate,
      years,
      extraMonths,
      compounding,
      monthlyContribution,
      monthlyWithdrawal,
      withdrawalsEnabled,
      excludeWeekends,
      isaMode,
    ],
  )

  const result = useMemo(() => simulateCompoundInterest(params), [params])
  const insights = useMemo(() => buildInsights(result, params), [result, params])

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
    // daily: sample last day each month for readability
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

  function onCalculate(e: React.FormEvent) {
    e.preventDefault()
  }

  const doubleLabel =
    result.doubleTimeMonths != null
      ? `${Math.floor(result.doubleTimeMonths / 12)} years ${result.doubleTimeMonths % 12} months`
      : '—'

  return (
    <div className="cic-page">
      <header className="cic-hero">
        <h1 className="cic-hero__title">Compound Interest Calculator</h1>
        {isaMode && (
          <p className="cic-hero__isa">
            ISA mode — UK Stocks &amp; Shares ISA subscriptions are limited to £20,000 per tax year (6 April – 5
            April). Growth inside an ISA is free of UK income and capital gains tax.
          </p>
        )}
        <p className="cic-hero__sub">
          Calculate the growth of your investments with {compounding === 'daily' ? 'daily' : compounding}{' '}
          compounding.
        </p>
        <div className="cic-badges">
          <span className="cic-badge">★ Trusted by millions</span>
          <span className="cic-badge">★ Accurate &amp; fast</span>
        </div>
      </header>

      <div className="cic-switch">
        {isaMode ? (
          <Link href="/" className="cic-switch__link">
            ← Standard calculator (non-ISA)
          </Link>
        ) : (
          <Link href="/calculator/isa" className="cic-switch__link">
            ISA calculator (tax-year allowance) →
          </Link>
        )}
      </div>

      <div className="cic-grid">
        <section className="cic-card cic-card--inputs">
          <h2 className="cic-card__title">Investment details</h2>
          <form onSubmit={onCalculate} className="cic-form">
            <label className="cic-field">
              <span className="cic-field__label">Initial investment</span>
              <div className="cic-field__row">
                <span className="cic-prefix">£</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                />
              </div>
            </label>
            <label className="cic-field">
              <span className="cic-field__label">Annual interest rate</span>
              <div className="cic-field__row">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value))}
                />
                <span className="cic-suffix">%</span>
              </div>
            </label>
            <div className="cic-field cic-field--split">
              <label>
                <span className="cic-field__label">Years</span>
                <input
                  type="number"
                  min={0}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                />
              </label>
              <label>
                <span className="cic-field__label">Months</span>
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={extraMonths}
                  onChange={(e) => setExtraMonths(Number(e.target.value))}
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
                  <span className="cic-field__label">Compounding frequency</span>
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
                  <span className="cic-field__label">Monthly contribution</span>
                  <div className="cic-field__row">
                    <span className="cic-prefix">£</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    />
                    <span className="cic-info" title="Added at the start of each month after the first.">
                      ⓘ
                    </span>
                  </div>
                </label>
                <label className="cic-check">
                  <input
                    type="checkbox"
                    checked={withdrawalsEnabled}
                    onChange={(e) => setWithdrawalsEnabled(e.target.checked)}
                  />
                  Withdrawals
                </label>
                {withdrawalsEnabled && (
                  <label className="cic-field">
                    <span className="cic-field__label">Monthly withdrawal</span>
                    <div className="cic-field__row">
                      <span className="cic-prefix">£</span>
                      <input
                        type="number"
                        min={0}
                        value={monthlyWithdrawal}
                        onChange={(e) => setMonthlyWithdrawal(Number(e.target.value))}
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
                  <span className="cic-info" title="No interest accrues on Saturday or Sunday.">
                    ⓘ
                  </span>
                </label>
              </div>
            )}

            <button type="submit" className="cic-btn-calc">
              Calculate
            </button>
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
                tickFormatter={(v) => `£${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`}
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
