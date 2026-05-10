import type { CSSProperties } from 'react'

import {
  approximateAccentBackgroundHex,
  coerceBrandHex,
  resolvedAccentContrastText,
  resolvedAccentContrastTextLive,
} from '@/lib/accentContrastText'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'

/**
 * Valores CSS `var(...)` cuando el navegador resuelve variables del wrapper.
 * En varios navegadores o con temas SSR viejos, `color` con `var` quedaba en el fallback negro (#0a0f);
 * los organizadores también usan `organizerAccentColorsFromTheme`, con hex literal.
 */
export const ORGANIZER_ACCENT_BACKGROUND = 'var(--organizer-accent, #C6FF00)'
export const ORGANIZER_ACCENT_FOREGROUND = 'var(--organizer-accent-ink, #0A0F00)'

const PLATFORM_ACCENT_SURFACE = {
  bg: '#c6ff00',
  fg: '#0a0a0f',
} as const

/** Sidebar y demás UI acentualda según el tema público (SSR/context). */
export function organizerAccentColorsFromTheme(theme: TenantThemePayload | null): { bg: string; fg: string } {
  if (!theme || theme.inherit) {
    return { bg: PLATFORM_ACCENT_SURFACE.bg, fg: PLATFORM_ACCENT_SURFACE.fg }
  }
  const b = theme.branding
  const raw = typeof b.primaryColor === 'string' ? b.primaryColor.trim() : ''
  const accent = coerceBrandHex(raw)
  const manual = typeof b.accentContrastText === 'string' ? b.accentContrastText.trim() : ''
  if (!accent) {
    return { bg: ORGANIZER_ACCENT_BACKGROUND, fg: ORGANIZER_ACCENT_FOREGROUND }
  }
  return { bg: accent, fg: resolvedAccentContrastText(raw, manual) }
}

/** Panel marca: mismo criterio que la vista previa (incluye hex incompleto mientras editás el principal). */
export function organizerAccentColorsFromDraft(primaryRaw: string, accentContrastRaw: string): { bg: string; fg: string } {
  const accent = coerceBrandHex(primaryRaw) ?? approximateAccentBackgroundHex(primaryRaw)
  if (!accent) {
    return { bg: ORGANIZER_ACCENT_BACKGROUND, fg: ORGANIZER_ACCENT_FOREGROUND }
  }
  return { bg: accent, fg: resolvedAccentContrastTextLive(primaryRaw, accentContrastRaw) }
}

export function organizerAccentFilledButtonStyle(): CSSProperties {
  return {
    backgroundColor: ORGANIZER_ACCENT_BACKGROUND,
    color: ORGANIZER_ACCENT_FOREGROUND,
  }
}
