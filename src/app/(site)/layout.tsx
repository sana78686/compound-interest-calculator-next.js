import SiteLayout from '@/components/site/SiteLayout'

export default function SiteRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SiteLayout>{children}</SiteLayout>
}
