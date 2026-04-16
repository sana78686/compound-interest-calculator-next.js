import { headers } from 'next/headers'
import { CMS_API_BASE, normalizeSiteDomain, CMS_SITE_DOMAIN } from '@/config/cms'

const useDomainInApiPath = process.env.NEXT_PUBLIC_CMS_API_DOMAIN_PATH !== 'false'

function withLocaleQuery(path: string, locale?: string, publicPath?: string) {
  const parts: string[] = []
  if (locale) parts.push(`locale=${encodeURIComponent(locale)}`)
  if (publicPath) parts.push(`public_path=${encodeURIComponent(publicPath)}`)
  if (parts.length === 0) return path
  const joiner = path.includes('?') ? '&' : '?'
  return `${path}${joiner}${parts.join('&')}`
}

/** Site domain for API (server: env or request Host). Next.js 15: headers() is async. */
export async function getSiteDomainForRequest(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_DOMAIN
  if (fromEnv) return normalizeSiteDomain(fromEnv)
  try {
    const hList = await headers()
    const h = hList.get('x-forwarded-host') || hList.get('host') || ''
    const host = h.split(':')[0]
    const n = normalizeSiteDomain(host)
    if (n && n !== 'localhost' && n !== '127.0.0.1') return n
  } catch {
    /* headers() outside request */
  }
  return CMS_SITE_DOMAIN
}

async function fetchPublicJsonUncached(
  path: string,
  locale: string | undefined,
  host: string,
  publicPath?: string,
): Promise<unknown> {
  const rel = withLocaleQuery(path, locale, publicPath)
  const attempts: { root: string; headers: Record<string, string> }[] = []
  if (useDomainInApiPath) {
    attempts.push({
      root: `/${host}/api/public`,
      headers: { Accept: 'application/json' },
    })
    attempts.push({
      root: '/api/public',
      headers: { Accept: 'application/json', 'X-Domain': host },
    })
  } else {
    attempts.push({
      root: '/api/public',
      headers: { Accept: 'application/json', 'X-Domain': host },
    })
  }

  for (let i = 0; i < attempts.length; i += 1) {
    const { root, headers: h } = attempts[i]
    const url = `${CMS_API_BASE}${root}${rel}`
    const res = await fetch(url, { headers: h, next: { revalidate: 60 } })
    if (res.ok) return res.json()
    const retry =
      useDomainInApiPath &&
      i === 0 &&
      attempts.length > 1 &&
      (res.status === 404 || res.status === 403)
    if (retry) continue
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { message?: string }).message || `HTTP ${res.status}`)
  }
  throw new Error('Public API request failed')
}

export async function getHomePageContent(locale: string, publicPath: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached('/home-content', locale, host, publicPath) as Promise<{
    content?: string
    json_ld?: { '@graph'?: unknown[] }
  }>
}

export async function getBlogBySlug(slug: string, locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached(
    `/blogs/${encodeURIComponent(slug)}`,
    locale,
    host,
  ) as Promise<Record<string, unknown>>
}

export async function getBlogs(locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached('/blogs', locale, host) as Promise<{
    blogs?: unknown[]
    json_ld?: unknown
    data?: unknown[]
  }>
}

export async function getPageBySlug(slug: string, locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached(`/pages/${encodeURIComponent(slug)}`, locale, host) as Promise<
    Record<string, unknown>
  >
}

export async function getLegalPage(slug: string, locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached(`/legal/${encodeURIComponent(slug)}`, locale, host) as Promise<
    Record<string, unknown>
  >
}

export async function getContactSettings(locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached('/contact', locale, host) as Promise<Record<string, unknown>>
}

export async function getPages(locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached('/pages', locale, host) as Promise<{ pages?: { id: number; title: string; slug: string; placement?: string }[] }>
}

export async function getLegalNav(locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached('/legal-nav', locale, host) as Promise<{ legal?: Record<string, boolean> }>
}

export async function getFaq(locale: string) {
  const host = await getSiteDomainForRequest()
  return fetchPublicJsonUncached('/faq', locale, host) as Promise<{ faq?: { question?: string; answer?: string }[] }>
}
