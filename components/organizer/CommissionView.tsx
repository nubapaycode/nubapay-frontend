'use client'

import { useEffect, useState } from 'react'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Spinner } from '@/components/ui/Spinner'
import { fetchAllApprovedPayments, type WorkspacePayment } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

const COMMISSION_RATE = 0.01

const channelLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

const channelClass: Record<string, string> = {
  mp: 'bg-sky-50 text-sky-700',
  cash: 'bg-green-50 text-green-700',
  transfer: 'bg-violet-50 text-violet-700',
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  const d = new Date(s)
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' '
    + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  )
}

export function CommissionView({ eventId }: { eventId: string }) {
  const [payments, setPayments] = useState<WorkspacePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchAllApprovedPayments(eventId).then(res => {
      if (res.ok) setPayments(res.payments)
      else setError(res.error)
      setLoading(false)
    })
  }, [eventId])

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0)
  const totalCommission = totalRevenue * COMMISSION_RATE

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      <OrganizerToolHeading
        title="Comisión"
        description="1% sobre cada transacción aprobada de tu evento."
        prefix={
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="md" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-white p-6 text-center text-sm text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total facturado</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatPrice(totalRevenue)}</p>
              <p className="text-xs text-gray-400">{payments.length} transacciones aprobadas</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 flex flex-col gap-1">
              <p className="text-xs text-indigo-500 uppercase tracking-wider">Comisión a pagar (1%)</p>
              <p className="text-2xl font-bold text-indigo-700 tracking-tight">{formatPrice(totalCommission)}</p>
              <p className="text-xs text-indigo-400">1% sobre el total aprobado</p>
            </div>
          </div>

          {/* Tabla de transacciones */}
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
              No hay transacciones aprobadas todavía.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Canal</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Monto</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Comisión</p>
              </div>
              <div className="divide-y divide-gray-50">
                {payments.map(p => (
                  <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-3 items-center">
                    <p className="text-sm text-gray-600 tabular-nums">{fmtDate(p.paid_at ?? p.created_at)}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${channelClass[p.channel ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                      {channelLabels[p.channel ?? ''] ?? p.channel ?? '—'}
                    </span>
                    <p className="text-sm font-medium text-gray-900 text-right tabular-nums">{formatPrice(p.amount)}</p>
                    <p className="text-sm font-semibold text-indigo-600 text-right tabular-nums">{formatPrice(p.amount * COMMISSION_RATE)}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Total</p>
                <span />
                <p className="text-sm font-semibold text-gray-900 text-right tabular-nums">{formatPrice(totalRevenue)}</p>
                <p className="text-sm font-bold text-indigo-700 text-right tabular-nums">{formatPrice(totalCommission)}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
