'use client'

import { ArrowLeft, Download, PauseCircle, PlayCircle, Search } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { AreaChart, BarList, SeriesTable } from './charts'
import { fmtDateTime, fmtDay, fmtInt, fmtMoneyCompact, isoDate, plural } from './format'
import { EVENT_STATUS_LABEL, providerColor, providerLabel } from './theme'
import {
  Btn,
  Card,
  EmptyState,
  ErrorNote,
  OrderStatusPill,
  PaymentStatusPill,
  Pager,
  Pill,
  Segmented,
  Skeleton,
  Table,
  Td,
  Th,
  cx,
  inputAutoCls,
  inputCls,
  useAsync,
  useDebounced,
  usePageForKey,
  useToast,
} from './ui'
import {
  downloadOrdersCsv,
  fetchPlatformEventDetail,
  fetchPlatformOrdersFiltered,
  setEventSalesActive,
  setEventServiceFeeEnabled,
  type AdminEventDetail,
  type DateRangeParams,
  type OrderFilters,
  type OrderGroup,
} from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

const PAGE_SIZE = 20

type Preset = 'all' | '1' | '7' | '30' | 'custom'
type Metric = 'revenue' | 'commission' | 'service_fee' | 'paid_orders'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: '1', label: 'Hoy' },
  { value: '7', label: '7 días' },
  { value: '30', label: '30 días' },
  { value: 'custom', label: 'Rango' },
]

const METRICS: Record<Metric, { label: string; money: boolean }> = {
  revenue: { label: 'Facturación', money: true },
  commission: { label: 'Comisión', money: true },
  service_fee: { label: 'Costo de servicio', money: true },
  paid_orders: { label: 'Órdenes pagas', money: false },
}

const GROUPS: { key: 'all' | OrderGroup; label: string; hint: string }[] = [
  { key: 'all', label: 'Todas', hint: 'Todas las órdenes del período' },
  { key: 'paid', label: 'Pagas', hint: 'Pago aprobado' },
  { key: 'pending', label: 'Pendientes', hint: 'Esperando pago o en cola' },
  { key: 'redeemed', label: 'Retiradas', hint: 'Retiro total o parcial' },
  { key: 'cancelled', label: 'Canceladas', hint: 'Canceladas' },
  { key: 'failed', label: 'Fallidas', hint: 'Falló el procesamiento' },
]

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] px-5 py-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-white/35">{sub}</p>}
    </div>
  )
}

function rangeLabel(d: AdminEventDetail): string {
  return d.range ? `${fmtDay(d.range.from)} – ${fmtDay(d.range.to)}` : 'todo el historial'
}

