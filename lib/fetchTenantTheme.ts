import { cache } from 'react'

import { publicPaths } from '@/lib/api'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'
import { brandedRequestHeaders } from '@/lib/server/brandedRequestHeaders'
import { resolveInternalFetchUrl } from '@/lib/server/resolveInternalFetchUrl'

const defaultInherit: TenantThemePayload = {
  inherit: true,
  branding: null,
  subdomain: null,
  dedicated_partner_host: false,
  resolved_subdomain: null,
}

const tenantThemeVerbose =
  process.env.DEBUG_TENANT_THEME === '1' || process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME === '1'

function logTenantThemeServer(label: string, payload: Record<string, unknown>): void {
  if (!tenantThemeVerbose) return
  console.warn(`[nubapay:ssr tenant-theme] ${label}`, payload)
}

export const fetchTenantThemeForRequest = cache(async (): Promise<TenantThemePayload> => {
  let url = publicPaths.tenantByHost()
  const originalPath = url
  url = await resolveInternalFetchUrl(url)
  const extra = await brandedRequestHeaders()

  logTenantThemeServer('request', {
    urlResolved: url,
    pathFromApiHelper: originalPath.startsWith('http') ? '(absoluto)' : originalPath,
    xBrandedHost: extra['X-Branded-Host'] ?? '(sin header)',
  })

  try {
    const res = await fetch(url, { cache: 'no-store', headers: extra })

    logTenantThemeServer('response', { status: res.status, ok: res.ok })

    if (!res.ok) {
      logTenantThemeServer('fallthrough', {
        motivo: 'HTTP no OK',
        status: res.status,
        usando: 'inherit (default)',
      })
      return defaultInherit
    }
    const body = (await res.json()) as TenantThemePayload
    if (body && typeof body === 'object' && 'inherit' in body) {
      const t = body as TenantThemePayload
      logTenantThemeServer('parsed', {
        inherit: (t as { inherit?: boolean }).inherit,
        subdomain: (t as { subdomain?: string | null }).subdomain ?? null,
        dedicated_partner_host: (t as { dedicated_partner_host?: boolean }).dedicated_partner_host === true,
        primarySnippet:
          !(t as { inherit?: boolean }).inherit &&
          (t as { branding?: { primaryColor?: string } }).branding?.primaryColor,
      })
      return t
    }

    logTenantThemeServer('fallthrough', { motivo: 'JSON sin inherit', usando: 'inherit (default)' })
    return defaultInherit
  } catch (e) {
    logTenantThemeServer('fallthrough', {
      motivo: 'fetch/parse exception',
      error: String(e),
      usando: 'inherit (default)',
    })
    return defaultInherit
  }
})

export { brandingAccentVars, organizerBrandingAccentVars } from '@/lib/tenantThemeAccentVars'
