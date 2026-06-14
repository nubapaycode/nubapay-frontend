'use client'

import { useCallback, useEffect, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { fetchOrganizerEventDetail, patchOrganizerEvent } from '@/lib/organizerEvents'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'

/** Convierte ISO string a valor para <input type="datetime-local"> */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Convierte valor de datetime-local a ISO string o null si vacío */
function fromDatetimeLocal(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export function ConfigView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { show: showToast, ToastPortal } = useToast()

  const [nameDraft, setNameDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')
  const [startsAtDraft, setStartsAtDraft] = useState('')
  const [endsAtDraft, setEndsAtDraft] = useState('')
  const [isActiveDraft, setIsActiveDraft] = useState(false)
  const [notifyPickupPointDraft, setNotifyPickupPointDraft] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (res.ok) {
      const ev = res.event
      setEvent(ev)
      setNameDraft(ev.name)
      setDescDraft(ev.description ?? '')
      setStartsAtDraft(toDatetimeLocal(ev.starts_at))
      setEndsAtDraft(toDatetimeLocal(ev.ends_at))
      setIsActiveDraft(ev.is_active)
      setNotifyPickupPointDraft(ev.notify_pickup_point)
    } else {
      showToast(res.error, 'error')
    }
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  const handleSave = async () => {
    const name = nameDraft.trim()
    if (!name) { showToast('El nombre del evento no puede estar vacío.', 'error'); return }
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, {
      name,
      description: descDraft.trim() || null,
      starts_at: fromDatetimeLocal(startsAtDraft),
      ends_at: fromDatetimeLocal(endsAtDraft),
      is_active: isActiveDraft,
      notify_pickup_point: notifyPickupPointDraft,
    })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    window.dispatchEvent(new CustomEvent('nubapay-event-updated', { detail: { name: res.event.name } }))
    showToast('Cambios guardados.', 'success')
  }

  const hasChanges =
    event !== null && (
      nameDraft.trim() !== event.name ||
      (descDraft.trim() || null) !== event.description ||
      fromDatetimeLocal(startsAtDraft) !== event.starts_at ||
      fromDatetimeLocal(endsAtDraft) !== event.ends_at ||
      isActiveDraft !== event.is_active ||
      notifyPickupPointDraft !== event.notify_pickup_point
    )

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
        <ToastPortal />
        <p className="text-sm text-gray-400">No se pudo cargar el evento.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <ToastPortal />

      <OrganizerToolHeading
        title="Configuración"
        description="Información general del evento."
      />

      <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path d="M7.5 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" stroke="#6B7280" strokeWidth="1.4" />
              <path d="M7.5 6.5v4M7.5 4.5v.5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Información del evento</p>
            <p className="text-xs text-gray-400 mt-0.5">Nombre, descripción y fechas visibles al público</p>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500" htmlFor="cfg-name">Nombre del evento</label>
            <input
              id="cfg-name"
              className={inputClass}
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              placeholder="Festival de verano 2026"
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500" htmlFor="cfg-desc">
              Descripción <span className="text-gray-300">(opcional)</span>
            </label>
            <textarea
              id="cfg-desc"
              className={inputClass + ' resize-none'}
              rows={3}
              value={descDraft}
              onChange={e => setDescDraft(e.target.value)}
              placeholder="Una descripción breve del evento…"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500" htmlFor="cfg-starts">
                Inicio <span className="text-gray-300">(opcional)</span>
              </label>
              <input
                id="cfg-starts"
                type="datetime-local"
                className={inputClass}
                value={startsAtDraft}
                onChange={e => setStartsAtDraft(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500" htmlFor="cfg-ends">
                Fin <span className="text-gray-300">(opcional)</span>
              </label>
              <input
                id="cfg-ends"
                type="datetime-local"
                className={inputClass}
                value={endsAtDraft}
                onChange={e => setEndsAtDraft(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle is_active */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Evento activo</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Cuando está inactivo, el catálogo público no acepta nuevos pedidos
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActiveDraft}
              onClick={() => setIsActiveDraft(v => !v)}
              className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                isActiveDraft ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                  isActiveDraft ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Toggle notify_pickup_point */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Avisar punto de retiro en email</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Cuando está activo, el email de confirmación del pedido incluye el nombre del punto de retiro asignado
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyPickupPointDraft}
              onClick={() => setNotifyPickupPointDraft(v => !v)}
              className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                notifyPickupPointDraft ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                  notifyPickupPointDraft ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !hasChanges}
            className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </section>
    </div>
  )
}
