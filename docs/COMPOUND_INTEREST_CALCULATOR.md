# Compound interest calculator — how it works

This document explains, in plain English, what compound interest is, what formulas the calculator uses, where the numbers come from, and how the “Insights” section is built.

## What is compound interest?

Compound interest means you earn interest **on your interest**, not only on your original deposit. Each time interest is added to your balance, the next period’s interest is calculated on that larger amount. Over time, growth can speed up compared with simple interest (where interest is only calculated on the original principal).

## What data do you enter?

All inputs come from **you** in the browser. Nothing is sent to our servers for the calculation:

- **Initial investment** — your starting balance (in £).
- **Annual interest rate** — the headline yearly rate (as a percentage).
- **Years and months** — how long you want to run the investment.
- **Advanced options** — compounding frequency, monthly contributions, optional withdrawals, and (for daily compounding) whether to exclude weekends from accruing interest.

The **ISA calculator** page uses the same maths, but applies **UK ISA subscription rules** (see below).

## Formulas used

### 1. Daily rate from an annual rate

If the annual rate is \(r\) (as a decimal, e.g. 5% → 0.05), we convert to a **daily** effective rate:

\[
\text{dailyRate} = (1 + r)^{1/365} - 1
\]

Interest is then applied day by day (unless weekends are excluded, in which case we skip interest on Saturday and Sunday).

### 2. Monthly rate from an annual rate

\[
\text{monthlyRate} = (1 + r)^{1/12} - 1
\]

We apply this once per month when you choose **monthly** compounding.

### 3. Yearly compounding

When you choose **yearly** compounding, we apply the annual rate once at the end of each **12-month** block from the start date. Periods shorter than a full year may not receive a full year’s interest until the schedule reaches a full year boundary (this is a limitation of strict “once per year” crediting).

### 4. APY (effective annual rate)

The result screen shows an **APY** figure using the standard nominal compounding formula:

\[
\text{APY} = \left(1 + \frac{r}{n}\right)^n - 1
\]

where \(n\) is 365 for daily, 12 for monthly, or 1 for yearly compounding.

### 5. ROI (return on investment)

Return on investment is shown as:

\[
\text{ROI} = \frac{\text{final balance} - \text{total money you put in}}{\text{total money you put in}} \times 100\%
\]

“Total money you put in” means **initial principal + all monthly contributions** (after any ISA capping).

## How results are calculated (step by step)

1. Start with your **initial principal**.
2. For each **month** in the timeline:
   - **After the first month**, add your **monthly contribution** (if any). In **ISA mode**, each subscription is limited by the UK’s **£20,000 per tax year** allowance (see below).
   - If **withdrawals** are enabled, subtract the monthly withdrawal amount.
   - Apply **interest** according to the compounding frequency:
     - **Daily**: for each day in the month, multiply the balance by \((1 + \text{dailyRate})\), optionally skipping weekends.
     - **Monthly**: multiply once by \((1 + \text{monthlyRate})\).
     - **Yearly**: multiply by \((1 + r)\) at the end of each full year block.
3. **Final balance** = balance after the last period.
4. **Interest** = final balance − (principal + contributions).

Everything runs **in your browser** (`simulateCompoundInterest` in `src/lib/compoundInterest.ts`).

## ISA mode (£20,000 per tax year)

UK **Stocks & Shares ISA** rules (simplified for this tool):

- Each **tax year** runs from **6 April** to **5 April** the following year.
- You can **subscribe** (pay in) new money up to **£20,000** across your ISAs in that tax year.

In **ISA mode**, when you add a monthly contribution, we only count up to what is still **allowed** in the current tax year. Any amount above that is **not** added to the balance (and we track how much was “capped” so we can mention it in Insights).

**Important:** This is a **model** for education and SEO. It is not tax advice. Real ISA rules, product types, and your personal allowance may differ.

## Charts and tables

- **Charts** use the **monthly snapshots** from the same simulation. The stacked areas show:
  - **Principal** — your initial lump sum (constant layer),
  - **Contributions** — cumulative deposits you added,
  - **Interest** — everything else (growth).
- **Tables** are built from the same monthly rows; you can switch granularity (monthly / yearly / sampled) for the view.

## Insights — where the text comes from

**Insights** are **not** loaded from the CMS or an external API. They are **generated in the browser** from your inputs and the simulation result, using simple rules in `buildInsights()` (for example, comparing interest to contributions over time, or mentioning daily vs monthly compounding). If you use ISA mode and contributions were capped, an insight can mention that too.

## Blog and CMS content

Articles, legal pages, and dynamic CMS pages are loaded from your **Laravel / GlobalCMS** API (same as the rest of the site). That content is **separate** from the calculator: it is fetched when you open blog, contact, or legal routes, not when you click Calculate.

## Summary

| Item | Source |
|------|--------|
| Calculator numbers | Your inputs + formulas in `src/lib/compoundInterest.ts` (browser-side) |
| Charts / tables | Derived from the same simulation |
| Insights | Generated rules in code — not from the CMS |
| Blog, contact, legal | CMS / API |

If you change rates or tax rules for production, update the code and this document together.
