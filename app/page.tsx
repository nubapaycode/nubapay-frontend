import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LandingPage } from '@/components/LandingPage'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { SITE_NAME, pageMeta } from '@/lib/seo'

const LANDING_META: Metadata = pageMeta({
  title: 'Nubapay — Pedí, pagá y retirá sin filas',
  description:
    'Menú digital, pagos móviles y retiro con QR antifraude para eventos y festivales. Sin filas, sin caos. Powered by Atendium IA y unickeys blockchain.',
})

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTenantThemeForRequest()
  if (!theme.dedicated_partner_host) {
    return LANDING_META
  }
  const label =
    typeof theme.resolved_subdomain === 'string' && theme.resolved_subdomain.trim()
      ? theme.resolved_subdomain.trim()
      : SITE_NAME
  return pageMeta({
    title: `Iniciar sesión · ${label}`,
    description: 'Accedé al panel de organizador.',
    robots: { index: false, follow: false },
  })
}

export default async function LandingRootPage() {
  const theme = await fetchTenantThemeForRequest()
  if (theme.dedicated_partner_host) {
    redirect('/login')
  }
  return <LandingPage />
}
