# Compound Interest Calculator (Next.js + CMS)

UK-focused **compound interest calculator** with optional **ISA** mode (£20,000 subscription cap per tax year), **Recharts** growth chart, detailed table, and auto-generated insights. Blog, contact, legal, and dynamic CMS pages work like `compressedpdf-next` (English locale **`en`** only).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Standard calculator — main **H1**: “Compound Interest Calculator” |
| `/calculator/isa` | ISA calculator (same H1 + ISA copy; applies UK allowance logic) |
| `/blog`, `/contact`, `/page/…`, `/legal/…` | CMS (same API env as other SEO apps) |

There is **no** language switcher; more locales can be added later.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Default dev port: **3001** (see `package.json`).

## Documentation

- **`docs/COMPOUND_INTEREST_CALCULATOR.md`** — plain-English explanation of compound interest, formulas, ISA handling, charts, insights, and what comes from the CMS vs the browser.

## Build

```bash
npm run build
```

Use **`npm run build:clean`** if `.next` cache causes odd errors on Windows.
