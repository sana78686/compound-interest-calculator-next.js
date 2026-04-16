import { useId } from 'react'

type BrandLogoProps = {
  href: string
  ariaLabel: string
  text: string
}

/**
 * Professional wordmark + mark: layered PDF sheets with tapering lines (file-size metaphor).
 */
export default function BrandLogo({ href, ariaLabel, text }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '_')

  return (
    <a href={href} className="logo logo--brand" dir="ltr" aria-label={ariaLabel}>
      <span className="logo-icon-wrap" aria-hidden="true">
        <svg className="logo-icon-svg" viewBox="0 0 40 40" width="40" height="40" role="img">
          <defs>
            <linearGradient id={`${uid}_g`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e85555" />
              <stop offset="55%" stopColor="#e03d3d" />
              <stop offset="100%" stopColor="#b82e2e" />
            </linearGradient>
            <filter id={`${uid}_s`} x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodOpacity="0.14" />
            </filter>
          </defs>
          <rect width="40" height="40" rx="11" fill={`url(#${uid}_g)`} filter={`url(#${uid}_s)`} />
          <path
            d="M11 9.5h13.5l3 3v16.5a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V11.5a2 2 0 0 1 2-2z"
            fill="#fff"
            opacity="0.2"
          />
          <path
            d="M13.5 11.5h11.5l2.2 2.2V28.5a1.4 1.4 0 0 1-1.4 1.4h-12.3a1.4 1.4 0 0 1-1.4-1.4V12.9a1.4 1.4 0 0 1 1.4-1.4z"
            fill="#fff"
          />
          <path d="M25.2 11.5v2.7h2.5l-2.5-2.7z" fill="#ececec" />
          <rect x="15.2" y="15.2" width="10.5" height="1.8" rx="0.45" fill="#e03d3d" />
          <rect x="15.2" y="18.5" width="7.8" height="1.8" rx="0.45" fill="#e03d3d" opacity="0.82" />
          <rect x="15.2" y="21.8" width="5.2" height="1.8" rx="0.45" fill="#e03d3d" opacity="0.64" />
        </svg>
      </span>
      <span className="logo-wordmark">
        <span className="logo-wordmark-text">{text}</span>
      </span>
    </a>
  )
}
