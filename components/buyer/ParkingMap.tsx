'use client'

import { BUYER_COLORS } from '@/lib/buyerUi'
import { isGoogleMapsUrl, mapsEmbedUrl } from '@/lib/googleMaps'

/**
 * Dónde queda el estacionamiento. Siempre ofrece abrir Google Maps; si el link permite armar un mapa
 * (coordenadas, búsqueda o embed) también lo muestra dentro de la página.
 */
export function ParkingMap({ url }: { url: string | null | undefined }) {
  if (!url || !isGoogleMapsUrl(url)) return null
  const embed = mapsEmbedUrl(url)

  return (
    <section className="mb-5 overflow-hidden rounded-[20px] bg-white md:mb-6">
      {embed && (
        <iframe
          src={embed}
          title="Mapa del estacionamiento"
          className="h-56 w-full border-0 md:h-72"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            Dónde queda el estacionamiento
          </p>
          <p className="text-[13px]" style={{ color: '#6B6B78' }}>
            Abrilo en Google Maps para ver cómo llegar.
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
