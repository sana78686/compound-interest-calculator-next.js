'use client'

import { useEffect, lazy, Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { getPages, getLegalNav, getFaq } from '@/lib/cms-client'
import BrandLogo from './BrandLogo'
import Breadcrumbs from './Breadcrumbs'
import { SITE_BRAND_MARK } from '@/constants/brand'
import { ucWords } from '@/utils/ucWords'
import '@/components/calculator/CompoundCalculator.css'

function faqListHasContent(res: { faq?: { question?: string; answer?: string }[] }) {
  const list = res?.faq
  if (!Array.isArray(list) || list.length === 0) return false
  return list.some((item) => {
    const strip = (s: string | undefined) =>
      String(s ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    return strip(item.question).length > 0 || strip(item.answer).length > 0
  })
}

const Footer = lazy(() => import('./Footer'))

const LOCALE = 'en' as const

const CALC_FLOW_PATHS = new Set(['/', '/isa', '/results', '/isa/results'])

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const calcFlow = CALC_FLOW_PATHS.has(pathname)
  const t = useTranslation(LOCALE)
  const [footerPages, setFooterPages] = useState<{ id: number; title: string; slug: string; placement?: string }[]>(
    [],
  )
  const [legalVisibility, setLegalVisibility] = useState<Record<string, boolean>>({})
  const [showFaqLink, setShowFaqLink] = useState(false)

  const headerCmsPages = useMemo(
    () => footerPages.filter((p) => p.placement === 'header' || p.placement === 'both'),
    [footerPages],
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getPages(LOCALE).catch(() => ({ pages: [] })),
      getLegalNav(LOCALE).catch(() => ({ legal: {} })),
      getFaq(LOCALE).catch(() => ({ faq: [] })),
    ]).then(([pagesRes, legalNavRes, faqRes]) => {
      if (cancelled) return
      setFooterPages(Array.isArray(pagesRes?.pages) ? pagesRes.pages : [])
      const legal = legalNavRes?.legal
      setLegalVisibility(
        legal && typeof legal === 'object' && !Array.isArray(legal)
          ? (legal as Record<string, boolean>)
          : {},
      )
      setShowFaqLink(faqListHasContent(faqRes))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  }, [])

  return (
    <div className={calcFlow ? 'home-page home-page--calc-flow' : 'home-page'}>
      <header className={`header cic-header--calc ${calcFlow ? 'cic-header--calc-v2' : ''}`}>
        <div className="header-inner header-inner--minimal">
          <BrandLogo href="/" ariaLabel={t('nav.home')} text={SITE_BRAND_MARK} />
          <nav className="header-primary-links" aria-label="Site">
            <Link href="/">Calculator</Link>
            <Link href="/isa">ISA calculator</Link>
            <Link href="/blog">Guides</Link>
            <Link href="/contact">About</Link>
          </nav>
          {headerCmsPages.length > 0 && (
            <nav className="header-cms-nav" aria-label="Site pages">
              <ul className="header-cms-nav-list">
                {headerCmsPages.map((p) => (
                  <li key={p.id}>
                    <Link href={`/page/${p.slug}`} className="header-cms-nav-link">
                      {ucWords(p.title)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" className="main cms-main" tabIndex={-1}>
        <Breadcrumbs />
        {children}
      </main>

      <Suspense fallback={<div className="footer-placeholder" aria-hidden="true" />}>
        <Footer
          lang={LOCALE}
          t={t}
          footerPages={footerPages}
          legalVisibility={legalVisibility}
          showFaqLink={showFaqLink}
        />
      </Suspense>
    </div>
  )
}
