'use client'

import { ExternalLink, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Money } from '@/components/organizer/dashboard/AnimatedNumber'
import { PAY_LABEL, fullDateTime, itemsSummary, statusUi } from '@/components/organizer/orders/orderUi'
import { OrganizerBackLink } from '@/components/organizer/OrganizerBackLink'
import { RegretStatusBadge } from '@/components/organizer/RegretsView'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import {
  fetchRegret,
  patchOrderStatus,
  patchRegretStatus,
  type WorkspaceRegret,
} from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="mt-0.5 break-words text-[14px] text-gray-900">{value}</dd>
    </div>
  )
}

/** Detalle de un arrepentimiento: datos del comprador, captura y pedidos asociados a su e-mail. */
export function RegretDetailView({ eventId, regretId }: { eventId: string; regretId: string }) {
  const listPath = `/events/${eventId}/arrepentimientos`
  const { show, ToastPortal } = useToast()
  const [regret, setRegret] = useState<WorkspaceRegret | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toCancel, setToCancel] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetchRegret(eventId, regretId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRegret(res.regret)
      setOrders(res.orders)
    } catch {
      setError('No se pudo cargar la solicitud')
    } finally {
      setLoading(false)
    }
  }, [eventId, regretId])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(id)
  }, [load])

  const confirmCancel = async () => {
    if (!toCancel) return
    setCancelling(true)
    setCancelError('')
    try {
      const res = await patchOrderStatus(eventId, toCancel.id, 'cancelled')
      if (!res.ok) {
        setCancelError(res.error)
        return
      }
      setOrders(prev => prev.map(o => (o.id === res.order.id ? res.order : o)))
      show(`QR del pedido #${toCancel.orderNumber ?? '—'} cancelado`, 'success')
      setToCancel(null)
    } catch {
      setCancelError('No se pudo cancelar el QR')
    } finally {
      setCancelling(false)
    }
  }

  const toggleResolved = async () => {
    if (!regret) return
    setUpdatingStatus(true)
    try {
      const res = await patchRegretStatus(eventId, regret.id, regret.status === 'pending' ? 'resolved' : 'pending')
      if (!res.ok) {
        show(res.error, 'error')
        return
      }
      setRegret(prev => (prev ? { ...prev, status: res.regret.status } : prev))
    } catch {
      show('No se pudo actualizar el estado', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <OrganizerBackLink href={listPath} label="Volver a arrepentimientos" className="mb-5" />

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      ) : error || !regret ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error || 'Solicitud no encontrada'}
        </p>
      ) : (
        <>
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">{regret.fullName}</h1>
                <RegretStatusBadge status={regret.status} />
              </div>
              <p className="mt-1 text-[13px] text-gray-500">Enviado el {fullDateTime(regret.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => void toggleResolved()}
              disabled={updatingStatus}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {regret.status === 'pending' ? 'Marcar como gestionado' : 'Volver a pendiente'}
            </button>
          </header>

          <section className="mb-6 grid gap-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:grid-cols-[1fr_200px]">
            <dl className="grid content-start gap-4 sm:grid-cols-2">
              <Field label="E-mail" value={regret.email} />
              <Field label="WhatsApp" value={regret.whatsapp} />
              <Field label="Alias o datos bancarios" value={regret.bankAlias} />
              <div className="sm:col-span-2">
                <Field label="Detalle de compra" value={regret.purchaseDetail} />
              </div>
            </dl>
            <a
              href={regret.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block self-start overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
              title="Abrir el screenshot en una pestaña nueva"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL remota de Storage */}
              <img src={regret.screenshotUrl} alt="Screenshot de confirmación de compra" className="max-h-[260px] w-full object-cover object-top" />
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 shadow-sm">
                <ExternalLink size={11} aria-hidden /> Ampliar
              </span>
            </a>
          </section>

          <section>
            <h2 className="mb-1 text-[15px] font-semibold text-gray-900">Pedidos asociados</h2>
            <p className="mb-3 text-[13px] text-gray-500">
              Pedidos de este evento hechos con <span className="font-medium text-gray-700">{regret.email}</span>.
            </p>

            {orders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center text-[13px] text-gray-500">
                No encontramos pedidos con ese e-mail. Revisá el detalle y el screenshot, o buscalo en Pedidos por nombre.
              </p>
            ) : (
              <ul className="space-y-2">
                {orders.map(o => {
                  const st = statusUi(o.status)
                  const canCancel = o.status !== 'cancelled' && o.status !== 'delivered'
                  return (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                    >
                      <div className="min-w-0 flex-1 basis-56">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-gray-900">
                            Pedido #{o.orderNumber ?? '—'}
                          </span>
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', st.badge)}>
                            <span className={cn('size-1.5 rounded-full', st.dot)} aria-hidden />
                            {st.label}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-gray-500" title={itemsSummary(o)}>
                          {itemsSummary(o)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-gray-400">
                          {fullDateTime(o.createdAt)}
                          {o.paymentMethod ? ` · ${PAY_LABEL[o.paymentMethod] ?? o.paymentMethod}` : ''}
                        </p>
                      </div>
                      <Money value={o.total} className="text-[15px] font-semibold tabular-nums text-gray-900" />
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelError('')
                            setToCancel(o)
                          }}
                          className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Cancelar QR
                        </button>
                      ) : (
                        <span className="text-[12px] text-gray-400">
                          {o.status === 'cancelled' ? 'QR cancelado' : 'Ya entregado'}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <Modal isOpen={toCancel !== null} onClose={() => !cancelling && setToCancel(null)} title="¿Cancelar el QR de este pedido?">
        {toCancel && (
          <>
            <p className="text-[14px] text-gray-600">
              Pedido #{toCancel.orderNumber ?? '—'} de {toCancel.customerName ?? regret?.fullName}. El QR dejará de
              ser válido y el comprador recibirá un aviso por e-mail. No se puede deshacer.
            </p>
            <div
              role="note"
              className="mt-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900"
            >
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
              <p>
                <span className="font-semibold">Esto solo cancela el QR y no devuelve el pago.</span> El reembolso
                lo tenés que gestionar vos como organizador del evento.
              </p>
            </div>
            {cancelError && <p role="alert" className="mt-3 text-[13px] text-red-600">{cancelError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setToCancel(null)}
                disabled={cancelling}
                className="rounded-xl px-4 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => void confirmCancel()}
                disabled={cancelling}
                className="rounded-xl bg-red-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? 'Cancelando…' : 'Sí, cancelar QR'}
              </button>
            </div>
          </>
        )}
      </Modal>
      <ToastPortal />
    </div>
  )
}
