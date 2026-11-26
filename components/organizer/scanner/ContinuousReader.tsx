'use client'

import { AlertTriangle, Check, CircleAlert, Loader2, MonitorUp, ScanLine } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { beepError, beepOk } from '@/lib/scanner/beep'
import { type ScanDisplayMessage, openScannerDisplay, publishScan } from '@/lib/scanner/displayChannel'
import { extractOrderIds } from '@/lib/scanner/extractOrderIds'
import { confirmCashPayment, scanQrAll } from '@/lib/organizerWorkspace'
import { PlateBadge } from '@/components/organizer/scanner/PlateBadge'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'

type RowStatus = 'checking' | 'ok' | 'partial' | 'already' | 'duplicate' | 'cash' | 'error'

type Row = {
  key: number
  orderId: string | null
  status: RowStatus
  message: string
  order?: Order
  at: Date
}

/** Cuántas lecturas quedan a la vista (las más nuevas arriba). */
const MAX_ROWS = 60
/** Una misma lectura repetida dentro de este tiempo es el mismo disparo (lector que rebota o doble gatillo). */
const DUPLICATE_WINDOW_MS = 4000

function rowTitle(row: Row): string {
  const o = row.order
  if (!o) return row.orderId ? `#${row.orderId.slice(0, 8).toUpperCase()}` : 'Código no reconocido'
  return o.orderNumber != null ? `#${o.orderNumber}` : `#${o.id.slice(0, 8).toUpperCase()}`
}

/** Lo que muestra la pantalla para el público: la patente bien grande (o el nº de pedido), verde o rojo. */
function displayMessage(status: RowStatus, order: Order | undefined, message: string): ScanDisplayMessage {
  const ok = status === 'ok' || status === 'partial'
  const headline = order?.vehiclePlate?.trim() || (order?.orderNumber != null ? `#${order.orderNumber}` : ok ? 'OK' : 'ERROR')
  const reason =
    status === 'already' ? 'Este QR ya se usó' : status === 'cash' ? 'Falta pagar en efectivo' : ok ? undefined : message || 'No se pudo validar'
  return {
    result: ok ? 'ok' : 'error',
    headline,
    detail: order?.items.map(i => i.name).join(' · ') || undefined,
    name: order?.customerName?.trim() || undefined,
    reason,
    at: Date.now(),
  }
}

type ListFilter = 'all' | 'ok' | 'issues'

/** Lecturas por página en la lista. */
const PAGE_SIZE = 10

