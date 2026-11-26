'use client'

import { AlertTriangle, Check, CircleAlert, Loader2, MonitorUp, ScanLine } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { beepError, beepOk } from '@/lib/scanner/beep'
import { type ScanDisplayMessage, openScannerDisplay, publishScan } from '@/lib/scanner/displayChannel'
import { extractOrderIds } from '@/lib/scanner/extractOrderIds'
import { confirmCashPayment, previewQr, scanQr } from '@/lib/organizerWorkspace'
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

/** Todo lo que falta canjear del pedido (en modo continuo no se eligen cantidades). */
function remainingQuantities(order: Order): Record<string, number> {
  return Object.fromEntries(
    order.items
      .map((item, i) => [item.id ?? String(i), item.quantity - (item.redeemedQuantity ?? 0)] as const)
      .filter(([, qty]) => qty > 0),
  )
}

function rowTitle(row: Row): string {
  const o = row.order
  if (!o) return row.orderId ? `#${row.orderId.slice(0, 8).toUpperCase()}` : 'Código no reconocido'
  return o.orderNumber != null ? `#${o.orderNumber}` : `#${o.id.slice(0, 8).toUpperCase()}`
}

function rowDetail(row: Row): string {
  const o = row.order
  if (!o) return ''
  const parts = [o.customerName?.trim(), o.vehiclePlate ? `Patente ${o.vehiclePlate}` : null].filter(Boolean)
  return parts.join(' · ')
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

const STATUS_UI: Record<RowStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  checking: { label: 'Validando…', cls: 'border-gray-200 bg-white', icon: <Loader2 size={16} className="animate-spin text-gray-400" /> },
  ok: { label: 'Ingresó', cls: 'border-emerald-200 bg-emerald-50/60', icon: <Check size={16} strokeWidth={2.5} className="text-emerald-600" /> },
  partial: { label: 'Entrega parcial', cls: 'border-emerald-200 bg-emerald-50/60', icon: <Check size={16} strokeWidth={2.5} className="text-emerald-600" /> },
  already: { label: 'Ya estaba escaneado', cls: 'border-amber-200 bg-amber-50/70', icon: <AlertTriangle size={16} className="text-amber-600" /> },
  duplicate: { label: 'Lectura repetida', cls: 'border-gray-200 bg-gray-50', icon: <AlertTriangle size={16} className="text-gray-400" /> },
  cash: { label: 'Falta cobrar el efectivo', cls: 'border-amber-200 bg-amber-50/70', icon: <CircleAlert size={16} className="text-amber-600" /> },
  error: { label: 'Error', cls: 'border-red-200 bg-red-50/70', icon: <CircleAlert size={16} className="text-red-600" /> },
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

  const redeem = useCallback(
    async (key: number, orderId: string, order: Order) => {
      const quantities = remainingQuantities(order)
      if (Object.keys(quantities).length === 0) {
        update(key, { status: 'already', message: 'No le queda nada por canjear.', order })
        beepError()
        return
      }
      const result = await scanQr(eventId, orderId, quantities)
      if (result.ok) {
        update(key, { status: result.order.status === 'delivered' ? 'ok' : 'partial', message: '', order: result.order })
        beepOk()
      } else if (result.alreadyScanned) {
        update(key, { status: 'already', message: 'Ese QR ya se usó.', order: result.order ?? order })
        beepError()
      } else {
        update(key, { status: 'error', message: result.error, order })
        beepError()
      }
    },
    [eventId, update],
  )

  const process = useCallback(
    async (key: number, orderId: string) => {
      const result = await previewQr(eventId, orderId)
      if (!result.ok) {
        if (result.alreadyScanned) {
          update(key, { status: 'already', message: 'Ese QR ya se usó.', order: result.order })
        } else {
          update(key, { status: 'error', message: result.error })
        }
        beepError()
        return
      }
      const order = result.order
      if (order.paymentMethod === 'cash' && order.paymentStatus !== 'approved') {
        update(key, { status: 'cash', message: 'Cobrá el efectivo y confirmalo para que ingrese.', order })
        beepError()
        return
      }
      await redeem(key, orderId, order)
    },
    [eventId, redeem, update],
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
      await redeem(row.key, row.orderId, res.order)
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
        void process(key, orderId)
      }
    },
    [process],
  )

  // El lector "teclea" donde esté el foco: el campo lo recupera siempre.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const okCount = rows.filter(r => r.status === 'ok' || r.status === 'partial').length
  const issueCount = rows.filter(r => r.status === 'error' || r.status === 'already' || r.status === 'cash').length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 text-center">
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-900">
          <ScanLine size={26} strokeWidth={1.75} aria-hidden />
          <span className="absolute -right-1 -top-1 size-3 animate-pulse rounded-full" style={{ background: 'var(--organizer-accent, #C6FF00)' }} aria-hidden />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">Escaneo continuo</p>
          <p className="mt-1 text-sm text-gray-400">Disparale a un QR tras otro: cada uno se valida solo y entra a la lista.</p>
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
          placeholder="El código aparece acá"
          className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-center text-sm text-gray-900 transition placeholder:text-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div className="flex w-full items-center justify-between text-[12px] text-gray-500">
          <span>
            <span className="font-semibold text-emerald-700 tabular-nums">{okCount}</span> ingresaron
            {issueCount > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-red-600 tabular-nums">{issueCount}</span> para revisar
              </>
            )}
          </span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                openScannerDisplay()
                inputRef.current?.focus()
              }}
              className="inline-flex items-center gap-1 font-semibold text-gray-700 transition-colors hover:text-gray-900"
            >
              <MonitorUp size={13} aria-hidden />
              Abrir pantalla para el público
            </button>
            <button type="button" onClick={onExit} className="text-gray-400 transition-colors hover:text-gray-700">
              Cambiar a cámara
            </button>
          </span>
        </div>
      </div>

      {rows.length > 0 && (
        <ol aria-label="Lecturas" className="flex flex-col gap-2">
          {rows.map(row => {
            const ui = STATUS_UI[row.status]
            const detail = rowDetail(row)
            return (
              <li key={row.key} className={cn('flex items-start gap-3 rounded-xl border px-3.5 py-2.5', ui.cls)}>
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {ui.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-gray-900">{rowTitle(row)}</p>
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                      {row.at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {detail && <p className="truncate text-[12px] text-gray-600">{detail}</p>}
                  <p className="text-[12px] font-semibold text-gray-500">
                    {ui.label}
                    {row.message && <span className="font-normal"> — {row.message}</span>}
                  </p>
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
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
