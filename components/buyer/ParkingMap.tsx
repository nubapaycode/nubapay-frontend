'use client'

import { MapPin } from 'lucide-react'

import { BUYER_COLORS } from '@/lib/buyerUi'
import { isGoogleMapsUrl, mapsEmbedUrl } from '@/lib/googleMaps'

/**
 * Dónde queda el estacionamiento, como un mapa chico al final de la página. Toda la imagen es un link a
 * Google Maps (el mapa no captura el scroll del celular). Si no se puede armar el mapa, queda una tarjeta
 * con el pin y el mismo link.
 *
 * `resolvedUrl` es la URL larga a la que lleva un link corto (`maps.app.goo.gl`): solo con ella se sabe
 * qué lugar mostrar.
 */
export function ParkingMap({ url, resolvedUrl }: { url: string | null | undefined; resolvedUrl?: string | null }) {
  if (!url || !isGoogleMapsUrl(url)) return null
  const embed = mapsEmbedUrl(resolvedUrl) ?? mapsEmbedUrl(url)

  return (
    <section aria-labelledby="parking-map-title" className="mt-8 overflow-hidden rounded-[20px] bg-white">
      <div className="relative h-44 w-full overflow-hidden md:h-52" style={{ background: BUYER_COLORS.subtleFill }}>
        {embed ? (
          <iframe
            src={embed}
            title="Mapa del estacionamiento"
            className="pointer-events-none h-full w-full border-0"
            loading="lazy"
            tabIndex={-1}
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden>
            <span
              className="flex size-14 items-center justify-center rounded-full"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              <MapPin size={26} strokeWidth={2} />
            </span>
          </div>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir el estacionamiento en Google Maps"
          className="absolute inset-0"
        />
      </div>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <p id="parking-map-title" className="text-[15px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            Dónde queda el estacionamiento
          </p>
          <p className="text-[13px]" style={{ color: '#6B6B78' }}>
            Tocá el mapa para ver cómo llegar.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-shrink-0 items-center rounded-full px-5 text-sm font-bold transition-opacity active:opacity-85"
          style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
        >
          Cómo llegar
        </a>
      </div>
    </section>
  )
}
