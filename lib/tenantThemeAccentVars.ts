import { coerceBrandHex, resolvedAccentContrastText } from '@/lib/accentContrastText'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'

/** Siempre declarados en el wrapper: heredan los hijos aunque aún no haya hex válido en marca. */
export const TENANT_BUYER_ACCENT_VAR_DEFAULTS: Record<string, string> = {
  '--buyer-accent': '#C6FF00',
  '--buyer-accent-text': '#0A0F00',
}

export const TENANT_ORGANIZER_ACCENT_VAR_DEFAULTS: Record<string, string> = {
  '--organizer-accent': '#C6FF00',
  '--organizer-accent-ink': '#0A0F00',
}

function accentInk(theme: TenantThemePayload): string {
  if (theme.inherit) return '#0a0a0f'
  const b = theme.branding
  const accentRaw = typeof b.primaryColor === 'string' ? b.primaryColor.trim() : ''
  const manual = typeof b.accentContrastText === 'string' ? b.accentContrastText.trim() : ''
  if (!coerceBrandHex(accentRaw)) return '#0a0a0f'
  return resolvedAccentContrastText(accentRaw, manual)
}

/** Catálogo público comprador (`/catalogo/*`). */
export function brandingAccentVars(theme: TenantThemePayload): Record<string, string> | undefined {
  if (theme.inherit) return undefined
  const b = theme.branding
  const accentRaw = typeof b.primaryColor === 'string' ? b.primaryColor.trim() : ''
  const accent = coerceBrandHex(accentRaw)
  if (!accent) return undefined
  return {
    '--buyer-accent': accent,
    '--buyer-accent-text': accentInk(theme),
  }
}

/** Panel organizador (`/events/*`). Pure client/server — no importar `fetchTenantTheme.ts` desde Client Components. */
export function organizerBrandingAccentVars(theme: TenantThemePayload): Record<string, string> | undefined {
  if (theme.inherit) return undefined
  const b = theme.branding
  const accentRaw = typeof b.primaryColor === 'string' ? b.primaryColor.trim() : ''
  const accent = coerceBrandHex(accentRaw)
  if (!accent) return undefined
  return {
    '--organizer-accent': accent,
    '--organizer-accent-ink': accentInk(theme),
  }
}
