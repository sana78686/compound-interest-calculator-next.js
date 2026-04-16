import type { Metadata } from 'next'
import ContactPageClient from '@/components/contact/ContactPageClient'
import { translations } from '@/i18n/translations'
import { socialMetadata } from '@/lib/seoMetadata'

const c = translations.en.contact

export const metadata: Metadata = {
  title: c.title,
  description: c.intro,
  alternates: { canonical: '/contact' },
  ...socialMetadata({
    title: c.title,
    description: c.intro,
    path: '/contact',
    ogLocale: 'en_GB',
  }),
}

export default function ContactPage() {
  return <ContactPageClient />
}
