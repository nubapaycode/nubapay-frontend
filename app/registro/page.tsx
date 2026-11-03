import type { Metadata } from 'next'

import { OrganizerThemeBridge } from '@/components/organizer/OrganizerThemeBridge'
import { RegisterRequestForm } from '@/components/RegisterRequestForm'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { SITE_NAME, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

const REGISTER_DESCRIPTION =
  'Contactanos y te ayudamos a crear tu cuenta de Nubapay: menú digital, cobros online y retiro con código QR.'

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTenantThemeForRequest()
  const base = pageMeta({
    title: 'Contacto',
    description: REGISTER_DESCRIPTION,
  })
  if (!theme.inherit) {
    return augmentMetadataWithTenant(base, theme, 'Contacto')
  }
  if (theme.dedicated_partner_host) {
    const label =
      typeof theme.resolved_subdomain === 'string' && theme.resolved_subdomain.trim()
        ? theme.resolved_subdomain.trim()
        : SITE_NAME
    return pageMeta({
      title: `Contacto · ${label}`,
      description: REGISTER_DESCRIPTION,
    })
  }
  return base
}

export default async function RegisterPage() {
  const theme = await fetchTenantThemeForRequest()
  return (
    <OrganizerThemeBridge theme={theme}>
      <RegisterRequestForm />
    </OrganizerThemeBridge>
  )
}
