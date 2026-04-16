import Link from 'next/link'
import { getBlogs } from '@/lib/cms/server'
import { JsonLdScript } from '@/components/cms/JsonLdScript'
import { siteOriginFromEnv } from '@/lib/cms/html'
import { translations, langPrefix } from '@/i18n/translations'
import BlogCardCover from '@/components/blog/BlogCardCover'
import '@/styles/BlogListPage.css'

type Locale = 'en'

type BlogPost = {
  id: number
  title: string
  slug: string
  excerpt?: string
  published_at?: string
  og_image?: string
  image?: string
}

function normalizeBlogs(res: unknown): BlogPost[] {
  if (Array.isArray(res)) return res as BlogPost[]
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>
    const raw = Array.isArray(o.blogs)
      ? o.blogs
      : Array.isArray(o.data)
        ? o.data
        : []
    return raw as BlogPost[]
  }
  return []
}

function formatDate(iso: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' })
  } catch {
    return iso
  }
}

export async function BlogListView({ locale }: { locale: Locale }) {
  const res = await getBlogs(locale)
  const blogs = normalizeBlogs(res)
  const jsonLd =
    res && typeof res === 'object' && 'json_ld' in res ? (res as { json_ld?: unknown }).json_ld : null
  const b = translations[locale].blog
  const lp = langPrefix(locale)
  const origin = siteOriginFromEnv()

  return (
    <article className="blog-list-page wrap">
      <JsonLdScript data={jsonLd} />
      <header className="blog-list-header">
        <h1 className="blog-list-title">{b.listTitle}</h1>
        <p className="blog-list-intro">{b.listIntro}</p>
      </header>
      {blogs.length === 0 ? (
        <div className="blog-list-empty-state" role="status" aria-live="polite">
          <h2 className="blog-list-empty-title">{b.emptyTitle}</h2>
          <p className="blog-list-empty-text">{b.emptyBody}</p>
        </div>
      ) : (
        <div className="blog-list-grid">
          {blogs.map((post) => (
            <Link
              key={post.id}
              href={`${lp}/blog/${encodeURIComponent(post.slug)}`}
              className="blog-card"
            >
              <div className="blog-card-image-wrap">
                <BlogCardCover
                  src={post.og_image || post.image}
                  title={post.title}
                  siteOrigin={origin}
                />
              </div>
              <div className="blog-card-body">
                {post.published_at && (
                  <time className="blog-card-date" dateTime={post.published_at}>
                    {formatDate(post.published_at)}
                  </time>
                )}
                <h2 className="blog-card-title">{post.title}</h2>
                {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                <span className="blog-card-link">{b.readMore} →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <footer className="blog-list-footer">
        <Link href={`${lp}/`} className="blog-list-back">
          ← {b.backHome}
        </Link>
      </footer>
    </article>
  )
}
