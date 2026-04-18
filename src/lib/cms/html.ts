/**
 * Fix rich-text HTML for SSR: resolve relative CMS paths using public site origin.
 */
export function absolutizeCmsHtmlServer(html: string, siteOrigin: string): string {
  if (!html || typeof html !== 'string') return html
  const origin = siteOrigin.replace(/\/+$/, '')
  return html.replace(
    /\b(src|href)=(["'])((?:https?:\/\/[^"']+)?\/(?:storage|uploads|media|cms-uploads)\/[^"']+)\2/gi,
    (_attr, attr: string, q: string, urlPart: string) => {
      if (/^https?:\/\//i.test(urlPart)) {
        try {
          const u = new URL(urlPart)
          if (u.pathname.startsWith('/uploads/') || u.pathname.startsWith('/cms-uploads/')) {
            return `${attr}=${q}${origin}${u.pathname}${u.search || ''}${q}`
          }
        } catch {
          /* keep */
        }
        return `${attr}=${q}${urlPart}${q}`
      }
      return `${attr}=${q}${origin}${urlPart.startsWith('/') ? '' : '/'}${urlPart}${q}`
    },
  )
}

/**
 * Build an absolute origin (with scheme). Values like `localhost:3004` without `http://`
 * would break `new URL()` in metadata and cause 500s.
 */
function normalizeAbsoluteOrigin(raw: string): string {
  const s = raw.trim().replace(/\/+$/, '')
  if (!s) return 'http://localhost:3000'
  if (/^https?:\/\//i.test(s)) return s
  if (
    s === 'localhost' ||
    s.startsWith('localhost:') ||
    s === '127.0.0.1' ||
    s.startsWith('127.0.0.1:')
  ) {
    return `http://${s}`
  }
  return `https://${s}`
}

export function siteOriginFromEnv(): string {
  const explicit = String(process.env.NEXT_PUBLIC_SITE_ORIGIN || '').trim()
  if (explicit) return normalizeAbsoluteOrigin(explicit)
  const d = String(process.env.NEXT_PUBLIC_SITE_DOMAIN || 'compound-interest.example').trim()
  return normalizeAbsoluteOrigin(d)
}

/** Safe for Next.js `metadata.metadataBase` (must be a valid absolute URL). */
export function metadataBaseFromEnv(): URL {
  try {
    const siteUrl = siteOriginFromEnv()
    return new URL(siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`)
  } catch {
    return new URL('http://localhost:3000/')
  }
}
