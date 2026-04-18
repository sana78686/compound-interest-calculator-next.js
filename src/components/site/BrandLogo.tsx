type BrandLogoProps = {
  href: string
  ariaLabel: string
  text: string
}

/**
 * Same asset as tab favicon (`/icon.svg` from `src/app/icon.svg`) — icon + wordmark in one row.
 */
export default function BrandLogo({ href, ariaLabel, text }: BrandLogoProps) {
  return (
    <a href={href} className="logo logo--brand logo--brand-cic" dir="ltr" aria-label={ariaLabel}>
      <span className="logo-icon-wrap" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- shared SVG with favicon; avoids duplicating paths */}
        <img className="logo-icon-svg" src="/icon.svg" width={40} height={40} alt="" />
      </span>
      <span className="logo-wordmark">
        <span className="logo-wordmark-text">{text}</span>
      </span>
    </a>
  )
}
