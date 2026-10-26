'use client'

import { Check, ChevronDown, ChevronUp, Copy, Link2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Money } from '@/components/organizer/dashboard/AnimatedNumber'
import { PAYMENT_CONFIG } from '@/components/organizer/dashboard/Panels'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'

import { PAY_LABEL, fullDateTime, scanInfo, statusUi } from './orderUi'

type TimelineEvent = { at: string | null; title: string; detail?: string; tone: 'done' | 'warn' | 'danger' | 'todo' }

/** Línea de tiempo armada con lo que ya trae el pedido: pago, retiros por ítem y cancelación. */
function buildTimeline(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      at: order.createdAt,
      title: 'Pedido pagado',
      detail: order.paymentMethod ? `con ${PAY_LABEL[order.paymentMethod] ?? order.paymentMethod}` : undefined,
      tone: 'done',
    },
  ]
  // Los ítems retirados juntos comparten la marca de tiempo: se agrupan en un solo paso.
  const byTime = new Map<string, string[]>()
  for (const item of order.items) {
    if (!item.redeemedAt || !item.redeemedQuantity) continue
    const label = `${item.redeemedQuantity < item.quantity ? `${item.redeemedQuantity} de ${item.quantity}` : `${item.quantity}×`} ${item.name}`
    byTime.set(item.redeemedAt, [...(byTime.get(item.redeemedAt) ?? []), label])
  }
  for (const [at, labels] of [...byTime.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    events.push({ at, title: 'Retiro escaneado', detail: labels.join(', '), tone: 'done' })
  }
  if (order.status === 'cancelled') {
    events.push({ at: order.updatedAt, title: 'Pedido cancelado', detail: 'El QR dejó de ser válido', tone: 'danger' })
  } else {
    const { units, redeemed } = scanInfo(order)
    if (redeemed == null || redeemed < units) {
      events.push({
        at: null,
        title: redeemed ? 'Falta retirar el resto' : 'Esperando el retiro',
        detail: redeemed != null ? `${units - redeemed} de ${units} unidades pendientes` : undefined,
        tone: 'todo',
      })
    }
  }
  return events
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group flex items-center justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="truncate text-[13px] text-gray-900" title={value}>{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1400)
          })
        }}
        aria-label={`Copiar ${label.toLowerCase()}`}
        title="Copiar"
        className="shrink-0 rounded-lg p-1.5 text-gray-300 opacity-0 transition-[opacity,color,background-color] hover:bg-gray-100 hover:text-gray-700 focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check size={14} strokeWidth={2} className="text-emerald-600" /> : <Copy size={14} strokeWidth={1.75} />}
      </button>
    </div>
  )
}

