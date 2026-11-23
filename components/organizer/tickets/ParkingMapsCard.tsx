'use client'

import { ExternalLink, MapPin, Pencil } from 'lucide-react'
import { useState } from 'react'

import { isGoogleMapsUrl, mapsEmbedUrl } from '@/lib/googleMaps'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { patchOrganizerEvent } from '@/lib/organizerEvents'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)]'

/**
 * Link de Google Maps del estacionamiento: el comprador ve el mapa en la página de venta.
 * Con un link guardado queda compacta (mapa + "Cambiar"); el formulario aparece solo al cargarlo o cambiarlo.
 */
export function ParkingMapsCard({
  eventId,
  initialUrl,
  initialResolvedUrl = null,
  onSaved,
  onError,
  className,
}: {
  eventId: string
  initialUrl: string | null
  /** URL larga de un link corto de Google Maps: sin ella no se puede armar la vista previa. */
  initialResolvedUrl?: string | null
  onSaved: (url: string | null, resolvedUrl: string | null) => void
  onError: (msg: string) => void
  className?: string
}) {
  const [draft, setDraft] = useState(initialUrl ?? '')
  /** Formulario abierto a mano ("Cambiar"); sin link guardado el formulario se ve siempre. */
  const [editOpen, setEditOpen] = useState(false)
  const [saved, setSaved] = useState(initialUrl ?? '')
  const [resolved, setResolved] = useState(initialResolvedUrl)
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')

  // El link llega después de cargar el evento: se toma una sola vez, sin pisar lo que se está escribiendo.
  const [seeded, setSeeded] = useState(initialUrl)
  if (seeded !== initialUrl) {
    setSeeded(initialUrl)
    if (draft === saved) setDraft(initialUrl ?? '')
    setSaved(initialUrl ?? '')
  }
  const [seededResolved, setSeededResolved] = useState(initialResolvedUrl)
  if (seededResolved !== initialResolvedUrl) {
    setSeededResolved(initialResolvedUrl)
    setResolved(initialResolvedUrl)
  }

  const trimmed = draft.trim()
  const dirty = trimmed !== saved
  const embed = mapsEmbedUrl(resolved) ?? mapsEmbedUrl(saved || null)

  const save = async () => {
    if (saving || !dirty) return
    if (trimmed && !isGoogleMapsUrl(trimmed)) {
      setFieldError('Pegá un link de Google Maps (https://maps.app.goo.gl/… o https://www.google.com/maps/…)')
      return
    }
    setFieldError('')
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, {
      parking_maps_url: trimmed || null,
    })
    setSaving(false)
    if (!res.ok) {
      setFieldError(res.error)
      onError(res.error)
      return
    }
    const next = res.event.parking_maps_url ?? ''
    const nextResolved = res.event.parking_maps_resolved_url ?? null
    setSaved(next)
    setDraft(next)
    setResolved(nextResolved)
    setEditOpen(false)
    onSaved(next || null, nextResolved)
  }

  const cancelEdit = () => {
    setDraft(saved)
    setFieldError('')
    setEditOpen(false)
  }

  const showForm = !saved || editOpen
  const cardClass = cn(
    'nb-rise overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
    className,
  )

  if (!showForm) {
    return (
      <section className={cardClass} aria-label="Ubicación del estacionamiento">
        {embed ? (
          <iframe
            src={embed}
            title="Mapa del estacionamiento"
            className="h-40 w-full border-b border-gray-100"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-24 items-center justify-center border-b border-gray-100 bg-gray-50" aria-hidden>
            <MapPin size={22} strokeWidth={1.75} className="text-gray-400" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-900">Ubicación del estacionamiento</p>
            <a
              href={saved}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
              Abrir en Google Maps
            </a>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Pencil size={13} strokeWidth={1.75} aria-hidden />
            Cambiar
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={cardClass}>
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
        <div className="flex flex-col gap-2">
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !dirty}
              style={organizerAccentFilledButtonStyle()}
              className="h-[42px] shrink-0 rounded-xl px-5 text-[14px] font-semibold transition-[filter,opacity] hover:brightness-95 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : trimmed ? 'Guardar' : 'Quitar'}
            </button>
            {saved && (
              <button
                type="button"
                onClick={cancelEdit}
                className="h-[42px] shrink-0 rounded-xl px-3 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
        {fieldError && (
          <p role="alert" className="text-[12px] text-red-600">
            {fieldError}
          </p>
        )}
      </div>
    </section>
  )
}
