'use client'

import { usePathname } from 'next/navigation'
import { defaultLang, supportedLangs } from '@/i18n/translations'

/** English only — always default locale. */
export function usePathLang() {
  const pathname = usePathname() || '/'
  for (const lang of supportedLangs) {
    if (lang === defaultLang) continue
    const prefix = `/${lang}`
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return lang
    }
  }
  return defaultLang
}
