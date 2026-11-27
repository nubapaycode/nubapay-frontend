'use client'

import { Check, Gift } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Button } from '@/components/ui/Button'
import { type Courtesy, type CourtesyKind, createCourtesy, fetchCourtesies } from '@/lib/courtesies'
import { hasModule } from '@/lib/modules'
import { fetchTickets, type WorkspaceTicket } from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)]'
const labelClass = 'text-[13px] font-semibold text-gray-700'

/** Estado de la cortesía en la lista: si ya se usó el QR. */
const COURTESY_STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: 'Sin usar', className: 'text-gray-500' },
  partially_delivered: { label: 'Usada en parte', className: 'text-emerald-700' },
  delivered: { label: 'Usada', className: 'text-emerald-700' },
  cancelled: { label: 'Anulada', className: 'text-red-600' },
}

/** "25 nov, 18:14": corto y en 24 h. */
function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date}, ${time}`
}

/** Campo con su etiqueta; el error (o la ayuda) va debajo, fuera del label para no ensuciar su nombre. */
function Field({
  label,
  below,
  className,
  children,
}: {
  label: React.ReactNode
  below?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{label}</span>
        {children}
      </label>
      {below}
    </div>
  )
}

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

  /** El error del servidor va debajo de su campo; si no corresponde a ninguno visible, arriba del botón. */
  const fieldError = (field: string) =>
    error?.field === field ? (
      <p role="alert" className="text-[12px] text-red-600">
        {error.message}
      </p>
    ) : null
  const visibleFields = ['quantity', 'customer_name', 'customer_email', ...(isParking ? ['vehicle_plate', 'customer_dni'] : [])]
  const generalError = error && (!error.field || !visibleFields.includes(error.field)) ? error.message : null
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
    <div className="max-w-5xl">
      <OrganizerToolHeading
        title="Cortesías"
        description="Entradas o lugares de parking sin cargo. A la persona le llega el QR por mail."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <form
          onSubmit={e => {
            e.preventDefault()
            void submit()
          }}
          className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        >
          {/* Qué se regala */}
          <fieldset className="space-y-4 p-5">
            <legend className="sr-only">Qué se regala</legend>

            {events && (
              <label className="flex flex-col gap-1.5">
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

            {kinds.length > 1 && (
              <div role="radiogroup" aria-label="Tipo de cortesía" className="grid grid-cols-2 gap-1 rounded-xl bg-[#F5F5F7] p-1">
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
                      'rounded-lg py-2 text-[13px] font-semibold transition-colors',
                      kind === k.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900',
                    )}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span id="courtesy-type-label" className={labelClass}>
                {isParking ? 'Tipo de vehículo' : 'Tipo de entrada'}
              </span>
              {!targetEventId ? (
                <p className="text-[13px] text-gray-400">Primero elegí el evento.</p>
              ) : !types ? (
                <p className="text-[13px] text-gray-400">Cargando…</p>
              ) : types.length === 0 ? (
                <p className="text-[13px] text-gray-500">
                  {isParking ? 'Este evento no tiene tipos de vehículo.' : 'Este evento no tiene entradas.'}
                </p>
              ) : (
                <div role="radiogroup" aria-labelledby="courtesy-type-label" className="flex flex-wrap gap-2">
                  {types.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={ticketId === t.id}
                      onClick={() => setTicketId(t.id)}
                      className={cn(
                        'h-9 rounded-lg border px-3.5 text-[13px] font-semibold transition-colors',
                        ticketId === t.id
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900',
                      )}
                    >
                      {t.name}
                      {!t.is_active && <span className="ml-1 font-normal opacity-60">(pausado)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isParking ? (
              <Field label="Patente" below={fieldError('vehicle_plate')}>
                <input
                  className={cn(inputClass, 'uppercase', invalid('vehicle_plate') && 'border-red-300')}
                  value={person.plate}
                  onChange={set('plate')}
                  placeholder="AB123CD"
                  autoComplete="off"
                />
              </Field>
            ) : (
              <Field label="Cantidad" className="sm:max-w-[160px]" below={fieldError('quantity')}>
                <input
                  className={cn(inputClass, invalid('quantity') && 'border-red-300')}
                  type="number"
                  min={1}
                  max={20}
                  value={person.quantity}
                  onChange={set('quantity')}
                />
              </Field>
            )}
          </fieldset>

          {/* Para quién */}
          <fieldset className="grid gap-4 border-t border-gray-100 p-5 sm:grid-cols-2">
            <legend className="sr-only">Para quién</legend>
            <p className="text-[13px] font-semibold text-gray-900 sm:col-span-2">Para quién</p>
            <Field label="Nombre y apellido" className={cn(!isParking && 'sm:col-span-2')} below={fieldError('customer_name')}>
              <input
                className={cn(inputClass, invalid('customer_name') && 'border-red-300')}
                value={person.name}
                onChange={set('name')}
                autoComplete="off"
              />
            </Field>
            {isParking && (
              <Field label="DNI del titular" below={fieldError('customer_dni')}>
                <input
                  className={cn(inputClass, invalid('customer_dni') && 'border-red-300')}
                  inputMode="numeric"
                  value={person.dni}
                  onChange={set('dni')}
                  autoComplete="off"
                />
              </Field>
            )}
            <Field label="Email" below={fieldError('customer_email') ?? <span className="text-[12px] text-gray-400">Le llega el QR acá.</span>}>
              <input
                className={cn(inputClass, invalid('customer_email') && 'border-red-300')}
                type="email"
                value={person.email}
                onChange={set('email')}
                autoComplete="off"
              />
            </Field>
            <Field
              label={
                <>
                  Teléfono <span className="font-normal text-gray-400">(opcional)</span>
                </>
              }
            >
              <input className={inputClass} type="tel" value={person.phone} onChange={set('phone')} autoComplete="off" />
            </Field>
          </fieldset>

          <div className="space-y-3 border-t border-gray-100 p-5">
            {generalError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {generalError}
              </p>
            )}
            {sent && (
              <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
                <Check size={16} className="mt-px shrink-0" aria-hidden />
                <span>
                  Cortesía generada{sent.order_number != null ? ` (#${sent.order_number})` : ''}: le mandamos el QR a{' '}
                  <strong className="font-semibold">{sent.customer_email}</strong>.
                </span>
              </p>
            )}
            <Button type="submit" loading={saving} disabled={!targetEventId || !ticketId} className="w-full">
              <span className="inline-flex items-center gap-1.5">
                <Gift size={15} aria-hidden />
                Generar cortesía
              </span>
            </Button>
          </div>
        </form>

        <section aria-labelledby="recent-courtesies" className="min-w-0">
          <h2 id="recent-courtesies" className="mb-3 text-[14px] font-semibold text-gray-900">
            Últimas cortesías
          </h2>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center text-[13px] text-gray-400">
              Todavía no generaste cortesías.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white">
              {recent.map(c => {
                const status = COURTESY_STATUS[c.status]
                return (
                  <li key={c.id} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2 text-[14px]">
                        <span className="truncate font-semibold text-gray-900">{c.customer_name}</span>
                        {c.vehicle_plate && (
                          <span className="shrink-0 font-semibold uppercase tabular-nums tracking-wide text-gray-500">{c.vehicle_plate}</span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-gray-500">
                        {[c.item && (c.quantity > 1 ? `${c.quantity} × ${c.item}` : c.item), events ? c.event_name : null, c.customer_email]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {status && <p className={cn('text-[12px] font-semibold', status.className)}>{status.label}</p>}
                      <p className="mt-0.5 text-[12px] tabular-nums text-gray-400">
                        {[c.order_number != null ? `#${c.order_number}` : null, c.created_at ? shortDate(c.created_at) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
