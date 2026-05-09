import { cache } from 'react'

import { publicPaths } from '@/lib/api'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'
import { brandedRequestHeaders } from '@/lib/server/brandedRequestHeaders'
import { resolveInternalFetchUrl } from '@/lib/server/resolveInternalFetchUrl'

const defaultInherit: TenantThemePayload = {
  inherit: true,
  branding: null,
  subdomain: null,
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

export function brandingAccentVars(theme: TenantThemePayload): Record<string, string> | undefined {
  if (theme.inherit) return undefined
  const b = theme.branding
  const accent = typeof b.primaryColor === 'string' ? b.primaryColor.trim() : ''
  if (!accent || !accent.startsWith('#')) return undefined
  return {
    '--buyer-accent': accent,
    '--buyer-accent-text': '#0a0a0f',
  }
}
