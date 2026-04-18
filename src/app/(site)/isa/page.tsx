import { Suspense } from 'react'
import type { Metadata } from 'next'
import CompoundCalculatorInput from '@/components/calculator/CompoundCalculatorInput'
import { socialMetadata } from '@/lib/seoMetadata'

const title = 'Compound Interest Calculator (ISA)'
const description =
  'Compound interest calculator with UK ISA subscription limits: £20,000 per tax year (6 April – 5 April). Tax-free growth inside a Stocks & Shares ISA.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/isa' },
  ...socialMetadata({
    title,
    description,
    path: '/isa',
    ogLocale: 'en_GB',
  }),
}

function InputFallback() {
  return (
    <div className="cic-page" aria-busy="true">
      <p className="cic-hero__sub">Loading calculator…</p>
    </div>
  )
}

export default function IsaCalculatorPage() {
  return (
    <Suspense fallback={<InputFallback />}>
      <CompoundCalculatorInput defaultIsaMode />
    </Suspense>
  )
}
