'use client'

import { Gift } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Button } from '@/components/ui/Button'
import { type Courtesy, type CourtesyKind, createCourtesy, fetchCourtesies } from '@/lib/courtesies'
import { hasModule } from '@/lib/modules'
import { fetchTickets, type WorkspaceTicket } from '@/lib/organizerWorkspace'
import { cn, formatDate } from '@/lib/utils'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)]'
const labelClass = 'text-[13px] font-semibold text-gray-700'

const EMPTY_PERSON = { name: '', email: '', phone: '', plate: '', dni: '', quantity: '1' }

/**
 * Cortesías: entradas o lugares de parking sin cargo a nombre de alguien. Se generan al instante (como una
 * compra sin cargo) y le llega el QR por mail.
 *
 * - En un evento: `eventId` es el evento.
 * - En el panel del estacionamiento: `eventId` es el base (lista las de todos sus eventos) y `events` son los
 *   eventos para elegir a cuál va la cortesía.
 */
export function CourtesyView({
  eventId,
  modules,
  events,
}: {
  eventId: string
  /** Módulos habilitados: parking y/o entradas (tickets). */
  modules: readonly string[] | null | undefined
  events?: { id: string; name: string }[]
}) {
  const kinds = useMemo(
    () =>
      [
        hasModule(modules, 'parking') ? ({ key: 'parking', label: 'Parking' } as const) : null,
        hasModule(modules, 'tickets') ? ({ key: 'ticket', label: 'Entrada' } as const) : null,
      ].filter(Boolean) as { key: CourtesyKind; label: string }[],
    [modules],
  )
  const [kind, setKind] = useState<CourtesyKind | null>(kinds[0]?.key ?? null)
  const [targetEventId, setTargetEventId] = useState(events ? '' : eventId)
  const [types, setTypes] = useState<WorkspaceTicket[] | null>(null)
  const [ticketId, setTicketId] = useState('')
  const [person, setPerson] = useState(EMPTY_PERSON)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<{ message: string; field?: string } | null>(null)
  const [sent, setSent] = useState<Courtesy | null>(null)
  const [recent, setRecent] = useState<Courtesy[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  // Tipos del evento elegido (en parking incluye los heredados del estacionamiento).
  useEffect(() => {
    if (!kind || !targetEventId) return
    let cancelled = false
    void fetchTickets(targetEventId, kind).then(r => {
      if (cancelled) return
      const list = r.ok ? r.tickets : []
      setTypes(list)
      setTicketId(list[0]?.id ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [kind, targetEventId])

  useEffect(() => {
    let cancelled = false
    void fetchCourtesies(eventId).then(r => {
      if (!cancelled && r.ok) setRecent(r.data)
    })
    return () => {
      cancelled = true
    }
  }, [eventId, reloadToken])

  const isParking = kind === 'parking'
  const set = (k: keyof typeof EMPTY_PERSON) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerson(p => ({ ...p, [k]: e.target.value }))
    setError(null)
    setSent(null)
  }

  const submit = async () => {
    if (!kind || !targetEventId || !ticketId || saving) return
    setSaving(true)
    setError(null)
    setSent(null)
    const r = await createCourtesy(targetEventId, {
      kind,
      ticket_id: ticketId,
      customer_name: person.name.trim(),
      customer_email: person.email.trim(),
      customer_phone: person.phone.trim() || undefined,
      ...(isParking
        ? { vehicle_plate: person.plate.trim(), customer_dni: person.dni.trim() }
        : { quantity: Number(person.quantity) || 1 }),
    })
    setSaving(false)
    if (!r.ok) {
      setError({ message: r.error, field: r.field })
      return
    }
    setSent(r.data)
    setPerson(EMPTY_PERSON)
    setReloadToken(n => n + 1)
  }

  const invalid = (field: string) => error?.field === field

  if (kinds.length === 0) {
    return (
      <div className="max-w-2xl">
        <OrganizerToolHeading title="Cortesías" description="Entradas o lugares de parking sin cargo, a nombre de alguien." />
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-[13px] text-gray-500">
          Tu cuenta no tiene parking ni entradas habilitados.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <OrganizerToolHeading
        title="Cortesías"
        description="Generá una entrada o un lugar de parking sin cargo a nombre de alguien. Le llega el QR por mail, como si lo hubiera comprado."
      />

      <form
        onSubmit={e => {
          e.preventDefault()
          void submit()
        }}
        className="space-y-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      >
        {kinds.length > 1 && (
          <div role="radiogroup" aria-label="Tipo de cortesía" className="inline-flex gap-1 rounded-xl bg-[#F5F5F7] p-1">
            {kinds.map(k => (
              <button
                key={k.key}
                type="button"
                role="radio"
                aria-checked={kind === k.key}
                onClick={() => {
                  setKind(k.key)
                  setTypes(null)
                  setError(null)
                  setSent(null)
                }}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  kind === k.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900',
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {events && (
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={labelClass}>Evento</span>
              <select
                className={inputClass}
                value={targetEventId}
                onChange={e => {
                  setTargetEventId(e.target.value)
                  setTypes(null)
                  setSent(null)
                }}
              >
                <option value="">Elegí el evento</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className={cn('flex flex-col gap-1.5', isParking && 'sm:col-span-2')}>
            <span className={labelClass}>{isParking ? 'Tipo de vehículo' : 'Tipo de entrada'}</span>
            <select
              className={inputClass}
              value={ticketId}
              disabled={!targetEventId || !types || types.length === 0}
              onChange={e => setTicketId(e.target.value)}
            >
              {!targetEventId ? (
                <option value="">Primero elegí el evento</option>
              ) : !types ? (
                <option value="">Cargando…</option>
              ) : types.length === 0 ? (
                <option value="">{isParking ? 'Este evento no tiene tipos de vehículo' : 'Este evento no tiene entradas'}</option>
              ) : (
                types.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.is_active ? '' : ' (pausado)'}
                  </option>
                ))
              )}
            </select>
          </label>

          {!isParking && (
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Cantidad</span>
              <input
                className={cn(inputClass, invalid('quantity') && 'border-red-300')}
                type="number"
                min={1}
                max={20}
                value={person.quantity}
                onChange={set('quantity')}
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Nombre y apellido</span>
            <input className={cn(inputClass, invalid('customer_name') && 'border-red-300')} value={person.name} onChange={set('name')} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Email</span>
            <input
              className={cn(inputClass, invalid('customer_email') && 'border-red-300')}
              type="email"
              value={person.email}
              onChange={set('email')}
              placeholder="Le llega el QR acá"
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>
              Teléfono <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <input className={inputClass} type="tel" value={person.phone} onChange={set('phone')} autoComplete="off" />
          </label>

          {isParking && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Patente</span>
                <input
                  className={cn(inputClass, 'uppercase', invalid('vehicle_plate') && 'border-red-300')}
                  value={person.plate}
                  onChange={set('plate')}
                  placeholder="AB123CD"
                  autoComplete="off"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>DNI del titular</span>
                <input
                  className={cn(inputClass, invalid('customer_dni') && 'border-red-300')}
                  inputMode="numeric"
                  value={person.dni}
                  onChange={set('dni')}
                  autoComplete="off"
                />
              </label>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error.message}
          </p>
        )}
        {sent && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
            Cortesía generada{sent.order_number != null ? ` (#${sent.order_number})` : ''}: le mandamos el QR a{' '}
            <strong>{sent.customer_email}</strong>.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={saving} disabled={!targetEventId || !ticketId}>
            <span className="inline-flex items-center gap-1.5">
              <Gift size={14} aria-hidden />
              Generar cortesía
            </span>
          </Button>
        </div>
      </form>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[14px] font-semibold text-gray-900">Últimas cortesías</h2>
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white">
            {recent.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gray-900">
                    {c.customer_name}
                    {c.vehicle_plate ? ` · ${c.vehicle_plate}` : ''}
                  </span>
                  <span className="block truncate text-gray-500">
                    {[c.item && (c.quantity > 1 ? `${c.quantity} × ${c.item}` : c.item), events ? c.event_name : null, c.customer_email]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-gray-400">
                  {c.order_number != null ? `#${c.order_number} · ` : ''}
                  {c.created_at ? formatDate(c.created_at) : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
