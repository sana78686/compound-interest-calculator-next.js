'use client'

import { useState } from 'react'
import { resolveCmsMediaUrlWithOrigin } from '@/utils/cmsAssetUrl'

/**
 * Blog card cover image with placeholder on error (matches Vite BlogListPage).
 * @param {{ src?: string, title?: string, siteOrigin: string }} props
 */
export default function BlogCardCover({ src, title, siteOrigin }) {
  const [broken, setBroken] = useState(false)
  const url = src ? resolveCmsMediaUrlWithOrigin(src, siteOrigin) : ''
  if (!url || broken) {
    return <div className="blog-card-image-placeholder" aria-hidden="true" />
  }
  return (
    <img
      src={url}
      alt={title ? `Cover image for ${title}` : 'Blog post'}
      className="blog-card-image"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  )
}
