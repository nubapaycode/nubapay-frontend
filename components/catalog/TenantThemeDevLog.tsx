'use client'

import { useEffect } from 'react'

import type { TenantThemePayload } from '@/lib/types/tenantTheme'

/** Si `NEXT_PUBLIC_DEBUG_TENANT_THEME=1`, loguea en la consola del navegador el tema resuelto. */
export function TenantThemeDevLog({ theme }: { theme: TenantThemePayload }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME !== '1') return

    const summary =
      theme.inherit === true
        ? {
            inherit: true,
            note: 'catálogo usa estilos Nubapay default (resolver no encontró tenant o whitelabel off)',
          }
        : {
            inherit: false,
            subdomain: theme.subdomain,
            primaryColor:
              typeof theme.branding?.primaryColor === 'string'
                ? theme.branding.primaryColor
                : undefined,
            logoUrl:
              typeof theme.branding?.logoUrl === 'string' ? theme.branding.logoUrl : undefined,
          }

    console.warn('[nubapay catalog] tema por host', summary)
    console.warn('[nubapay catalog] tema completo', theme)
  }, [theme])

  return null
}
