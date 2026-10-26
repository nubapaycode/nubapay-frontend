'use client'

import { useEffect, useState } from 'react'

import { partnerTenantPaths } from '@/lib/api'
import { authHeadersJson, getAuthUser } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { getPublicSiteOriginForUi } from '@/lib/siteOrigin'

/**
 * Origen público para armar los enlaces que el organizador comparte (catálogo, tickets):
 * dominio propio verificado > subdominio whitelabel > origen del navegador > NEXT_PUBLIC_SITE_URL.
 */
export function usePublicOrigin(): string {
  const [browserOrigin, setBrowserOrigin] = useState<string | null>(null)
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setBrowserOrigin(window.location.origin))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const user = getAuthUser()
  const partnerOrigin =
    user?.tenant_partner_whitelabel_enabled && user?.tenant_subdomain
      ? `https://${user.tenant_subdomain}.nubapay.app`
      : null

  const [verifiedDomain, setVerifiedDomain] = useState<string | null>(null)
  useEffect(() => {
    if (!user?.tenant_partner_whitelabel_enabled) return
    let cancelled = false
    void (async () => {
      const res = await browserFetch(partnerTenantPaths.tenant(), { headers: authHeadersJson() })
      if (!res.ok) return
      const body = (await res.json()) as { tenant?: { domains?: { hostname: string; verified: boolean }[] } }
      const verified = body.tenant?.domains?.find(d => d.verified)
      if (!cancelled && verified) setVerifiedDomain(verified.hostname)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.tenant_partner_whitelabel_enabled])

  return verifiedDomain ? `https://${verifiedDomain}` : partnerOrigin ?? browserOrigin ?? getPublicSiteOriginForUi()
}
