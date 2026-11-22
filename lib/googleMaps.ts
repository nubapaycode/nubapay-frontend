/**
 * Link de Google Maps del estacionamiento. Mismas reglas que el backend (services/google_maps.py):
 * solo https y hosts de Google Maps.
 */
const MAPS_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'maps.google.com', 'google.com', 'www.google.com'])

function parse(raw: string): URL | null {
  try {
    return new URL(raw.trim())
  } catch {
    return null
  }
}

export function isGoogleMapsUrl(raw: string): boolean {
  const value = raw.trim()
  if (!value || value.length > 2000 || /\s/.test(value)) return false
  const url = parse(value)
  if (!url || url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  if (!MAPS_HOSTS.has(host)) return false
  if ((host === 'google.com' || host === 'www.google.com' || host === 'goo.gl') && !url.pathname.startsWith('/maps')) {
    return false
  }
  return true
}

/**
 * URL para mostrar el mapa dentro de la página (iframe) o null si no se puede armar.
 * Los links cortos (`maps.app.goo.gl`) no revelan el lugar sin abrirlos: en ese caso solo se ofrece el botón.
 */
export function mapsEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw || !isGoogleMapsUrl(raw)) return null
  const url = parse(raw)
  if (!url) return null
  if (url.pathname.startsWith('/maps/embed')) return url.toString()

  const embed = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`

  const coords = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (coords) return embed(`${coords[1]},${coords[2]}`)

  const q = url.searchParams.get('q') ?? url.searchParams.get('query')
  if (q) return embed(q)

  const place = url.pathname.match(/^\/maps\/place\/([^/]+)/)
  if (place) {
    try {
      return embed(decodeURIComponent(place[1].replace(/\+/g, ' ')))
    } catch {
      return null
    }
  }
  return null
}
