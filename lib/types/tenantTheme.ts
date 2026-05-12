/** Payload alineado a GET /api/public/tenant-by-host y `theme` en catálogo. */

export type TenantThemeExtra = {
  /** Host distinto del apex/plataforma: subdominio partner o dominio verificado. */
  dedicated_partner_host?: boolean
  /** Subdominio canónico del tenant (útil cuando inherit y subdomain va null). */
  resolved_subdomain?: string | null
}

export type TenantBranding = {
  displayName?: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  /** Texto sobre el acento (#hex). Vacío ⇒ el front sugiere claro/u oscuro; si hay #hex válido distinto del principal, se usa tal cual (excepto igual al fondo ⇒ automático). */
  accentContrastText?: string
  /** Descripción opcional meta (catalog + panel). */
  seoDescription?: string
  iconUrls?: unknown
  contact?: Record<string, unknown>
  socials?: Record<string, unknown>
  legal?: Record<string, unknown>
  seoTitleSuffix?: string
}

export type TenantThemePayload =
  | ({
      inherit: true
      branding: null | undefined
      subdomain: string | null
    } & TenantThemeExtra)
  | ({
      inherit: false
      partner_whitelabel_enabled: boolean
      subdomain: string
      branding: TenantBranding
    } & TenantThemeExtra)
