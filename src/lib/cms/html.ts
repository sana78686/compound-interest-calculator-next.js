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

export function siteOriginFromEnv(): string {
  const explicit = String(process.env.NEXT_PUBLIC_SITE_ORIGIN || '').trim().replace(/\/+$/, '')
  if (explicit) return explicit
  const d = String(process.env.NEXT_PUBLIC_SITE_DOMAIN || 'compound-interest.example').trim()
  if (d === 'localhost' || d === '127.0.0.1') return `http://${d}`
  return `https://${d}`
}
