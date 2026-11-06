'use client'

import { useCallback, useEffect, useState } from 'react'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import {
  PeriodPicker,
  daysAgo,
  formatDay,
  rangeForPreset,
  type Preset,
} from '@/components/organizer/dashboard/PeriodPicker'
import { Spinner } from '@/components/ui/Spinner'
import { fetchEventCommission, type CommissionSummary, type DashboardRange } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

function periodPhrase(preset: Preset, range: DashboardRange | null) {
  if (preset === 'today') return 'hoy'
  if (preset === '7') return 'en los últimos 7 días'
  if (preset === '30') return 'en los últimos 30 días'
  if (preset === 'custom' && range) {
    return range.from === range.to ? `el ${formatDay(range.from)}` : `del ${formatDay(range.from)} al ${formatDay(range.to)}`
  }
  return 'en todo el evento'
}

export function CommissionView({ eventId }: { eventId: string }) {
  const [preset, setPreset] = useState<Preset>('all')
  const [customFrom, setCustomFrom] = useState(() => daysAgo(6))
  const [customTo, setCustomTo] = useState(() => daysAgo(0))
  const [range, setRange] = useState<DashboardRange | null>(null)
  // El resultado lleva la clave del pedido: si no coincide con el período actual, todavía está cargando.
  const [result, setResult] = useState<{ key: string; data: CommissionSummary | null; error: string } | null>(null)

  const rangeFrom = range?.from
  const rangeTo = range?.to
  const key = `${eventId}|${rangeFrom ?? ''}|${rangeTo ?? ''}`
  useEffect(() => {
    let cancelled = false
    fetchEventCommission(eventId, rangeFrom && rangeTo ? { from: rangeFrom, to: rangeTo } : null)
      .then(res => {
        if (cancelled) return
        setResult(res.ok ? { key, data: res.data, error: '' } : { key, data: null, error: res.error })
      })
      .catch(() => {
        if (!cancelled) setResult({ key, data: null, error: 'Error al cargar la comisión' })
      })
    return () => {
      cancelled = true
    }
  }, [eventId, rangeFrom, rangeTo, key])

  const loading = result?.key !== key
  const data = loading ? null : result.data
  const error = loading ? '' : result.error

  const choosePreset = useCallback(
    (p: Exclude<Preset, 'custom'>) => {
      setPreset(p)
      setRange(rangeForPreset(p, customFrom, customTo))
    },
    [customFrom, customTo],
  )

  const chooseCustom = (from: string, to: string) => {
    setCustomFrom(from)
    setCustomTo(to)
    setPreset('custom')
    setRange({ from, to })
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      <OrganizerToolHeading
        title="Comisión"
        description="Total a pagar a Nubapay por las ventas de tu evento. Las órdenes canceladas no se cuentan."
        prefix={
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        }
        actions={
          <PeriodPicker
            preset={preset}
            range={range}
            customFrom={customFrom}
            customTo={customTo}
            onPreset={choosePreset}
            onCustom={chooseCustom}
          />
        }
      />

      {loading && !error && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="md" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-white p-6 text-center text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && data && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 flex flex-col gap-1">
          <p className="text-xs text-indigo-500 uppercase tracking-wider">Total a pagar</p>
          <p className="text-4xl font-bold text-indigo-700 tracking-tight tabular-nums">{formatPrice(data.total_due)}</p>
          <p className="text-xs text-indigo-400">
            {data.paid_orders} {data.paid_orders === 1 ? 'orden paga' : 'órdenes pagas'} {periodPhrase(preset, range)}
            {data.cancelled_orders > 0 &&
              ` · ${data.cancelled_orders} ${data.cancelled_orders === 1 ? 'cancelada excluida' : 'canceladas excluidas'}`}
          </p>
        </div>
      )}
    </div>
  )
}
