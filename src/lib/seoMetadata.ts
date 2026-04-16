import type { Metadata } from 'next'

/** Open Graph + Twitter cards (use with `metadataBase` in root layout). */
export function socialMetadata(input: {
  title: string
  description: string
  /** Path on this site, e.g. `/blog` — resolved with `metadataBase`. */
  path: string
  /** e.g. `id_ID`, `en_US` */
  ogLocale?: string
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const { title, description, path, ogLocale } = input
  return {
    openGraph: {
      title,
      description,
      type: 'website',
      url: path,
      ...(ogLocale ? { locale: ogLocale } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
