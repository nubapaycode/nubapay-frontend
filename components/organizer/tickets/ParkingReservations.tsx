'use client'

import { Check, RefreshCw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import {
  fetchParkingReservations,
  type ParkingReservation,
  type ParkingReservationStatus,
} from '@/lib/organizerWorkspace'
import { ParkingIcon } from '@/lib/parkingIcons'
import { cn } from '@/lib/utils'

const STATUS_TABS: { key: ParkingReservationStatus; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Por ingresar' },
  { key: 'in', label: 'Ingresaron' },
]

const EMPTY_COUNTS: Record<ParkingReservationStatus, number> = { all: 0, pending: 0, in: 0 }

/** Patente con estilo de chapa, para reconocerla de un vistazo en la entrada. */
function Plate({ value }: { value: string | null }) {
  if (!value) return <span className="text-[12px] text-gray-300">Sin patente</span>
  return (
    <span className="inline-flex rounded-md border border-gray-300 bg-white px-2 py-0.5 font-mono text-[13px] font-semibold tracking-widest text-gray-900 shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]">
      {value}
    </span>
  )
}

function EnteredPill({ r }: { r: ParkingReservation }) {
  if (!r.entered) {
    return <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">Por ingresar</span>
  }
  const time = r.enteredAt
    ? new Date(r.enteredAt.endsWith('Z') ? r.enteredAt : `${r.enteredAt}Z`).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <Check size={12} strokeWidth={2.25} aria-hidden />
      Ingresó{time ? ` ${time}` : ''}
    </span>
  )
}

/**
 * Lugares de parking pagados, con patente y DNI: lo que mira quien atiende la entrada del estacionamiento.
 * Busca por patente, DNI, nombre, email o número de pedido.
 */
export function ParkingReservations({
  eventId,
  onCounts,
}: {
  eventId: string
  /** Avisa los totales (para el contador de la pestaña). */
  onCounts?: (counts: Record<ParkingReservationStatus, number>) => void
}) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState<ParkingReservationStatus>('all')
  const [reservations, setReservations] = useState<ParkingReservation[]>([])
  const [counts, setCounts] = useState(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    let cancelled = false
    void fetchParkingReservations(eventId, { q: debounced, status }).then(res => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setError('')
      setReservations(res.reservations)
      setCounts(res.counts)
      if (!debounced) onCounts?.(res.counts)
    })
    return () => {
      cancelled = true
    }
  }, [eventId, debounced, status, reloadKey, onCounts])

  const searching = debounced.trim() !== ''

  return (
    <div className="nb-rise">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar reservas</span>
          <Search size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por patente, DNI, nombre o pedido"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-[14px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)]"
          />
        </label>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Estado de ingreso" className="inline-flex rounded-xl bg-gray-100 p-1">
            {STATUS_TABS.map(tab => {
              const active = status === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] transition-colors',
                    active ? 'bg-white font-semibold text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  {tab.label}
                  <span className="tabular-nums text-gray-400">{formatCount(counts[tab.key])}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey(k => k + 1)}
            aria-label="Actualizar reservas"
            title="Actualizar"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <RefreshCw size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-2">
          <p className="sr-only">Cargando reservas…</p>
          {[0, 1, 2].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-gray-900">
            {searching ? 'No hay reservas que coincidan' : status === 'all' ? 'Todavía no hay reservas' : 'No hay reservas en este estado'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500">
            {searching
              ? 'Probá con otra patente, DNI o nombre.'
              : 'Cuando alguien pague un lugar, aparece acá con su patente y DNI.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <table className="w-full text-left text-[13px]">
            <thead className="hidden border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-400 md:table-header-group">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Patente</th>
                <th className="px-4 py-2.5 font-semibold">Vehículo</th>
                <th className="px-4 py-2.5 font-semibold">Titular</th>
                <th className="px-4 py-2.5 font-semibold">Pedido</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map(r => (
                <tr key={r.orderId} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 px-4 py-3 md:table-row md:p-0">
                  <td className="md:px-4 md:py-3">
                    <Plate value={r.vehiclePlate} />
                  </td>
                  <td className="justify-self-end md:hidden">
                    <EnteredPill r={r} />
                  </td>
                  <td className="col-span-2 md:px-4 md:py-3">
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                      <ParkingIcon iconKey={r.icon} size={15} strokeWidth={1.75} />
                      {r.vehicle}
                    </span>
                  </td>
                  <td className="col-span-2 min-w-0 md:px-4 md:py-3">
                    <p className="truncate font-medium text-gray-900">{r.customerName || 'Sin nombre'}</p>
                    <p className="truncate text-[12px] text-gray-500">
                      {r.customerDni ? `DNI ${r.customerDni}` : 'Sin DNI'}
                      {r.customerEmail ? ` · ${r.customerEmail}` : ''}
                    </p>
                  </td>
                  <td className="col-span-2 text-[12px] text-gray-500 md:px-4 md:py-3 md:text-[13px]">
                    {r.orderNumber != null ? `#${r.orderNumber}` : '—'}
                  </td>
                  <td className="hidden text-right md:table-cell md:px-4 md:py-3">
                    <EnteredPill r={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
