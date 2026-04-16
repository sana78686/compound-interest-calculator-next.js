import type { MetadataRoute } from 'next'
import { siteOriginFromEnv } from '@/lib/cms/html'

export default function robots(): MetadataRoute.Robots {
  const base = siteOriginFromEnv().replace(/\/+$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
