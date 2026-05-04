'use client'

import { Copy, ImageUp, Link2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { fetchOrganizerEventDetail, patchOrganizerEvent } from '@/lib/organizerEvents'
import { catalogPublicPath, getPublicSiteOriginForUi } from '@/lib/siteOrigin'
import { uploadEventCoverImage } from '@/lib/supabase/uploadEventCover'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Spinner } from '@/components/ui/Spinner'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'

export function StorefrontSettingsView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [slugDraft, setSlugDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingSlug, setSavingSlug] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState('')
  const [copyMsg, setCopyMsg] = useState('')

  const load = useCallback(async () => {
    setError('')
    const res = await fetchOrganizerEventDetail(eventId)
    if (!res.ok) {
      setError(res.error)
      setEvent(null)
    } else {
      setEvent(res.event)
      setSlugDraft(res.event.slug)
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    // Carga inicial (patrón como OrdersView)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial vía load()
    void load()
  }, [load])

  const hasCover = Boolean(event?.cover_image_url)
  const publicOrigin = getPublicSiteOriginForUi()
  const slugForUrl = event?.slug ?? slugDraft
  const publicUrl =
    hasCover && publicOrigin && slugForUrl ? `${publicOrigin}${catalogPublicPath(slugForUrl)}` : ''

  const handleSaveSlug = async () => {
    if (!hasCover) return
    const next = slugDraft.trim()
    if (next.length < 2) {
      setError('El identificador del enlace debe tener al menos 2 caracteres.')
      return
    }
    setSavingSlug(true)
    setError('')
    const res = await patchOrganizerEvent(eventId, { slug: next })
    setSavingSlug(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEvent(res.event)
    setSlugDraft(res.event.slug)
  }

  const handleCoverFile = async (file: File | null) => {
    if (!file) return
    setUploadingCover(true)
    setError('')
    const up = await uploadEventCoverImage(eventId, file)
    if (!up.ok) {
      setUploadingCover(false)
      setError(up.error)
      return
    }
    const res = await patchOrganizerEvent(eventId, { cover_image_url: up.publicUrl })
    setUploadingCover(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEvent(res.event)
  }

  const handleRemoveCover = async () => {
    setUploadingCover(true)
    setError('')
    const res = await patchOrganizerEvent(eventId, { cover_image_url: null })
    setUploadingCover(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEvent(res.event)
  }

  const handleCopyLink = async () => {
    if (!hasCover || !publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopyMsg('Copiado')
      setTimeout(() => setCopyMsg(''), 2000)
    } catch {
      setCopyMsg('')
      setError('No se pudo copiar. Copiá el enlace manualmente.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl flex flex-col items-center justify-center py-24 gap-3 mx-auto px-4">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando…</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <p className="text-sm text-red-600">{error || 'No se pudo cargar el evento.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <OrganizerToolHeading
        title="Link del catálogo"
        description="Empezá con una foto de portada: la usamos para el menú público. Cuando esté lista, podés definir el texto corto del enlace y compartirlo con tu gente."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <ImageUp className="h-4 w-4 text-gray-500" aria-hidden />
          Portada del catálogo
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Elegí una imagen representativa.
        </p>

        {event.cover_image_url ? (
          <div className="relative w-full max-h-[220px] rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
            <Image
              src={event.cover_image_url}
              alt="Portada del catálogo"
              width={1200}
              height={440}
              className="w-full h-auto max-h-[220px] object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-500">
            Todavía no hay imagen — tocá &quot;Elegir imagen&quot; para empezar.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
              className="sr-only"
              disabled={uploadingCover}
              onChange={e => void handleCoverFile(e.target.files?.[0] ?? null)}
            />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-40">
              {uploadingCover ? 'Subiendo…' : 'Elegir imagen'}
            </span>
          </label>
          {event.cover_image_url && (
            <button
              type="button"
              onClick={() => void handleRemoveCover()}
              disabled={uploadingCover}
              className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Quitar imagen
            </button>
          )}
        </div>
      </section>

      <section
        className={`space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${
          !hasCover ? 'opacity-70' : ''
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Link2 className="h-4 w-4 text-gray-500" aria-hidden />
          Tu enlace público
        </div>

        {!hasCover ? (
          <p className="text-sm text-gray-600 leading-relaxed">
            Subí una imagen de portada en la sección de arriba. Recién ahí vas a poder elegir el texto del link y
            copiarlo para WhatsApp, Instagram o donde quieras.
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              Solo letras minúsculas, números y guiones. No puede repetirse con otro evento.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className={inputClass}
                value={slugDraft}
                onChange={e => setSlugDraft(e.target.value)}
                placeholder="mi-festival-2026"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => void handleSaveSlug()}
                disabled={savingSlug || slugDraft.trim() === event.slug}
                className="shrink-0 rounded-full bg-gray-900 text-white text-sm font-medium px-5 py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                {savingSlug ? 'Guardando…' : 'Guardar'}
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Enlace para compartir</p>
              {publicUrl ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-sm text-gray-800 break-all font-mono">{publicUrl}</p>
                  <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    {copyMsg || 'Copiar'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Acá vas a ver el link completo cuando tu sitio tenga una dirección configurada.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
