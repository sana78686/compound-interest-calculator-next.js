'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { usePathLang } from '@/hooks/usePathLang'
import { buildSiteBreadcrumbItems } from '@/utils/breadcrumbTrail'
import './Breadcrumbs.css'

export default function Breadcrumbs() {
  const lang = usePathLang()
  const pathname = usePathname() || '/'
  const t = useTranslation(lang)
  const items = useMemo(() => buildSiteBreadcrumbItems(pathname, t), [pathname, t])

  if (!items?.length) return null

  return (
    <nav className="site-breadcrumbs" aria-label="Breadcrumb">
      <ol className="site-breadcrumbs-list">
        {items.map((crumb, i) => {
          const last = i === items.length - 1
          const to = 'to' in crumb && typeof crumb.to === 'string' ? crumb.to : undefined
          return (
            <li key={`${crumb.label}-${i}-${to ?? ''}`} className="site-breadcrumbs-item">
              {last || !to ? (
                <span className="site-breadcrumbs-current" aria-current={last ? 'page' : undefined}>
                  {crumb.label}
                </span>
              ) : (
                <Link className="site-breadcrumbs-link" href={to}>
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
