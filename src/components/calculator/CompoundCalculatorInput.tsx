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
import { CURRENCY_OPTIONS } from '@/lib/currency'
import type { InterestRatePeriod } from '@/lib/compoundModes'
import { COMPOUNDING_OPTIONS, INTEREST_RATE_PERIOD_OPTIONS } from '@/lib/compoundModes'
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
  const [ratePeriod, setRatePeriod] = useState<InterestRatePeriod>('annual')
  const [years, setYears] = useState<NumericField>('')
  const [extraMonths, setExtraMonths] = useState<NumericField>('')
  const [compounding, setCompounding] = useState<CompoundingFrequency>('daily365')
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
    setRatePeriod(d.ratePeriod)
    setYears(d.years)
    setExtraMonths(d.extraMonths)
    setCompounding(d.compounding)
    setMonthlyContribution(d.monthlyContribution)
    setWithdrawalsEnabled(d.withdrawalsEnabled)
    setMonthlyWithdrawal(d.monthlyWithdrawal)
    setExcludeWeekends(d.excludeWeekends)
  }, [searchParams])

  useEffect(() => {
    if (compounding !== 'daily365' && excludeWeekends) setExcludeWeekends(false)
  }, [compounding, excludeWeekends])

  useEffect(() => {
    if (!formError) return
    document.getElementById('cic-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [formError])

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

  function onIsaToggle(next: boolean) {
    setIsaMode(next)
    const q = encodeCalculatorParams(formState)
    if (next) {
      router.replace(`/isa?${q}`)
    } else {
      router.replace(`/?${q}`)
    }
  }

  function goToResults() {
    if (!canRunSimulation(formState)) {
      setFormError('Choose a currency, enter initial investment and interest rate.')
      return
    }
    setFormError('')
    const q = encodeCalculatorParams(formState)
    const path = isaMode ? '/isa/results' : '/results'
    // Use full navigation so the results page always loads; avoids next/router no-op edge cases
    if (typeof window !== 'undefined') {
      window.location.assign(`${path}?${q}`)
    }
  }

  function onCalcFieldsKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    const t = e.target
    if (t instanceof HTMLSelectElement) return
    if (t instanceof HTMLInputElement && t.type === 'checkbox') return
    if (t instanceof HTMLInputElement) {
      e.preventDefault()
      goToResults()
    }
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
        <div className="cic-badges">
          <span className="cic-badge">★ Trusted by millions</span>
          <span className="cic-badge cic-badge--warm">★ Accurate &amp; fast</span>
        </div>
      </header>

      <section className="cic-card cic-card--inputs cic-card--single">
        <div className="cic-card__head">
          <h2 className="cic-card__title cic-card__title--with-isa cic-card__title--details">Investment Details</h2>
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
        <hr className="cic-card__hr" aria-hidden />
        <div
          className="cic-form cic-form--mock"
          role="group"
          aria-label="Calculator inputs"
          onKeyDown={onCalcFieldsKeyDown}
        >
          <div className="cic-mock-primary">
            <div className="cic-mock-row">
              <span className="cic-mock-row__label" id="cic-lbl-mock-p">
                Initial Investment
                <span className="cic-req" aria-hidden="true">
                  {' '}
                  *
                </span>
              </span>
              <div
                className="cic-mock-row__value"
                role="group"
                aria-labelledby="cic-lbl-mock-p"
              >
                <div className="cic-mock-row__val-main">
                  <input
                    id="cic-principal"
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
                  <label htmlFor="cic-currency-main" className="cic-ref-visually-hidden">
                    Currency
                  </label>
                  <select
                    id="cic-currency-main"
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
              <span className="cic-mock-row__label" id="cic-lbl-mock-r">
                Annual Interest Rate
                <span className="cic-req" aria-hidden="true">
                  {' '}
                  *
                </span>
              </span>
              <div className="cic-mock-row__value" role="group" aria-labelledby="cic-lbl-mock-r">
                <div className="cic-mock-row__val-main">
                  <div className="cic-mock-rate__left">
                    <input
                      id="cic-annual-rate"
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
                  <label htmlFor="cic-rate-period" className="cic-ref-visually-hidden">
                    Rate applies per
                  </label>
                  <select
                    id="cic-rate-period"
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
              <span className="cic-mock-row__label" id="cic-lbl-mock-t">
                Time Period
              </span>
              <div
                className="cic-mock-row__value"
                role="group"
                aria-labelledby="cic-lbl-mock-t"
              >
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
                    <label htmlFor="cic-compound" className="cic-ref-visually-hidden">
                      Compounding frequency
                    </label>
                    <select
                      id="cic-compound"
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
                      id="cic-monthly-contrib"
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
                        id="cic-monthly-withdraw"
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

          {formError && (
            <p id="cic-form-error" className="cic-form-error" role="alert">
              {formError}
            </p>
          )}

          <button type="button" className="cic-btn-calc" onClick={goToResults}>
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
                setFormError('')
                router.replace(isaMode ? '/isa' : '/')
              }}
            >
              Clear form
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}
