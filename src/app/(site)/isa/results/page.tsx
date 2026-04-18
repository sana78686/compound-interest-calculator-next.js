import { Suspense } from 'react'
import type { Metadata } from 'next'
import CompoundCalculatorDashboard from '@/components/calculator/CompoundCalculatorDashboard'
import { socialMetadata } from '@/lib/seoMetadata'

const title = 'ISA compound interest results'
const description =
  'View your Stocks & Shares ISA projection with UK subscription limits, charts, and breakdown.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/isa/results' },
  robots: { index: false, follow: true },
  ...socialMetadata({
    title,
    description,
    path: '/isa/results',
    ogLocale: 'en_GB',
  }),
}

function ResultsFallback() {
  return (
    <div className="cic-page" aria-busy="true">
      <p className="cic-hero__sub">Loading results…</p>
    </div>
  )
}

export default function IsaResultsPage() {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <CompoundCalculatorDashboard isaMode />
    </Suspense>
  )
}
