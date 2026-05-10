/**
 * Texto sobre el color de énfasis: tinta muy oscura o blanca según la **luminancia relativa WCAG del fondo**.
 * Sin comparar sólo ratios frente al fondo (#0a0a0f suele tener ratio mayor que el blanco en teal/medios
 * pero el esperado típico de marca es texto claro en esos fondos).
 */
const ACCENT_AUTO_TEXT_REL_L_THRESHOLD = 0.4

export function suggestedContrastOnAccentHex(bgHex: string): '#ffffff' | '#0a0a0f' {
  const Lbg = luminanceFromHex(bgHex)
  if (Lbg === null) return '#0a0a0f'
  return Lbg > ACCENT_AUTO_TEXT_REL_L_THRESHOLD ? '#0a0a0f' : '#ffffff'
}

export function normalizeHex(input: string): { r: number; g: number; b: number } | null {
  const raw = input.trim().toLowerCase()
  if (!raw.startsWith('#')) return null
  let hex = raw.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('')
  }
  if (!/^[0-9a-f]{6}$/.test(hex)) return null
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

/** Acepta `#rgb`, `#rrggbb`, hex sin `#`, o `rgb(r,g,b)` / `rgba(r,g,b,a)`. Otros → null. */
export function coerceBrandHex(rawInput: string): string | null {
  const trimmed = rawInput.trim()
  if (!trimmed) return null

  const rgbMatch = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(trimmed)
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)))
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)))
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)))
    if ([r, g, b].some(n => Number.isNaN(n))) return null
    const h = (n: number) => n.toString(16).padStart(2, '0')
    return `#${h(r)}${h(g)}${h(b)}`
  }

  let s = trimmed.toLowerCase()
  if (!s.startsWith('#')) {
    if (/^[0-9a-f]{6}$/.test(s)) s = `#${s}`
    else if (/^[0-9a-f]{3}$/.test(s)) s = `#${s}`
    else return null
  }
  const rgb = normalizeHex(s)
  if (!rgb) return null
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`
}

/**
 * Solo para vista previa mientras el usuario escribe el principal: arma un `#rrggbb` a partir
 * de dígitos hex incompletos. Si ya hay valor coercible, devuelve el mismo cañón que `coerceBrandHex`.
 */
export function approximateAccentBackgroundHex(rawInput: string): string | null {
  const exact = coerceBrandHex(rawInput)
  if (exact) return exact

  let digits = rawInput.trim().toLowerCase()
  if (digits.startsWith('#')) digits = digits.slice(1)
  digits = digits.replace(/[^0-9a-f]/g, '')
  if (!digits.length) return null

  let six: string
  if (digits.length >= 6) {
    six = digits.slice(0, 6)
  } else if (digits.length === 1) {
    six = digits.repeat(6)
  } else if (digits.length === 2) {
    six = `${digits}${digits}${digits}`
  } else if (digits.length === 3) {
    six = digits
      .split('')
      .map(c => c + c)
      .join('')
  } else {
    six = `${digits}${'0'.repeat(6 - digits.length)}`
  }

  return /^[0-9a-f]{6}$/.test(six) ? `#${six}` : null
}

function channelToLinear(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminanceFromHex(hexStr: string): number | null {
  const rgb = normalizeHex(hexStr)
  if (!rgb) return null
  const r = channelToLinear(rgb.r)
  const g = channelToLinear(rgb.g)
  const b = channelToLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatioFromLuminance(L1: number, L2: number): number {
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function wcagContrastBetweenHex(fgHex: string, bgHex: string): number | null {
  const Lbg = luminanceFromHex(bgHex)
  const Lfg = luminanceFromHex(fgHex)
  if (Lbg === null || Lfg === null) return null
  return contrastRatioFromLuminance(Lbg, Lfg)
}

/**
 * Vacío ⇒ automático (blanco o casi‑negro según luminancia del fondo).
 * Override manual ⇒ se respeta cualquier `#hex` coercible distinto del color principal (marca tiene prioridad);
 * sólo si el manual es igual al fondo cae en automático.
 */
export function resolvedAccentContrastText(primaryHex: string, manualTrimmed: string): string {
  const primaryCanon = coerceBrandHex(primaryHex)
  if (!primaryCanon) return '#0a0a0f'

  const manualCanon = coerceBrandHex(manualTrimmed)
  if (manualCanon) {
    if (manualCanon === primaryCanon) {
      return suggestedContrastOnAccentHex(primaryCanon)
    }
    return manualCanon
  }

  return suggestedContrastOnAccentHex(primaryCanon)
}

/**
 * Misma política que `resolvedAccentContrastText`, pero ante principal incompleto usa
 * `approximateAccentBackgroundHex` para texto automático y contraste al tipear.
 */
export function resolvedAccentContrastTextLive(primaryHex: string, manualTrimmed: string): string {
  const exactPrimary = coerceBrandHex(primaryHex)
  const bg = exactPrimary ?? approximateAccentBackgroundHex(primaryHex)
  if (!bg) return '#0a0a0f'

  const manualCanon = coerceBrandHex(manualTrimmed)
  if (manualCanon) {
    const invisiblePrimary = exactPrimary ?? bg
    if (manualCanon === invisiblePrimary) {
      return suggestedContrastOnAccentHex(bg)
    }
    return manualCanon
  }

  return suggestedContrastOnAccentHex(bg)
}