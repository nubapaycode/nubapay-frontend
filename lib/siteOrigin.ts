/** Origen público del sitio para armar enlaces compartibles (cliente). */
export function getPublicSiteOriginForUi(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  if (env) {
    return env.startsWith('http') ? env : `https://${env}`
  }
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function catalogPublicPath(slug: string): string {
  return `/catalogo/${encodeURIComponent(slug)}`
}
