import type { Metadata } from 'next'
import CompoundCalculatorClient from '@/components/calculator/CompoundCalculatorClient'
import { socialMetadata } from '@/lib/seoMetadata'

const title = 'Compound Interest Calculator'
const description =
  'Free UK compound interest calculator with daily compounding, monthly contributions, charts, and optional Stocks & Shares ISA allowance ( £20,000 per tax year ).'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/' },
  ...socialMetadata({
    title,
    description,
    path: '/',
    ogLocale: 'en_GB',
  }),
}

export default function HomePage() {
  return <CompoundCalculatorClient isaMode={false} />
}
