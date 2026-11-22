'use client'

import { ExternalLink, MapPin } from 'lucide-react'
import { useState } from 'react'

import { isGoogleMapsUrl, mapsEmbedUrl } from '@/lib/googleMaps'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { patchOrganizerEvent } from '@/lib/organizerEvents'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)]'

/** Link de Google Maps del estacionamiento: el comprador ve el mapa en la página de venta. */
export function ParkingMapsCard({
  eventId,
  initialUrl,
  onSaved,
  onError,
}: {
  eventId: string
  initialUrl: string | null
  onSaved: (url: string | null) => void
  onError: (msg: string) => void
}) {
  const [draft, setDraft] = useState(initialUrl ?? '')
  const [saved, setSaved] = useState(initialUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')

  // El link llega después de cargar el evento: se toma una sola vez, sin pisar lo que se está escribiendo.
  const [seeded, setSeeded] = useState(initialUrl)
  if (seeded !== initialUrl) {
    setSeeded(initialUrl)
    if (draft === saved) setDraft(initialUrl ?? '')
    setSaved(initialUrl ?? '')
  }

  const trimmed = draft.trim()
  const dirty = trimmed !== saved
  const embed = mapsEmbedUrl(saved || null)

  const save = async () => {
    if (saving || !dirty) return
    if (trimmed && !isGoogleMapsUrl(trimmed)) {
      setFieldError('Pegá un link de Google Maps (https://maps.app.goo.gl/… o https://www.google.com/maps/…)')
      return
    }
    setFieldError('')
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, { parking_maps_url: trimmed || null })
    setSaving(false)
    if (!res.ok) {
      setFieldError(res.error)
      onError(res.error)
      return
    }
    const next = res.event.parking_maps_url ?? ''
    setSaved(next)
    setDraft(next)
    onSaved(next || null)
  }

  return (
    <section className="nb-rise mb-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-2">
          <MapPin size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-gray-500" aria-hidden />
          <div>
            <p className="text-[14px] font-semibold text-gray-900">Ubicación del estacionamiento</p>
            <p className="mt-0.5 text-[12px] text-gray-500">
              En Google Maps buscá el lugar, tocá Compartir y pegá el link. El comprador lo ve en la página de venta.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputClass}
            value={draft}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://maps.app.goo.gl/…"
            aria-label="Link de Google Maps"
            aria-invalid={fieldError ? true : undefined}
            onChange={e => {
              setDraft(e.target.value)
              setFieldError('')
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void save()
              }
            }}
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !dirty}
            style={organizerAccentFilledButtonStyle()}
            className="h-[42px] shrink-0 rounded-xl px-5 text-[14px] font-semibold transition-[filter,opacity] hover:brightness-95 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : trimmed ? 'Guardar' : 'Quitar'}
          </button>
        </div>
        {fieldError && (
          <p role="alert" className="text-[12px] text-red-600">
            {fieldError}
          </p>
        )}
        {saved && (
          <a
            href={saved}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ExternalLink size={13} strokeWidth={1.75} aria-hidden />
            Abrir en Google Maps
          </a>
        )}
      </div>
      {embed && (
        <iframe
          src={embed}
          title="Mapa del estacionamiento"
          className="h-56 w-full border-t border-gray-100"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
    </section>
  )
}
