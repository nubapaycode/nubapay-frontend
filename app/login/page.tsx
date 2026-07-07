import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LoginView } from '@/components/LoginView'
import { OrganizerThemeBridge } from '@/components/organizer/OrganizerThemeBridge'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { SITE_NAME, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

const LOGIN_DESCRIPTION =
  'Accedé al panel de organizador para cargar el menú, cobrar pedidos y gestionar retiros con Nubapay.'

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTenantThemeForRequest()
  const base = pageMeta({
    title: 'Iniciar sesión',
    description: LOGIN_DESCRIPTION,
  })
  if (!theme.inherit) {
    return augmentMetadataWithTenant(base, theme, 'Iniciar sesión')
  }
  if (theme.dedicated_partner_host) {
    const label =
      typeof theme.resolved_subdomain === 'string' && theme.resolved_subdomain.trim()
        ? theme.resolved_subdomain.trim()
        : SITE_NAME
    return pageMeta({
      title: `Iniciar sesión · ${label}`,
      description: LOGIN_DESCRIPTION,
    })
  }
  return base
}

export default async function LoginPage() {
  const theme = await fetchTenantThemeForRequest()
  return (
    <OrganizerThemeBridge theme={theme}>
      <Suspense fallback={null}>
        <LoginView initialMode="login" />
      </Suspense>
    </OrganizerThemeBridge>
  )
}
