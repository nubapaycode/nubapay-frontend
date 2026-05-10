'use client'

import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

import { OrganizerAccentDevLog } from '@/components/organizer/OrganizerAccentDevLog'
import { TENANT_ORGANIZER_ACCENT_VAR_DEFAULTS, organizerBrandingAccentVars } from '@/lib/tenantThemeAccentVars'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'

const OrganizerPublicThemeCtx = createContext<TenantThemePayload | null>(null)

export function useOrganizerPublicTheme(): TenantThemePayload | null {
  return useContext(OrganizerPublicThemeCtx)
}

/** Expone el tema público por host (SSR) al árbol del organizador: logo / acento. */
export function OrganizerThemeBridge({ theme, children }: { theme: TenantThemePayload; children: ReactNode }) {
  const branded = organizerBrandingAccentVars(theme)
  const style = { ...TENANT_ORGANIZER_ACCENT_VAR_DEFAULTS, ...branded }

  return (
    <OrganizerPublicThemeCtx.Provider value={theme}>
      <div className="organizer-tenant-brand-scope flex min-h-dvh w-full min-w-0 flex-col" style={style}>
        {process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME === '1' ? <OrganizerAccentDevLog theme={theme} /> : null}
        {children}
      </div>
    </OrganizerPublicThemeCtx.Provider>
  )
}
