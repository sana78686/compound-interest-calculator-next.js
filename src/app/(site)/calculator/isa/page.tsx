import type { Metadata } from 'next'
import CompoundCalculatorClient from '@/components/calculator/CompoundCalculatorClient'
import { socialMetadata } from '@/lib/seoMetadata'

const title = 'Compound Interest Calculator (ISA)'
const description =
  'Compound interest calculator with UK ISA subscription limits: £20,000 per tax year (6 April – 5 April). Tax-free growth inside a Stocks & Shares ISA.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/calculator/isa' },
  ...socialMetadata({
    title,
    description,
    path: '/calculator/isa',
    ogLocale: 'en_GB',
  }),
}

export default function IsaCalculatorPage() {
  return <CompoundCalculatorClient isaMode />
}
