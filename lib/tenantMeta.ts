import type { Metadata } from 'next'

import type { TenantThemePayload } from '@/lib/types/tenantTheme'

function titleWithBrand(baseTitle: string, theme: TenantThemePayload): string {
  if (theme.inherit) return baseTitle
  const dn =
    typeof theme.branding.displayName === 'string' && theme.branding.displayName.trim()
      ? theme.branding.displayName.trim()
      : ''
  const suf =
    typeof theme.branding.seoTitleSuffix === 'string' && theme.branding.seoTitleSuffix.trim()
      ? theme.branding.seoTitleSuffix.trim()
      : ''
  const tail = suf || dn
  if (!tail) return baseTitle
  return `${baseTitle} · ${tail}`
}

/** Aplica marca partner (solo si el tema devuelto no es inherit) al meta del comprador. */
export function augmentMetadataWithTenant(meta: Metadata, theme: TenantThemePayload, pageTitle: string): Metadata {
  if (theme.inherit) {
    return meta
  }

  const brand = theme.branding
  const titleOut = titleWithBrand(pageTitle, theme)

  const siteName =
    typeof brand.displayName === 'string' && brand.displayName.trim()
      ? brand.displayName.trim()
      : theme.subdomain || undefined

  const fav =
    typeof brand.faviconUrl === 'string' && brand.faviconUrl.trim() ? brand.faviconUrl.trim() : null

  const primary =
    typeof brand.primaryColor === 'string' && brand.primaryColor.trim()
      ? brand.primaryColor.trim()
      : null

  const next: Metadata = {
    ...meta,
    title: titleOut,
    applicationName: siteName ?? meta.applicationName,
    themeColor: primary ?? meta.themeColor,
  }

  if (fav) {
    next.icons = {
      icon: [{ url: fav, type: 'image/png', sizes: 'any' }],
      shortcut: fav,
      apple: fav,
    }
  }

  if (siteName) {
    next.openGraph = {
      ...meta.openGraph,
      siteName,
      title: titleOut,
    }
    next.twitter = {
      ...meta.twitter,
      title: titleOut,
    }
  }

  return next
}
