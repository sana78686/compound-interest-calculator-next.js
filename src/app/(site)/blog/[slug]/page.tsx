import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getBlogBySlug } from '@/lib/cms/server'
import { absolutizeCmsHtmlServer, siteOriginFromEnv } from '@/lib/cms/html'
import { resolveCmsMediaUrlWithOrigin } from '@/utils/cmsAssetUrl'
import { JsonLdScript } from '@/components/cms/JsonLdScript'
import { langPrefix } from '@/i18n/translations'
import '@/styles/cms-page.css'

export const revalidate = 60

function plainText(html: string) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const data = (await getBlogBySlug(slug, 'en')) as Record<string, string | undefined>
    if (data?._seo_redirect) return { title: 'Blog' }
    const title = String(data?.meta_title || data?.title || 'Blog').trim()
    const description =
      String(data?.meta_description || data?.excerpt || '').trim() || plainText(String(data?.content || '')).slice(0, 160)
    const origin = siteOriginFromEnv()
    const rawImg = data?.og_image || data?.image
    const ogImage =
      rawImg && String(rawImg).trim()
        ? resolveCmsMediaUrlWithOrigin(String(rawImg), origin)
        : ''
    return {
      title,
      description,
      alternates: { canonical: `/blog/${encodeURIComponent(slug)}` },
      openGraph: {
        title,
        description,
        type: 'article',
        url: `/blog/${encodeURIComponent(slug)}`,
        locale: 'en_GB',
        ...(ogImage ? { images: [{ url: ogImage, alt: title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    }
  } catch {
    return { title: 'Blog' }
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let data: Record<string, unknown>
  try {
    data = (await getBlogBySlug(slug, 'en')) as Record<string, unknown>
  } catch {
    notFound()
  }

  const redir = data?._seo_redirect as { locale?: string; slug?: string } | undefined
  if (redir?.locale && redir?.slug) {
    const lp = langPrefix(redir.locale as 'en')
    redirect(`${lp}/blog/${encodeURIComponent(String(redir.slug))}`)
  }

  const title = String(data?.title || 'Blog')
  const origin = siteOriginFromEnv()
  const html = absolutizeCmsHtmlServer(String(data?.content || ''), origin)
  const jsonLd = data?.json_ld as { '@graph'?: unknown[] } | undefined

  return (
    <article className="cms-page cms-blog wrap">
      <JsonLdScript data={jsonLd} />
      <header className="cms-blog-header">
        <h1 className="cms-blog-title">{title}</h1>
      </header>
      <div className="cms-page-content cms-blog-content" dangerouslySetInnerHTML={{ __html: html }} />
      <footer className="cms-page-footer">
        <Link href="/blog" className="cms-page-back">
          ← Blog
        </Link>
        <span className="cms-page-footer-sep"> · </span>
        <Link href="/" className="cms-page-back">
          Home
        </Link>
      </footer>
    </article>
  )
}
