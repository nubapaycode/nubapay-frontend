/** Payload alineado a GET /api/public/tenant-by-host y `theme` en catálogo. */

export type TenantBranding = {
  displayName?: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  iconUrls?: unknown
  contact?: Record<string, unknown>
  socials?: Record<string, unknown>
  legal?: Record<string, unknown>
  seoTitleSuffix?: string
}

export type TenantThemePayload =
  | {
      inherit: true
      branding: null | undefined
      subdomain: string | null
    }
  | {
      inherit: false
      partner_whitelabel_enabled: true
      subdomain: string
      branding: TenantBranding
    }
