import type { Metadata } from 'next'

import { LoginView } from '@/components/LoginView'
import { OrganizerThemeBridge } from '@/components/organizer/OrganizerThemeBridge'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { SITE_NAME, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

const REGISTER_DESCRIPTION =
  'Registrate en Nubapay y empezá a crear eventos con menú digital, cobros online y retiro con código QR.'

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTenantThemeForRequest()
  const base = pageMeta({
    title: 'Crear cuenta',
    description: REGISTER_DESCRIPTION,
  })
  if (!theme.inherit) {
    return augmentMetadataWithTenant(base, theme, 'Crear cuenta')
  }
  if (theme.dedicated_partner_host) {
    const label =
      typeof theme.resolved_subdomain === 'string' && theme.resolved_subdomain.trim()
        ? theme.resolved_subdomain.trim()
        : SITE_NAME
    return pageMeta({
      title: `Crear cuenta · ${label}`,
      description: REGISTER_DESCRIPTION,
    })
  }
  return base
}

export default async function RegisterPage() {
  const theme = await fetchTenantThemeForRequest()
  return (
    <OrganizerThemeBridge theme={theme}>
      <LoginView initialMode="register" />
    </OrganizerThemeBridge>
  )
}
