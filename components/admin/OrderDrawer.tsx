'use client'

import { Ban, BadgeCheck, Mail } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'

import { fmtDateTime } from './format'
import { providerLabel } from './theme'
import {
  Btn,
  Drawer,
  ErrorNote,
  OrderStatusPill,
  PaymentStatusPill,
  Pill,
  ReasonDialog,
  Skeleton,
  useAsync,
  useToast,
} from './ui'
import {
  cancelOrderAsAdmin,
  fetchPlatformOrderDetail,
  markOrderPaidAsAdmin,
  resendOrderConfirmation,
} from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium text-white/50">{title}</h3>
      {children}
    </section>
  )
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="flex-shrink-0 text-white/60">{k}</dt>
      <dd className="min-w-0 break-words text-right text-white/90">{v || '—'}</dd>
    </div>
  )
}

type Pending = 'cancel' | 'paid' | null

export function OrderDrawer({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: string | null
  onClose: () => void
  onChanged?: () => void
}) {
  const toast = useToast()
  const load = useCallback(
    () =>
      orderId
        ? fetchPlatformOrderDetail(orderId)
        : Promise.resolve({ ok: false as const, error: '' }),
    [orderId],
  )
  const { data, error, loading, reload } = useAsync(load, [load])
  const order = data?.order && data.order.id === orderId ? data.order : null

  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg: string) {
    setBusy(true)
    const r = await fn()
    setBusy(false)
    setPending(null)
    if (r.ok) {
      toast('success', okMsg)
      reload()
      onChanged?.()
    } else {
      toast('error', r.error)
    }
  }

  const canResend = !!order && order.payment_status === 'approved' && order.status_raw !== 'cancelled' && !!order.customer_email
  const canMarkPaid = !!order && order.payment_status !== 'approved' && !['cancelled', 'delivered'].includes(order.status_raw)
  const canCancel = !!order && !['cancelled', 'delivered'].includes(order.status_raw)

  return (
    <>
      <Drawer
        open={!!orderId}
        onClose={onClose}
        title={order ? `Orden #${order.order_number ?? '—'}` : 'Orden'}
        subtitle={order ? <span className="font-mono">{order.id}</span> : undefined}
        footer={
          order && (canResend || canMarkPaid || canCancel) ? (
            <div className="flex flex-wrap items-center gap-2">
              {canResend && (
                <Btn
                  disabled={busy}
                  onClick={() => run(() => resendOrderConfirmation(order.id), `Confirmación enviada a ${order.customer_email}`)}
                >
                  <Mail size={14} /> Reenviar mail con QR
                </Btn>
              )}
              {canMarkPaid && (
                <Btn variant="subtle" disabled={busy} onClick={() => setPending('paid')}>
                  <BadgeCheck size={14} /> Marcar como pagada
                </Btn>
              )}
              {canCancel && (
                <Btn variant="danger" className="ml-auto" disabled={busy} onClick={() => setPending('cancel')}>
                  <Ban size={14} /> Cancelar orden
                </Btn>
              )}
            </div>
          ) : undefined
        }
      >
        {error && !order ? (
          <ErrorNote message={error} onRetry={reload} />
        ) : !order ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className={loading ? 'space-y-6 opacity-70 transition-opacity' : 'space-y-6 transition-opacity'}>
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusPill status={order.status_raw} />
              <PaymentStatusPill status={order.payment_status} />
              {order.is_test && <Pill tone="warning">Test</Pill>}
              <span className="ml-auto text-2xl font-semibold tabular-nums text-white">
                {formatPrice(order.total_amount, order.currency)}
              </span>
            </div>

            <Block title="Comprador y evento">
              <dl className="divide-y divide-white/[0.05] rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-1">
                <Row k="Nombre" v={order.customer_name} />
                <Row k="Email" v={order.customer_email} />
                <Row k="Teléfono" v={order.customer_phone} />
                <Row k="Evento" v={order.event_name} />
                <Row k="Tenant" v={order.tenant_subdomain} />
                <Row k="Creada" v={fmtDateTime(order.created_at)} />
                {order.delivered_at && <Row k="Retirada" v={fmtDateTime(order.delivered_at)} />}
                {order.cancelled_at && <Row k="Cancelada" v={fmtDateTime(order.cancelled_at)} />}
                {order.notes && <Row k="Notas" v={order.notes} />}
              </dl>
            </Block>

            <Block title={`Productos (${order.items.length})`}>
              <ul className="divide-y divide-white/[0.05] rounded-lg border border-white/[0.07] bg-white/[0.02]">
                {order.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-white/90">
                        {it.quantity} × {it.name}
                      </p>
                      <p className="text-xs text-white/55">
                        Retirados {it.redeemed_quantity}/{it.quantity} · {formatPrice(it.unit_price, order.currency)} c/u
                      </p>
                    </div>
                    <span className="flex-shrink-0 tabular-nums text-white/90">{formatPrice(it.subtotal, order.currency)}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Pagos">
              {order.payments.length === 0 ? (
                <p className="text-sm text-white/55">Sin pagos registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {order.payments.map((p, i) => (
                    <li key={i} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white/90">{providerLabel(p.provider)}</span>
                        <PaymentStatusPill status={p.status} />
                      </div>
                      <p className="mt-1 text-xs text-white/60">
                        {formatPrice(p.amount, order.currency)}
                        {p.paid_at ? ` · pagado ${fmtDateTime(p.paid_at)}` : ` · creado ${fmtDateTime(p.created_at)}`}
                      </p>
                      {p.provider_payment_id && (
                        <p className="mt-0.5 font-mono text-[11px] text-white/50 break-all">ID {p.provider_payment_id}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            <Block title="Historial">
              <ol className="relative space-y-3 border-l border-white/10 pl-4">
                {order.history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-white/30 ring-4 ring-admin-surface" />
                    <p className="text-sm text-white/85">
                      {h.from_status && h.from_status !== h.to_status ? `${h.from_status} → ` : ''}
                      <b>{h.to_status}</b>
                    </p>
                    <p className="text-xs text-white/55">
                      {fmtDateTime(h.created_at)}
                      {h.by ? ` · ${h.by}` : ''}
                    </p>
                    {h.note && <p className="mt-0.5 break-words text-xs text-white/55">{h.note}</p>}
                  </li>
                ))}
                {order.history.length === 0 && <li className="text-sm text-white/55">Sin historial.</li>}
              </ol>
            </Block>

            {order.qr_logs.length > 0 && (
              <Block title="Escaneos de QR">
                <ul className="space-y-1.5">
                  {order.qr_logs.map((l, i) => (
                    <li key={i} className="flex justify-between gap-3 text-sm">
                      <span className="text-white/75">
                        {l.result}
                        {l.message ? <span className="text-white/55"> · {l.message}</span> : null}
                      </span>
                      <span className="flex-shrink-0 text-xs text-white/55">{fmtDateTime(l.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </div>
        )}
      </Drawer>

      <ReasonDialog
        open={pending === 'cancel'}
        title="Cancelar orden"
        confirmLabel="Cancelar orden"
        minLength={3}
        busy={busy}
        onCancel={() => setPending(null)}
        description={
          <>
            Se invalida el QR y se avisa al comprador por mail.{' '}
            <b className="text-white/80">No devuelve el dinero</b>: el reembolso se hace desde el proveedor de pago.
          </>
        }
        onConfirm={(reason) => order && run(() => cancelOrderAsAdmin(order.id, reason), 'Orden cancelada')}
      />
      <ReasonDialog
        open={pending === 'paid'}
        title="Marcar como pagada"
        confirmLabel="Confirmar pago"
        tone="primary"
        minLength={8}
        busy={busy}
        onCancel={() => setPending(null)}
        description={
          <>
            Aprueba el último pago <b className="text-white/80">sin consultar al proveedor</b> y envía el mail con el QR.
            Usalo solo si ya verificaste el cobro (por ejemplo, un webhook perdido).
          </>
        }
        onConfirm={(reason) => order && run(() => markOrderPaidAsAdmin(order.id, reason), 'Orden marcada como pagada')}
      />
    </>
  )
}
