import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="main cms-main" style={{ padding: '2rem', maxWidth: 520 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Page not found</h1>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        That URL does not exist on this site.
      </p>
      <Link href="/" style={{ color: '#0d9488', fontWeight: 600 }}>
        ← Compound interest calculator
      </Link>
    </main>
  )
}
