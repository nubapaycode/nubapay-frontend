import type { Metadata } from 'next'

import { OrganizerGuard } from '@/components/organizer/OrganizerGuard'
import { OrganizerThemeBridge } from '@/components/organizer/OrganizerThemeBridge'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { logOrganizerSsrContext } from '@/lib/server/logOrganizerRequestContext'
import { ORGANIZER_ROBOTS, SITE_NAME, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

const ORGANIZER_DEFAULT_DESCRIPTION =
  'Panel para organizadores: eventos, menú digital y cobros online.'

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTenantThemeForRequest()

  if (theme.inherit) {
    return pageMeta({
      title: `Organizador | ${SITE_NAME}`,
      description: ORGANIZER_DEFAULT_DESCRIPTION,
      robots: ORGANIZER_ROBOTS,
    })
  }

  const brand = theme.branding
  const label =
    (typeof brand.displayName === 'string' && brand.displayName.trim()
      ? brand.displayName.trim()
      : '') || theme.subdomain || SITE_NAME

  const fallbackDesc = `${label}: panel de organización, menú digital, pedidos y cobros online.`
  const baseDesc =
    typeof brand.seoDescription === 'string' && brand.seoDescription.trim()
      ? brand.seoDescription.trim()
      : fallbackDesc

  const baseMeta = pageMeta({
    title: 'Organizador',
    description: baseDesc,
    robots: ORGANIZER_ROBOTS,
  })

  const merged = augmentMetadataWithTenant(baseMeta, theme, 'Organizador')

  const defaultTitle = typeof merged.title === 'string' ? merged.title : `Organizador · ${label}`

  return {
    ...merged,
    title: {
      default: defaultTitle,
      template: `%s · ${label}`,
    },
  }
}

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  await logOrganizerSsrContext('(organizer) layout')
  const theme = await fetchTenantThemeForRequest()

  return (
    <OrganizerGuard>
      <OrganizerThemeBridge theme={theme}>{children}</OrganizerThemeBridge>
    </OrganizerGuard>
  )
}