export function OrderDetailSheet({
  order,
  onClose,
  onPrev,
  onNext,
  onCancelOrder,
}: {
  order: Order
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  onCancelOrder: (order: Order) => Promise<{ ok: true } | { ok: false; error: string }>
}) {
  const [cancelStage, setCancelStage] = useState<'none' | 'first' | 'second'>('none')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  // Al pasar a otro pedido con ↑/↓ se descarta una cancelación a medio confirmar.
  const [stageOrderId, setStageOrderId] = useState(order.id)
  if (stageOrderId !== order.id) {
    setStageOrderId(order.id)
    setCancelStage('none')
    setCancelError('')
  }

  // Esc cierra; ↑/↓ o K/J pasan al pedido anterior/siguiente de la lista (como en Mercury / Linear).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (e.key === 'Escape') onClose()
      else if ((e.key === 'ArrowUp' || e.key === 'k') && onPrev) {
        e.preventDefault()
        onPrev()
      } else if ((e.key === 'ArrowDown' || e.key === 'j') && onNext) {
        e.preventDefault()
        onNext()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  const st = statusUi(order.status)
  const scan = scanInfo(order)
  const timeline = buildTimeline(order)
  const payColor = PAYMENT_CONFIG.find(p => p.key === order.paymentMethod)?.color
  const canCancel = order.status !== 'cancelled' && order.status !== 'delivered'

  const confirmCancel = async () => {
    setCancelling(true)
    setCancelError('')
    const res = await onCancelOrder(order)
    setCancelling(false)
    if (!res.ok) {
      setCancelError(res.error)
      return
    }
    setCancelStage('none')
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="nb-fade fixed inset-0 z-[70] cursor-default bg-gray-900/10 md:bg-transparent"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={order.orderNumber != null ? `Pedido #${order.orderNumber}` : 'Detalle del pedido'}
        className="nb-sheet fixed inset-x-0 bottom-0 z-[71] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-[0_24px_64px_-12px_rgba(16,24,40,0.28)] md:inset-x-auto md:bottom-3 md:right-3 md:top-3 md:max-h-none md:w-[440px] md:rounded-2xl"
      >
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              aria-label="Pedido anterior"
              title="Anterior (↑)"
              className="rounded-lg p-1.5 text-gray-400 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronUp size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              aria-label="Pedido siguiente"
              title="Siguiente (↓)"
              className="rounded-lg p-1.5 text-gray-400 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronDown size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href).then(() => {
                  setLinkCopied(true)
                  window.setTimeout(() => setLinkCopied(false), 1400)
                })
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {linkCopied ? <Check size={14} strokeWidth={2} className="text-emerald-600" /> : <Link2 size={14} strokeWidth={1.75} />}
              {linkCopied ? 'Copiado' : 'Copiar enlace'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              title="Cerrar (Esc)"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Encabezado */}
          <div key={order.id} className="nb-swap px-5 pb-5 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[13px] font-medium text-gray-500">
                {order.orderNumber != null ? `Pedido #${order.orderNumber}` : 'Pedido'}
              </span>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', st.badge)}>
                <span className={cn('size-1.5 rounded-full', st.dot)} aria-hidden />
                {st.label}
              </span>
            </div>
            <Money
              value={order.total}
              className={cn(
                'block text-[32px] font-semibold leading-none tracking-tight tabular-nums text-gray-900',
                order.status === 'cancelled' && 'text-gray-400 line-through decoration-2',
              )}
            />
            <p className="mt-2 text-[13px] text-gray-500">
              {order.customerName || 'Sin nombre'} · {fullDateTime(order.createdAt)}
            </p>

            {/* Línea de tiempo */}
            <ol className="mt-6">
              {timeline.map((ev, i) => {
                const last = i === timeline.length - 1
                return (
                  <li key={`${ev.title}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                    {!last && <span className="absolute left-[5px] top-4 h-[calc(100%-12px)] w-px bg-gray-200" aria-hidden />}
                    <span
                      className={cn(
                        'relative mt-1 size-[11px] shrink-0 rounded-full border-2',
                        ev.tone === 'done' && 'border-gray-900 bg-gray-900',
                        ev.tone === 'danger' && 'border-red-500 bg-red-500',
                        ev.tone === 'warn' && 'border-amber-400 bg-amber-400',
                        ev.tone === 'todo' && 'border-gray-300 bg-white',
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={cn('text-[13px] font-medium', ev.tone === 'todo' ? 'text-gray-400' : 'text-gray-900')}>{ev.title}</p>
                        {ev.at && <span className="shrink-0 text-[11px] tabular-nums text-gray-400">{fullDateTime(ev.at)}</span>}
                      </div>
                      {ev.detail && <p className="mt-0.5 text-[12px] text-gray-500">{ev.detail}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Productos */}
          <section className="border-t border-gray-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-gray-900">Productos</h3>
              {order.status !== 'cancelled' && (
                <span className="text-[11px] tabular-nums text-gray-400">
                  {scan.redeemed ?? '?'} de {scan.units} retiradas
                </span>
              )}
            </div>
            <ul className="flex flex-col gap-3">
              {order.items.map((item, i) => {
                const redeemed = item.redeemedQuantity ?? null
                const pct = redeemed != null ? Math.min((redeemed / Math.max(item.quantity, 1)) * 100, 100) : 0
                return (
                  <li key={`${item.productId}-${i}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] text-gray-900">
                          <span className="mr-1 font-semibold tabular-nums text-gray-400">{item.quantity}×</span>
                          {item.name}
                        </p>
                        {item.categoryName && <p className="text-[11px] text-gray-400">{item.categoryName}</p>}
                      </div>
                      <Money
                        value={item.subtotal ?? item.price * item.quantity}
                        className="shrink-0 text-[13px] tabular-nums text-gray-600"
                      />
                    </div>
                    {redeemed != null && order.status !== 'cancelled' && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={cn('h-full rounded-full transition-[width] duration-500', pct >= 100 ? 'bg-emerald-500' : 'bg-amber-400')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[11px] tabular-nums text-gray-400">
                          {redeemed}/{item.quantity}
                        </span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
              <span className="text-[13px] font-semibold text-gray-900">Total</span>
              <Money value={order.total} className="text-[15px] font-semibold tabular-nums text-gray-900" />
            </div>
          </section>

          {/* Cliente y pago */}
          <section className="border-t border-gray-100 px-5 py-3">
            <h3 className="mb-1 pt-1 text-[12px] font-semibold text-gray-900">Cliente</h3>
            <div className="divide-y divide-gray-100">
              {order.customerName && <CopyField label="Nombre" value={order.customerName} />}
              {order.customerEmail && <CopyField label="Email" value={order.customerEmail} />}
              {order.customerPhone && <CopyField label="Teléfono" value={order.customerPhone} />}
              {order.paymentMethod && (
                <div className="py-2">
                  <p className="text-[11px] text-gray-400">Método de pago</p>
                  <p className="flex items-center gap-2 text-[13px] text-gray-900">
                    {payColor && <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: payColor }} aria-hidden />}
                    {PAY_LABEL[order.paymentMethod] ?? order.paymentMethod}
                  </p>
                </div>
              )}
              {!order.customerName && !order.customerEmail && !order.customerPhone && (
                <p className="py-2 text-[13px] text-gray-400">El comprador no dejó datos de contacto.</p>
              )}
            </div>
          </section>

          {/* Cancelación en dos pasos */}
          {canCancel && (
            <section className="border-t border-gray-100 px-5 py-4">
              {cancelError && <p className="mb-2 text-[12px] text-red-600">{cancelError}</p>}
              {cancelStage === 'none' && (
                <button
                  type="button"
                  onClick={() => {
                    setCancelError('')
                    setCancelStage('first')
                  }}
                  className="text-[13px] font-medium text-red-600 transition-colors hover:text-red-700"
                >
                  Cancelar pedido…
                </button>
              )}
              {cancelStage !== 'none' && (
                <div className="nb-pop rounded-xl border border-red-100 bg-red-50/70 p-3.5">
                  <p className="text-[13px] font-semibold text-red-800">
                    {cancelStage === 'first' ? '¿Cancelar este pedido?' : 'Confirmá una vez más'}
                  </p>
                  <p className="mt-1 text-[12px] text-red-700/80">
                    {cancelStage === 'first'
                      ? 'El QR dejará de ser válido y no se podrá usar para retirar productos.'
                      : 'Es permanente y no se puede deshacer. El pedido quedará marcado como cancelado.'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelStage('none')}
                      disabled={cancelling}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => (cancelStage === 'first' ? setCancelStage('second') : void confirmCancel())}
                      disabled={cancelling}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-70"
                    >
                      {cancelStage === 'first' ? 'Sí, cancelar' : cancelling ? 'Cancelando…' : 'Sí, cancelar definitivamente'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </>
  )
}