const STATUS_UI: Record<RowStatus, { label: string; bar: string; pill: string; icon: React.ReactNode }> = {
  checking: { label: 'Validando…', bar: 'bg-gray-200', pill: 'bg-gray-100 text-gray-500', icon: <Loader2 size={16} className="animate-spin text-gray-400" /> },
  ok: { label: 'Ingresó', bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700', icon: <Check size={16} strokeWidth={2.5} className="text-emerald-600" /> },
  partial: { label: 'Entrega parcial', bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700', icon: <Check size={16} strokeWidth={2.5} className="text-emerald-600" /> },
  already: { label: 'Ya estaba escaneado', bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-800', icon: <AlertTriangle size={16} className="text-amber-600" /> },
  duplicate: { label: 'Lectura repetida', bar: 'bg-gray-200', pill: 'bg-gray-100 text-gray-500', icon: <AlertTriangle size={16} className="text-gray-400" /> },
  cash: { label: 'Falta cobrar el efectivo', bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-800', icon: <CircleAlert size={16} className="text-amber-600" /> },
  error: { label: 'Error', bar: 'bg-red-500', pill: 'bg-red-50 text-red-700', icon: <CircleAlert size={16} className="text-red-600" /> },
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'issue' | 'neutral' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <p className="text-[12px] font-semibold text-gray-500">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-[24px] font-semibold tabular-nums tracking-tight',
          tone === 'ok' ? 'text-emerald-600' : tone === 'issue' ? 'text-red-600' : 'text-gray-900',
        )}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Lector físico en modo continuo: el campo nunca pierde el foco, cada lectura entra a una lista y se valida
 * sola (canjea todo lo pendiente del pedido). Se puede seguir escaneando mientras se procesan las anteriores,
 * incluso con dos lectores en la misma compu. Los errores avisan con sonido y quedan marcados en la lista.
 */
export function ContinuousReader({ eventId, onExit }: { eventId: string; onExit: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState<ListFilter>('all')
  const [page, setPage] = useState(1)
  const keyRef = useRef(0)
  /** Último disparo por pedido, para no canjear dos veces la misma lectura repetida. */
  const lastSeenRef = useRef<Map<string, number>>(new Map())

  const update = useCallback((key: number, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)))
    // Cada resultado final se muestra también en la pantalla para el público (verde o rojo).
    if (patch.status && patch.status !== 'checking' && patch.status !== 'duplicate') {
      publishScan(displayMessage(patch.status, patch.order, patch.message ?? ''))
    }
  }, [])

  /** Un solo viaje al servidor: valida y canjea todo lo pendiente (o avisa por qué no). */
  const redeem = useCallback(
    async (key: number, orderId: string) => {
      const result = await scanQrAll(eventId, orderId)
      if (result.ok) {
        update(key, { status: result.order.status === 'delivered' ? 'ok' : 'partial', message: '', order: result.order })
        beepOk()
      } else if (result.alreadyScanned) {
        update(key, { status: 'already', message: 'Ese QR ya se usó.', order: result.order })
        beepError()
      } else if (result.cashPending) {
        update(key, { status: 'cash', message: 'Cobrá el efectivo y confirmalo para que ingrese.', order: result.order })
        beepError()
      } else {
        update(key, { status: 'error', message: result.error, order: result.order })
        beepError()
      }
    },
    [eventId, update],
  )

  const confirmCash = useCallback(
    async (row: Row) => {
      if (!row.orderId || !row.order) return
      update(row.key, { status: 'checking', message: '' })
      const res = await confirmCashPayment(eventId, row.orderId)
      if (!res.ok) {
        update(row.key, { status: 'error', message: res.error })
        beepError()
        return
      }
      await redeem(row.key, row.orderId)
      inputRef.current?.focus()
    },
    [eventId, redeem, update],
  )

  const submit = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text) return
      const ids = extractOrderIds(text)
      const now = Date.now()
      if (ids.length === 0) {
        const key = ++keyRef.current
        setRows(prev => [{ key, orderId: null, status: 'error' as RowStatus, message: 'No se reconoció el código. Escaneá de nuevo.', at: new Date() }, ...prev].slice(0, MAX_ROWS))
        beepError()
        return
      }
      for (const orderId of ids) {
        const key = ++keyRef.current
        const last = lastSeenRef.current.get(orderId)
        lastSeenRef.current.set(orderId, now)
        if (last !== undefined && now - last < DUPLICATE_WINDOW_MS) {
          setRows(prev => [{ key, orderId, status: 'duplicate' as RowStatus, message: 'Se leyó dos veces seguidas: se cuenta una sola.', at: new Date() }, ...prev].slice(0, MAX_ROWS))
          continue
        }
        setRows(prev => [{ key, orderId, status: 'checking' as RowStatus, message: '', at: new Date() }, ...prev].slice(0, MAX_ROWS))
        void redeem(key, orderId)
      }
    },
    [redeem],
  )

  // El lector "teclea" donde esté el foco: el campo lo recupera siempre.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const okRows = rows.filter(r => r.status === 'ok' || r.status === 'partial')
  const issueRows = rows.filter(r => r.status === 'error' || r.status === 'already' || r.status === 'cash')
  const visible = filter === 'ok' ? okRows : filter === 'issues' ? issueRows : rows
  const pageRows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const latestKey = rows[0]?.key

  const filters: { key: ListFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: rows.length },
    { key: 'ok', label: 'Ingresaron', count: okRows.length },
    { key: 'issues', label: 'Para revisar', count: issueRows.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Lector */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-900">
            <ScanLine size={22} strokeWidth={1.75} aria-hidden />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse rounded-full" style={{ background: 'var(--organizer-accent, #C6FF00)' }} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[15px] font-semibold text-gray-900">Escaneo continuo</p>
            <p className="text-[13px] text-gray-500">Disparale a un QR tras otro: cada uno se valida solo.</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            // La mayoría de los lectores cierran con Enter; algunos con Tab.
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              const read = value
              setValue('')
              submit(read)
            }
          }}
          onBlur={e => {
            // Si el foco se va sin ir a otro control (ej. un clic en la lista), se recupera para no perder lecturas.
            if (!e.relatedTarget) window.setTimeout(() => inputRef.current?.focus(), 0)
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Código leído por el lector de QR"
          placeholder="Listo para leer…"
          className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3 text-center text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <button
            type="button"
            onClick={() => {
              openScannerDisplay()
              inputRef.current?.focus()
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <MonitorUp size={14} aria-hidden />
            Abrir pantalla para el público
          </button>
          <button type="button" onClick={onExit} className="text-gray-400 transition-colors hover:text-gray-700">
            Cambiar a cámara
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2" aria-label="Resumen de lecturas">
        <SummaryTile label="Ingresaron" value={okRows.length} tone="ok" />
        <SummaryTile label="Para revisar" value={issueRows.length} tone={issueRows.length > 0 ? 'issue' : 'neutral'} />
        <SummaryTile label="Lecturas" value={rows.length} tone="neutral" />
      </div>

      {rows.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
            <div role="tablist" aria-label="Filtrar lecturas" className="inline-flex gap-1 rounded-lg bg-[#F5F5F7] p-0.5">
              {filters.map(f => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => {
                    setFilter(f.key)
                    setPage(1)
                    inputRef.current?.focus()
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                    filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  {f.label} <span className="tabular-nums text-gray-400">{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {pageRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-gray-400">Nada por acá.</p>
          ) : (
            <ol aria-label="Lecturas" className="divide-y divide-gray-100">
              {pageRows.map(row => {
                const ui = STATUS_UI[row.status]
                const o = row.order
                const latest = row.key === latestKey
                const vehicle = o?.items.map(i => i.name).join(' · ')
                return (
                  <li
                    key={row.key}
                    className={cn(
                      'relative flex items-center gap-3 px-4 py-3 transition-colors',
                      latest && 'nb-row-in bg-gray-50/80',
                    )}
                  >
                    <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', ui.bar)} />
                    <span className="shrink-0" aria-hidden>
                      {ui.icon}
                    </span>
                    <div className="w-[104px] shrink-0">
                      {o?.vehiclePlate ? (
                        <PlateBadge plate={o.vehiclePlate} />
                      ) : (
                        <span className="text-[14px] font-semibold tabular-nums text-gray-900">{rowTitle(row)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[13px] font-semibold text-gray-900">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', ui.pill)}>{ui.label}</span>
                        {latest && <span className="text-[11px] font-semibold text-gray-400">Última</span>}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-gray-500">
                        {[vehicle, o?.customerName?.trim(), o?.vehiclePlate && o.orderNumber != null ? `#${o.orderNumber}` : null]
                          .filter(Boolean)
                          .join(' · ') || (row.orderId ? `Pedido ${rowTitle(row)}` : '')}
                      </p>
                      {row.message && <p className="mt-0.5 text-[12px] text-gray-600">{row.message}</p>}
                      {row.status === 'cash' && (
                        <button
                          type="button"
                          onClick={() => void confirmCash(row)}
                          className="mt-1.5 inline-flex h-8 items-center rounded-lg bg-gray-900 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-gray-800"
                        >
                          Cobré el efectivo
                        </button>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                      {row.at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}

          {visible.length > PAGE_SIZE && (
            <div className="border-t border-gray-100 px-3 py-2">
              <PaginationBar page={page} pageSize={PAGE_SIZE} total={visible.length} onPageChange={setPage} />
            </div>
          )}
        </section>
      )}
      <style>{`
        @keyframes nb-row-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .nb-row-in { animation: nb-row-in 220ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .nb-row-in { animation: none; } }
      `}</style>
    </div>
  )
}
