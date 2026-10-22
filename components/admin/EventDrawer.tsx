'use client'

import { ExternalLink, ListOrdered, PauseCircle, PlayCircle } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { AreaChart, BarList } from './charts'
import { fmtDateTime, fmtInt, fmtMoneyCompact, plural } from './format'
import { EVENT_STATUS_LABEL, ORDER_STATUS_LABEL, providerColor, providerLabel } from './theme'
import { Btn, Drawer, ErrorNote, Pill, Skeleton, useAsync, useToast } from './ui'
import { fetchPlatformEventDetail, setEventSalesActive } from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
      {sub && <p className="text-[11px] text-white/35">{sub}</p>}
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/35">{title}</h3>
      {children}
    </section>
  )
}

export function EventDrawer({
  eventId,
  onClose,
  onViewOrders,
  onChanged,
}: {
  eventId: string | null
  onClose: () => void
  onViewOrders: (eventId: string) => void
  onChanged?: () => void
}) {
  const toast = useToast()
  const load = useCallback(
    () => (eventId ? fetchPlatformEventDetail(eventId) : Promise.resolve({ ok: false as const, error: '' })),
    [eventId],
  )
  const { data, error, loading, reload } = useAsync(load, [load])
  const d = data && data.event.id === eventId ? data : null

  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const points = useMemo(() => (d?.series ?? []).map((p) => ({ date: p.date, value: p.revenue })), [d])

  async function toggleSales() {
    if (!d) return
    setBusy(true)
    const r = await setEventSalesActive(d.event.id, !d.event.is_active)
    setBusy(false)
    setConfirming(false)
    if (r.ok) {
      toast('success', r.data.is_active ? 'Ventas reactivadas' : 'Ventas pausadas (puede demorar hasta 30 s en cortarse)')
      reload()
      onChanged?.()
    } else {
      toast('error', r.error)
    }
  }

  const active = d?.event.is_active ?? true
  const methods: string[] = d
    ? [
        d.event.has_mp ? 'Mercado Pago' : '',
        d.event.has_sipago ? 'Sipago' : '',
        d.event.cash_enabled ? 'Efectivo' : '',
      ].filter(Boolean)
    : []

  return (
    <>
      <Drawer
        open={!!eventId}
        onClose={onClose}
        title={d?.event.name ?? 'Evento'}
        subtitle={d ? `${d.event.tenant_subdomain ?? 'sin tenant'} · /${d.event.slug}` : undefined}
        footer={
          d && (
            <div className="flex flex-wrap items-center gap-2">
              <Btn onClick={() => onViewOrders(d.event.id)}>
                <ListOrdered size={14} /> Ver órdenes
              </Btn>
              <Btn
                variant={active ? 'danger' : 'primary'}
                className="ml-auto"
                disabled={busy}
                onClick={() => (active ? setConfirming(true) : toggleSales())}
              >
                {active ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                {active ? 'Pausar ventas' : 'Reactivar ventas'}
              </Btn>
            </div>
          )
        }
      >
        {error && !d ? (
          <ErrorNote message={error} onRetry={reload} />
        ) : !d ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-28" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className={loading ? 'space-y-6 opacity-70 transition-opacity' : 'space-y-6 transition-opacity'}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={d.event.status === 'active' ? 'good' : 'neutral'}>{EVENT_STATUS_LABEL[d.event.status] ?? d.event.status}</Pill>
              <Pill tone={active ? 'good' : 'critical'}>{active ? 'Ventas abiertas' : 'Ventas pausadas'}</Pill>
              <span className="text-xs text-white/40">
                {d.event.starts_at ? `Inicia ${fmtDateTime(d.event.starts_at)}` : 'Sin fecha de inicio'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Facturado" value={formatPrice(d.stats.revenue)} sub={`${formatPrice(d.stats.commission)} de comisión`} />
              <Stat label="Órdenes pagas" value={fmtInt(d.stats.paid_orders)} sub={`${fmtInt(d.stats.orders_created)} creadas`} />
              <Stat label="Ticket promedio" value={formatPrice(d.stats.avg_ticket)} />
              <Stat
                label="Unidades retiradas"
                value={`${fmtInt(d.stats.units_redeemed)} / ${fmtInt(d.stats.units_sold)}`}
                sub={`${d.stats.redemption_rate.toLocaleString('es-AR')}% retirado`}
              />
            </div>

            <Block title="Facturación por día">
              {points.length === 0 ? (
                <p className="text-sm text-white/40">Sin ventas todavía.</p>
              ) : (
                <AreaChart points={points} seriesName="Facturación" format={(n) => formatPrice(n)} axisFormat={fmtMoneyCompact} height={200} />
              )}
            </Block>

            <Block title="Productos más vendidos">
              <BarList
                emptyLabel="Sin ventas todavía"
                format={(n) => `${fmtInt(n)} u.`}
                rows={d.top_products.map((p) => ({
                  key: p.name,
                  label: p.name,
                  value: p.quantity,
                  sub: formatPrice(p.revenue),
                }))}
              />
            </Block>

            <Block title="Medios de pago">
              <BarList
                emptyLabel="Sin ventas todavía"
                format={(n) => formatPrice(n)}
                rows={d.payment_methods.map((m) => ({
                  key: m.provider,
                  label: providerLabel(m.provider),
                  value: m.revenue,
                  color: providerColor(m.provider),
                  sub: plural(m.orders, 'orden', 'órdenes'),
                }))}
              />
            </Block>

            <Block title="Órdenes por estado">
              {Object.keys(d.status_counts).length === 0 && <p className="text-sm text-white/40">Sin órdenes todavía.</p>}
              <div className="flex flex-wrap gap-2">
                {Object.entries(d.status_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([st, n]) => (
                    <span key={st} className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/70">
                      {ORDER_STATUS_LABEL[st] ?? st} <b className="ml-1 tabular-nums text-white">{fmtInt(n)}</b>
                    </span>
                  ))}
              </div>
            </Block>

            <Block title="Configuración">
              <dl className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 text-sm">
                {[
                  ['Organizador', d.event.organizer ? `${d.event.organizer.name} · ${d.event.organizer.email}` : '—'],
                  ['Medios de pago', methods.length ? methods.join(', ') : 'Ninguno configurado'],
                  ['Productos', fmtInt(d.stats.product_count)],
                  ['Staff', fmtInt(d.stats.staff_count)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2">
                    <dt className="text-white/45">{k}</dt>
                    <dd className="break-words text-right text-white/90">{v}</dd>
                  </div>
                ))}
              </dl>
              {!methods.length && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-300">
                  <ExternalLink size={12} /> Sin medios de pago: los compradores no pueden pagar este evento.
                </p>
              )}
            </Block>
          </div>
        )}
      </Drawer>

      {confirming && d && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirming(false)} aria-hidden />
          <div role="alertdialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#14141D] p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Pausar ventas de “{d.event.name}”</h3>
            <p className="mt-2 text-sm text-white/60">
              El catálogo deja de estar disponible y no se pueden crear órdenes nuevas. Las órdenes ya pagadas y sus QR siguen
              funcionando. El corte total puede tardar hasta 30 segundos.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setConfirming(false)} disabled={busy}>
                Volver
              </Btn>
              <Btn variant="danger" onClick={toggleSales} disabled={busy}>
                {busy ? 'Pausando…' : 'Pausar ventas'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
