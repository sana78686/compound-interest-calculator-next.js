'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CompoundingFrequency } from '@/lib/compoundInterest'
import {
  encodeCalculatorParams,
  decodeCalculatorParams,
  getDefaultCalculatorForm,
  canRunSimulation,
  type CalculatorFormState,
  type NumericField,
} from '@/lib/calculatorParams'
import type { CurrencyCode } from '@/lib/currency'
import { CURRENCY_OPTIONS, currencySymbol } from '@/lib/currency'
import HelpTip from '@/components/calculator/HelpTip'
import './CompoundCalculator.css'

type Props = {
  defaultIsaMode: boolean
}

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

export default function CompoundCalculatorInput({ defaultIsaMode }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isaMode, setIsaMode] = useState(defaultIsaMode)
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
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setIsaMode(defaultIsaMode)
  }, [defaultIsaMode])

  useEffect(() => {
    const d = decodeCalculatorParams(searchParams)
    if (!d) return
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

  const sym = currency ? currencySymbol(currency) : ''

  function onIsaToggle(next: boolean) {
    setIsaMode(next)
    const q = encodeCalculatorParams(formState)
    if (next) {
      router.replace(`/isa?${q}`)
    } else {
      router.replace(`/?${q}`)
    }
  }

  function onCalculate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!canRunSimulation(formState)) {
      setFormError('Select a currency, then enter initial investment and annual interest rate.')
      return
    }
    const q = encodeCalculatorParams(formState)
    const path = isaMode ? '/isa/results' : '/results'
    router.push(`${path}?${q}`)
  }

  return (
    <div className="cic-page cic-page--input-only">
      <header className="cic-hero">
        <h1 className="cic-hero__title">Compound Interest Calculator</h1>
        {isaMode && (
          <p className="cic-hero__isa">
            ISA mode — UK Stocks &amp; Shares ISA subscriptions are limited to £20,000 per tax year (6 April – 5
            April). Growth inside an ISA is free of UK income and capital gains tax.
          </p>
        )}
        <p className="cic-hero__sub">
          Enter your numbers below, then open your full results on a separate page (charts and breakdown).
        </p>
      </header>

      <section className="cic-card cic-card--inputs cic-card--single">
        <div className="cic-card__head">
          <h2 className="cic-card__title cic-card__title--with-isa">Investment details</h2>
          <div className="cic-isa-title-toggle">
            <span className="cic-isa-title-toggle__label">
              ISA
              <HelpTip text="Turn this on if you are saving inside a UK Stocks & Shares ISA. We apply the yearly £20,000 subscription limit across tax years." />
            </span>
            <button
              type="button"
              className={`cic-isa-switch ${isaMode ? 'is-on' : ''}`}
              role="switch"
              aria-checked={isaMode}
              aria-label={isaMode ? 'ISA calculator on' : 'ISA calculator off'}
              onClick={() => onIsaToggle(!isaMode)}
            >
              <span className="cic-isa-switch__knob" />
              <span className="cic-isa-switch__text">{isaMode ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>
        <form onSubmit={onCalculate} className="cic-form" noValidate>
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
              {sym ? <span className="cic-prefix">{sym}</span> : <span className="cic-prefix cic-prefix--muted">—</span>}
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
                <HelpTip text="Add 0–11 months on top of the years (for example 5 years and 6 months)." />
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
                  <HelpTip text="Money you add each month after the first month. In ISA mode, we respect the £20,000 per tax year subscription cap." />
                </span>
                <div className="cic-field__row">
                  {sym ? <span className="cic-prefix">{sym}</span> : <span className="cic-prefix cic-prefix--muted">—</span>}
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
                <HelpTip text="If ticked, you take the same amount out every month (after deposits that month)." />
              </label>
              {withdrawalsEnabled && (
                <label className="cic-field">
                  <span className="cic-field__label">
                    Monthly withdrawal
                    <HelpTip text="How much you withdraw each month." />
                  </span>
                  <div className="cic-field__row">
                    {sym ? <span className="cic-prefix">{sym}</span> : <span className="cic-prefix cic-prefix--muted">—</span>}
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
                <HelpTip text="If ticked, no interest is counted on Saturday or Sunday (only applies when compounding is daily)." />
              </label>
            </div>
          )}

          {formError && <p className="cic-form-error" role="alert">{formError}</p>}

          <button type="submit" className="cic-btn-calc">
            View results
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
                setFormError('')
                router.replace(isaMode ? '/isa' : '/')
              }}
            >
              Clear form
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}
