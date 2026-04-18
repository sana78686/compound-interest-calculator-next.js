import { Suspense } from 'react'
import type { Metadata } from 'next'
import CompoundCalculatorDashboard from '@/components/calculator/CompoundCalculatorDashboard'
import { socialMetadata } from '@/lib/seoMetadata'

const title = 'Compound interest results'
const description =
  'View your compound interest projection: final balance, growth chart, and period breakdown.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/results' },
  robots: { index: false, follow: true },
  ...socialMetadata({
    title,
    description,
    path: '/results',
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

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <CompoundCalculatorDashboard isaMode={false} />
    </Suspense>
  )
}
