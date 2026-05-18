import type { Metadata } from 'next'

import { ForgotPasswordView } from '@/components/ForgotPasswordView'
import { OrganizerThemeBridge } from '@/components/organizer/OrganizerThemeBridge'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'
import { pageMeta } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTenantThemeForRequest()
  const base = pageMeta({
    title: 'Recuperar contraseña',
    description: 'Ingresá tu email para recibir las instrucciones de recuperación.',
  })
  if (!theme.inherit) {
    return augmentMetadataWithTenant(base, theme, 'Recuperar contraseña')
  }
  return base
}

export default async function ForgotPasswordPage() {
  const theme = await fetchTenantThemeForRequest()
  return (
    <OrganizerThemeBridge theme={theme}>
      <ForgotPasswordView />
    </OrganizerThemeBridge>
  )
}
