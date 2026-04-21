'use client'

import Link from 'next/link'
import { ucWords } from '@/utils/ucWords'
import './Footer.css'

const LEGAL_SLUG_ORDER = ['terms', 'privacy-policy', 'disclaimer', 'about-us', 'cookie-policy']

const LEGAL_LABEL_KEY = {
  terms: 'footerTerms',
  'privacy-policy': 'footerPrivacy',
  disclaimer: 'footerDisclaimer',
  'about-us': 'footerAbout',
  'cookie-policy': 'footerCookies',
}

type FooterPage = { id: number; title: string; slug: string; placement?: string }

type FooterProps = {
  lang: string
  t: (key: string, params?: Record<string, string | number>) => string
  footerPages?: FooterPage[]
  legalVisibility?: Record<string, boolean>
}

export default function Footer({
  t,
  footerPages = [],
  legalVisibility = {},
}: FooterProps) {
  const cmsFooterLinks = footerPages.filter(
    (p) => p.placement === 'footer' || p.placement === 'both',
  )

  const legalLinksToShow = LEGAL_SLUG_ORDER.filter((slug) => legalVisibility[slug])
  const showLegalColumn = legalLinksToShow.length > 0

  return (
    <footer className="footer footer--dark">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-columns">
            <div className="footer-col">
              <h3 className="footer-col-title">{t('footerCompany')}</h3>
              <ul className="footer-col-list">
                <li>
                  <Link href="/blog">{t('footerBlog')}</Link>
                </li>
                <li>
                  <Link href="/contact">{t('footerContact')}</Link>
                </li>
                <li>
                  <Link href="/isa">ISA calculator</Link>
                </li>
              </ul>
            </div>
            {cmsFooterLinks.length > 0 && (
              <div className="footer-col">
                <h3 className="footer-col-title">{t('footerOther')}</h3>
                <ul className="footer-col-list">
                  {cmsFooterLinks.map((p) => (
                    <li key={p.id}>
                      <Link href={`/page/${p.slug}`}>{ucWords(p.title)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showLegalColumn && (
              <div className="footer-col">
                <h3 className="footer-col-title">{t('footerLegal')}</h3>
                <ul className="footer-col-list">
                  {legalLinksToShow.map((slug) => (
                    <li key={slug}>
                      <Link href={`/legal/${slug}`}>
                        {t(LEGAL_LABEL_KEY[slug as keyof typeof LEGAL_LABEL_KEY])}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copy">{t('footerCopyrightLine')}</p>
        </div>
      </div>
    </footer>
  )
}
