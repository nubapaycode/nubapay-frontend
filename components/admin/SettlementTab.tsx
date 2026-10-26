'use client'

import { Download } from 'lucide-react'
import { useCallback, useState } from 'react'

import { fmtDayLong, fmtInt } from './format'
import { RangeControls, useDateRange } from './OverviewTab'
import { Btn, Card, EmptyState, ErrorNote, Skeleton, Table, Td, Th, cx, useAsync, useToast } from './ui'
import { downloadSettlementCsv, fetchSettlement, type SettlementSection } from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12121A] p-5">
      <p className="text-xs font-medium text-white/45">{label}</p>
      <p className={cx('mt-2 font-semibold tracking-tight', strong ? 'text-3xl text-[#C6FF00]' : 'text-2xl text-white')}>{value}</p>
    </div>
  )
}

function SettlementSectionView({
  title,
  subtitle,
  amountLabel,
  section,
}: {
  title: string
  subtitle: string
  amountLabel: string
  section: SettlementSection
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Total strong label={amountLabel} value={formatPrice(section.totals.amount)} />
        <Total label="Facturado por los organizadores" value={formatPrice(section.totals.revenue)} />
        <Total label="Órdenes pagas" value={fmtInt(section.totals.paid_orders)} />
      </div>

      <Card title="Por organizador" subtitle="Cuánto te corresponde cobrar a cada uno en el período" flush>
        {section.organizers.length === 0 ? (
          <EmptyState title="Sin ventas en el período" />
        ) : (
          <Table min={760}>
            <thead className="border-b border-white/[0.06]">
              <tr>
                <Th>Organizador</Th>
                <Th align="right">Eventos</Th>
                <Th align="right">Órdenes</Th>
                <Th align="right">Facturado</Th>
                <Th align="right">{amountLabel}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {section.organizers.map((o) => (
                <tr key={o.organizer_email} className="hover:bg-white/[0.02]">
                  <Td>
                    <p className="font-medium text-white">{o.organizer_name}</p>
                    <p className="text-xs text-white/40">{o.organizer_email}</p>
                  </Td>
                  <Td align="right">{fmtInt(o.events)}</Td>
                  <Td align="right">{fmtInt(o.paid_orders)}</Td>
                  <Td align="right">{formatPrice(o.revenue)}</Td>
                  <Td align="right" className="!font-semibold !text-[#C6FF00]">
                    {formatPrice(o.amount)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card title="Por evento" flush>
        {section.events.length === 0 ? (
          <EmptyState title="Sin ventas en el período" />
        ) : (
          <Table min={760}>
            <thead className="border-b border-white/[0.06]">
              <tr>
                <Th>Evento</Th>
                <Th>Organizador</Th>
                <Th align="right">Órdenes</Th>
                <Th align="right">Facturado</Th>
                <Th align="right">{amountLabel}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {section.events.map((e) => (
                <tr key={e.event_id} className="hover:bg-white/[0.02]">
                  <Td className="font-medium text-white">{e.event_name}</Td>
                  <Td muted>{e.organizer_email}</Td>
                  <Td align="right">{fmtInt(e.paid_orders)}</Td>
                  <Td align="right">{formatPrice(e.revenue)}</Td>
                  <Td align="right" className="!font-semibold !text-white">
                    {formatPrice(e.amount)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </section>
  )
}

export function SettlementTab() {
  const toast = useToast()
  const range = useDateRange('30')
  const [exporting, setExporting] = useState(false)
  const load = useCallback(() => fetchSettlement(range.params), [range.params])
  const { data, error, loading, reload } = useAsync(load, [load])

  async function exportCsv() {
    setExporting(true)
    const r = await downloadSettlementCsv(range.params)
    setExporting(false)
    if (!r.ok) toast('error', r.error)
  }

  return (
    <div className="space-y-6">
      <RangeControls
        range={range}
        right={
          <Btn size="sm" onClick={exportCsv} disabled={exporting || !data || data.commission.events.length + data.service_fee.events.length === 0}>
            <Download size={13} />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </Btn>
        }
      />

      {error && <ErrorNote message={error} onRetry={reload} />}

      {!data && loading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data ? (
        <div className={cx('space-y-6 transition-opacity', loading && 'opacity-60')}>
          <p className="text-xs text-white/40">
            {fmtDayLong(data.range.from)} – {fmtDayLong(data.range.to)} · órdenes creadas en el período con pago aprobado. Los
            compradores le pagan directo a cada organizador: acá solo figura lo que te corresponde cobrar a vos. El modo de cobro
            (comisión o costo de servicio) se configura por evento y queda registrado en cada orden. No incluye órdenes de test.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Total strong label="Total a cobrar" value={formatPrice(data.totals.platform_income)} />
            <Total label={`Comisión ${(data.commission_rate * 100).toLocaleString('es-AR')}%`} value={formatPrice(data.totals.commission)} />
            <Total label="Costo de servicio" value={formatPrice(data.totals.service_fee)} />
            <Total
              label="Órdenes pagas"
              value={fmtInt(data.commission.totals.paid_orders + data.service_fee.totals.paid_orders)}
            />
          </div>

          <SettlementSectionView
            title={`Eventos con comisión ${(data.commission_rate * 100).toLocaleString('es-AR')}%`}
            subtitle="La comisión se calcula sobre lo que facturó el organizador."
            amountLabel="Comisión a cobrar"
            section={data.commission}
          />

          <SettlementSectionView
            title="Eventos con costo de servicio"
            subtitle="Lo pagaron los compradores sobre su compra (5% tickets, 2% productos). No se cobra comisión."
            amountLabel="Costo de servicio"
            section={data.service_fee}
          />
        </div>
      ) : null}
    </div>
  )
}
