/** Página de tickets (entradas, parking…) de un evento: `/tickets/:slug`. */
export function ticketsPath(slug: string): string {
  return `/tickets/${encodeURIComponent(slug.trim())}`
}

/** Checkout de entradas: `/tickets/:slug/comprar`. */
export function ticketsCheckoutPath(slug: string): string {
  return `${ticketsPath(slug)}/comprar`
}

/**
 * Rutas del comprador. Si entró por `/catalogo/:slug`, se mantiene ese path
 * en lugar de exponer el UUID del evento en la barra de direcciones.
 */
export function buyerFlowPath(
  eventId: string,
  opts: { catalogSlug?: string; path?: string } = {},
): string {
  const slug = opts.catalogSlug?.trim()
  const path = opts.path?.replace(/^\//, '') ?? ''
  if (slug) {
    const enc = encodeURIComponent(slug)
    return path ? `/catalogo/${enc}/${path}` : `/catalogo/${enc}`
  }
  return path ? `/${eventId}/${path}` : `/${eventId}`
}