export function EventPanel({
  eventId,
  refreshKey,
  onBack,
  onOpenOrder,
  onChanged,
}: {
  eventId: string
  refreshKey: number
  onBack: () => void
  onOpenOrder: (orderId: string) => void
  onChanged?: () => void
}) {
  const toast = useToast()

  // --- período ---
  const [preset, setPreset] = useState<Preset>('all')
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 6 * 86400000)))
  const [to, setTo] = useState(() => isoDate(new Date()))
  const range: DateRangeParams = useMemo(
    () => (preset === 'all' ? {} : preset === 'custom' ? { from, to } : { days: Number(preset) }),
    [preset, from, to],
  )

  const loadDetail = useCallback(() => fetchPlatformEventDetail(eventId, range), [eventId, range])
  const { data, error, loading, reload } = useAsync(loadDetail, [loadDetail, refreshKey])
  const d = data && data.event.id === eventId ? data : null

  // --- órdenes ---
  const [group, setGroup] = useState<'all' | OrderGroup>('all')
  const [q, setQ] = useState('')
  const dq = useDebounced(q, 300)
  const filters: OrderFilters = {
    event_id: eventId,
    group: group === 'all' ? undefined : group,
    q: dq.trim() || undefined,
    ...range,
  }
  const key = JSON.stringify(filters)
  const [page, setPage] = usePageForKey(key)
  const loadOrders = useCallback(() => fetchPlatformOrdersFiltered(page, PAGE_SIZE, filters), [page, key]) // eslint-disable-line react-hooks/exhaustive-deps
  const orders = useAsync(loadOrders, [loadOrders, refreshKey])

  // --- gráfico ---
  const [metric, setMetric] = useState<Metric>('revenue')
  const [asTable, setAsTable] = useState(false)
  const points = useMemo(() => (d?.series ?? []).map((p) => ({ date: p.date, value: p[metric] })), [d, metric])
  const money = METRICS[metric].money
  const fmt = money ? (n: number) => formatPrice(n) : (n: number) => fmtInt(n)
  const axis = money ? fmtMoneyCompact : (n: number) => fmtInt(n)

  // --- pausar ventas ---
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
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

  // --- modo de cobro (comisión 1% vs costo de servicio al comprador) ---
  const [feeBusy, setFeeBusy] = useState(false)
  async function toggleServiceFee() {
    if (!d) return
    const next = !d.event.service_fee_enabled
    setFeeBusy(true)
    const r = await setEventServiceFeeEnabled(d.event.id, next)
    setFeeBusy(false)
    if (r.ok) {
      toast(
        'success',
        next
          ? 'Costo de servicio activado: aplica a las compras nuevas (puede demorar hasta 30 s)'
          : 'Costo de servicio desactivado: vuelve la comisión del 1% (puede demorar hasta 30 s)',
      )
      reload()
      onChanged?.()
    } else {
      toast('error', r.error)
    }
  }

  const [exporting, setExporting] = useState(false)
  async function exportCsv() {
    setExporting(true)
    const r = await downloadOrdersCsv(filters)
    setExporting(false)
    if (!r.ok) toast('error', r.error)
  }

  const active = d?.event.is_active ?? true
  const methods = d
    ? [d.event.has_mp && 'Mercado Pago', d.event.has_sipago && 'Sipago', d.event.cash_enabled && 'Efectivo'].filter(Boolean)
    : []
  const orderList = orders.data?.orders ?? []

  return (
    <div className="space-y-6">
      <div>
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
          <ArrowLeft size={15} /> Volver a eventos
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-white">{d?.event.name ?? 'Cargando evento…'}</h2>
            {d && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-white/45">
                  {d.event.tenant_subdomain ?? 'sin tenant'} · /{d.event.slug}
                </span>
                <Pill tone={d.event.status === 'active' ? 'good' : 'neutral'}>{EVENT_STATUS_LABEL[d.event.status] ?? d.event.status}</Pill>
                <Pill tone={active ? 'good' : 'critical'}>{active ? 'Ventas abiertas' : 'Ventas pausadas'}</Pill>
                <span className="text-xs text-white/40">{d.event.starts_at ? `Inicia ${fmtDateTime(d.event.starts_at)}` : 'Sin fecha de inicio'}</span>
              </div>
            )}
          </div>
          {d && (
            <Btn variant={active ? 'danger' : 'primary'} disabled={busy} onClick={() => (active ? setConfirming(true) : toggleSales())}>
              {active ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
              {active ? 'Pausar ventas' : 'Reactivar ventas'}
            </Btn>
          )}
        </div>
      </div>

      {d && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#12121A] px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">Costo de servicio al comprador</p>
            <p className="mt-0.5 text-xs text-white/45">
              {d.event.service_fee_enabled
                ? 'Activado: el comprador paga 5% en tickets y 2% en productos, para Nubapay. No se cobra la comisión del 1% al organizador.'
                : 'Desactivado: el comprador no paga extra y le cobrás el 1% de comisión al organizador sobre lo que factura.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={d.event.service_fee_enabled}
            aria-label="Costo de servicio al comprador"
            disabled={feeBusy}
            onClick={toggleServiceFee}
            className={cx(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
              d.event.service_fee_enabled ? 'bg-[#C6FF00]' : 'bg-white/15',
            )}
          >
            <span
              className={cx(
                'absolute top-0.5 h-5 w-5 rounded-full bg-[#0A0A0F] shadow transition-[left]',
                d.event.service_fee_enabled ? 'left-[22px]' : 'left-0.5',
              )}
            />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Período" value={preset} onChange={setPreset} options={PRESETS} />
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="Desde" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={cx(inputAutoCls, 'py-1.5')} />
            <span className="text-xs text-white/35">a</span>
            <input aria-label="Hasta" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={cx(inputAutoCls, 'py-1.5')} />
          </div>
        )}
        {d && <span className="text-xs text-white/35">Mostrando {rangeLabel(d)} · hora Argentina</span>}
      </div>

      {error && !d && <ErrorNote message={error} onRetry={reload} />}

      {!d ? (
        !error && (
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-72" />
          </div>
        )
      ) : (
        <div className={cx('space-y-6 transition-opacity', loading && 'opacity-60')}>
          {/* Comisión + KPIs */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#C6FF00]/25 bg-gradient-to-br from-[#C6FF00]/[0.09] to-transparent p-5 lg:row-span-1">
              <p className="text-xs font-medium text-[#C6FF00]/80">
                {d.commission.mode === 'service_fee' ? 'Tu costo de servicio a cobrar' : 'Tu comisión a cobrar'}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-[#C6FF00]">{formatPrice(d.commission.platform_income_in_range)}</p>
              <p className="mt-1 text-xs text-white/50">
                {d.commission.mode === 'service_fee'
                  ? `Costo de servicio pagado por los compradores en ${rangeLabel(d)}`
                  : `${(d.commission.rate * 100).toLocaleString('es-AR')}% sobre ${formatPrice(d.stats.revenue)} facturados en ${rangeLabel(d)}`}
              </p>
              <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Comisión {(d.commission.rate * 100).toLocaleString('es-AR')}%</dt>
                  <dd className="font-semibold tabular-nums text-white">{formatPrice(d.commission.in_range)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Costo de servicio</dt>
                  <dd className="font-semibold tabular-nums text-white">{formatPrice(d.commission.service_fee_in_range)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Histórico del evento</dt>
                  <dd className="font-semibold tabular-nums text-white">{formatPrice(d.commission.platform_income_all_time)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] leading-snug text-white/30">
                Es lo generado, que te corresponde a vos. No hay registro de pagos ya recibidos, así que no se descuenta lo que ya cobraste.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              <Stat label="Facturado" value={formatPrice(d.stats.revenue)} sub={`${formatPrice(d.commission.all_time_revenue)} histórico`} />
              <Stat label="Órdenes pagas" value={fmtInt(d.stats.paid_orders)} sub={`${fmtInt(d.stats.orders_created)} creadas`} />
              <Stat label="Ticket promedio" value={formatPrice(d.stats.avg_ticket)} />
              <Stat
                label="Unidades retiradas"
                value={`${fmtInt(d.stats.units_redeemed)} / ${fmtInt(d.stats.units_sold)}`}
                sub={`${d.stats.redemption_rate.toLocaleString('es-AR')}% retirado`}
              />
            </div>
          </div>

          {/* Gráfico */}
          <Card
            title={`${METRICS[metric].label} por día`}
            subtitle={rangeLabel(d)}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  label="Métrica"
                  value={metric}
                  onChange={setMetric}
                  options={(Object.keys(METRICS) as Metric[]).map((k) => ({ value: k, label: METRICS[k].label }))}
                />
                <Btn size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
                  {asTable ? 'Gráfico' : 'Tabla'}
                </Btn>
              </div>
            }
          >
            {points.length === 0 ? (
              <EmptyState title="Sin ventas en el período" />
            ) : asTable ? (
              <SeriesTable points={points} format={fmt} label={METRICS[metric].label} />
            ) : (
              <AreaChart points={points} seriesName={METRICS[metric].label} format={fmt} axisFormat={axis} loading={loading} />
            )}
          </Card>

          {/* Órdenes */}
          <Card
            title="Órdenes del evento"
            subtitle={`${plural(d.groups.all.count, 'orden', 'órdenes')} en ${rangeLabel(d)}`}
            action={
              <Btn size="sm" onClick={exportCsv} disabled={exporting || !orderList.length}>
                <Download size={13} />
                {exporting ? 'Exportando…' : 'Exportar CSV'}
              </Btn>
            }
            flush
          >
            <div className="flex gap-2 overflow-x-auto px-5 pb-3" role="tablist" aria-label="Estado de las órdenes">
              {GROUPS.map((g) => {
                const stat = d.groups[g.key]
                const on = group === g.key
                return (
                  <button
                    key={g.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    title={g.hint}
                    onClick={() => setGroup(g.key)}
                    className={cx(
                      'flex-shrink-0 rounded-xl border px-3.5 py-2 text-left transition-colors',
                      on ? 'border-[#C6FF00]/50 bg-[#C6FF00]/[0.07]' : 'border-white/[0.08] hover:bg-white/[0.04]',
                    )}
                  >
                    <span className={cx('block text-xs', on ? 'text-[#C6FF00]' : 'text-white/50')}>{g.label}</span>
                    <span className="block text-lg font-semibold tabular-nums leading-tight text-white">{fmtInt(stat.count)}</span>
                    <span className="block text-[11px] tabular-nums text-white/35">{fmtMoneyCompact(stat.amount)}</span>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-3">
              <div className="relative max-w-sm">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  aria-label="Buscar en las órdenes del evento"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Email, nombre, # de orden…"
                  className={cx(inputCls, 'py-1.5 pl-9')}
                />
              </div>
            </div>

            {orders.error ? (
              <div className="px-5 pb-5">
                <ErrorNote message={orders.error} onRetry={orders.reload} />
              </div>
            ) : !orders.data && orders.loading ? (
              <div className="space-y-2 px-5 pb-5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : orderList.length === 0 ? (
              <EmptyState title="Sin órdenes" hint="Probá con otro estado, período o búsqueda." />
            ) : (
              <div className={cx('transition-opacity', orders.loading && 'opacity-60')}>
                <Table min={760}>
                  <thead className="border-y border-white/[0.06]">
                    <tr>
                      <Th>#</Th>
                      <Th>Cliente</Th>
                      <Th>Estado</Th>
                      <Th>Pago</Th>
                      <Th align="right">Total</Th>
                      <Th>Creada</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {orderList.map((o) => (
                      <tr
                        key={o.id}
                        tabIndex={0}
                        onClick={() => onOpenOrder(o.id)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpenOrder(o.id))}
                        className="cursor-pointer transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                      >
                        <Td>
                          <span className="font-medium text-white">{o.order_number ?? '—'}</span>
                        </Td>
                        <Td className="max-w-[260px]">
                          <p className="truncate">{o.customer_name ?? '—'}</p>
                          <p className="truncate text-xs text-white/40">{o.customer_email ?? ''}</p>
                        </Td>
                        <Td>
                          <OrderStatusPill status={o.status_raw} />
                        </Td>
                        <Td>
                          <PaymentStatusPill status={o.payment_status} />
                        </Td>
                        <Td align="right">{formatPrice(o.total_amount, o.currency)}</Td>
                        <Td muted className="whitespace-nowrap">
                          {fmtDateTime(o.created_at)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {orders.data?.pagination && <Pager page={page} total={orders.data.pagination.total} pageSize={PAGE_SIZE} onPage={setPage} />}
              </div>
            )}
          </Card>

          {/* Detalle */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Productos más vendidos" subtitle="Unidades con pago aprobado">
              <BarList
                emptyLabel="Sin ventas en el período"
                format={(n) => `${fmtInt(n)} u.`}
                rows={d.top_products.map((p) => ({ key: p.name, label: p.name, value: p.quantity, sub: formatPrice(p.revenue) }))}
              />
            </Card>
            <Card title="Medios de pago" subtitle="Facturación aprobada">
              <BarList
                emptyLabel="Sin ventas en el período"
                format={(n) => formatPrice(n)}
                rows={d.payment_methods.map((m) => ({
                  key: m.provider,
                  label: providerLabel(m.provider),
                  value: m.revenue,
                  color: providerColor(m.provider),
                  sub: plural(m.orders, 'orden', 'órdenes'),
                }))}
              />
            </Card>
            <Card title="Configuración">
              <dl className="divide-y divide-white/[0.05] text-sm">
                {[
                  ['Organizador', d.event.organizer ? `${d.event.organizer.name}` : '—'],
                  ['Email', d.event.organizer?.email ?? '—'],
                  ['Medios de pago', methods.length ? methods.join(', ') : 'Ninguno configurado'],
                  ['Productos', fmtInt(d.stats.product_count)],
                  ['Staff', fmtInt(d.stats.staff_count)],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-4 py-2">
                    <dt className="text-white/45">{k}</dt>
                    <dd className="break-words text-right text-white/90">{v}</dd>
                  </div>
                ))}
              </dl>
              {!methods.length && <p className="mt-2 text-xs text-amber-300">Sin medios de pago: los compradores no pueden pagar este evento.</p>}
            </Card>
          </div>
        </div>
      )}

      {confirming && d && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirming(false)} aria-hidden />
          <div role="alertdialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#14141D] p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Pausar ventas de “{d.event.name}”</h3>
            <p className="mt-2 text-sm text-white/60">
              El catálogo deja de estar disponible y no se pueden crear órdenes nuevas. Las órdenes ya pagadas y sus QR siguen funcionando. El
              corte total puede tardar hasta 30 segundos.
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
    </div>
  )
}
