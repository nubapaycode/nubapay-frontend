'use client'

import { useEffect } from 'react'

import { coerceBrandHex, resolvedAccentContrastText } from '@/lib/accentContrastText'
import { organizerAccentColorsFromTheme } from '@/lib/organizerAccentCss'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'
import {
  TENANT_ORGANIZER_ACCENT_VAR_DEFAULTS,
  organizerBrandingAccentVars,
} from '@/lib/tenantThemeAccentVars'

/**
 * Con `NEXT_PUBLIC_DEBUG_TENANT_THEME=1`: consola del navegador muestra tema, vars del bridge,
 * colores literales sidebar y valores **computed** de `--organizer-accent*` en `.organizer-tenant-brand-scope`.
 */
export function OrganizerAccentDevLog({ theme }: { theme: TenantThemePayload }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME !== '1') return

    const branded = organizerBrandingAccentVars(theme)
    const mergedCssVars = { ...TENANT_ORGANIZER_ACCENT_VAR_DEFAULTS, ...branded }
    const literals = organizerAccentColorsFromTheme(theme)

    const b = !theme.inherit ? theme.branding : null
    const rawPrimary = typeof b?.primaryColor === 'string' ? b.primaryColor.trim() : ''
    const coercedPrimary = coerceBrandHex(rawPrimary)
    const manual = typeof b?.accentContrastText === 'string' ? b.accentContrastText.trim() : ''
    const resolvedFg =
      rawPrimary.length > 0 ? resolvedAccentContrastText(rawPrimary, manual) : '(sin primary raw)'

    const logRound = (pass: string) => {
      let computedScope: Record<string, string> = {}
      if (typeof document !== 'undefined') {
        const el = document.querySelector('.organizer-tenant-brand-scope')
        if (el instanceof HTMLElement) {
          const cs = getComputedStyle(el)
          computedScope = {
            '--organizer-accent': cs.getPropertyValue('--organizer-accent').trim(),
            '--organizer-accent-ink': cs.getPropertyValue('--organizer-accent-ink').trim(),
          }
        }
      }

      console.warn(`[nubapay organizer-accent] ${pass}`, {
        locationHost: typeof window !== 'undefined' ? window.location.host : '(ssr)',
        themeInherit: theme.inherit,
        hint:
          theme.inherit === true
            ? 'inherit=true: API tenant-by-host no devuelve marca (whitelabel off o host sin tenant)'
            : 'inherit=false: marca aplicada desde API',
        brandingPrimaryRaw: rawPrimary.length ? rawPrimary : null,
        brandingPrimaryCoerced: coercedPrimary,
        brandingAccentContrastRaw: manual.length ? manual : null,
        resolvedContrastFgLogic: resolvedFg,
        literalsUsedInSidebarEtc: literals,
        inlineStyleMergedOnBridgeDiv: mergedCssVars,
        getComputedStyleOnScopeEl: computedScope,
      })
    }

    logRound('primer paint')
    const raf = requestAnimationFrame(() => logRound('tras rAF'))

    return () => cancelAnimationFrame(raf)
  }, [theme])

  return null
}
