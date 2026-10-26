'use client'

import { ChevronRight, CreditCard, Landmark } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

import { Money, formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import { useWorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import { fetchWorkspacePayments, type PaymentsSummary } from '@/lib/organizerWorkspace'
import { visibleSectionTabs } from '@/lib/organizerWorkspaceSections'

const CARD_DETAILS: Record<string, { description: string; icon: ReactNode }> = {
  payments: {
    description: 'Cada cobro del evento, con su estado y el pedido al que pertenece.',
    icon: <CreditCard size={18} strokeWidth={1.75} aria-hidden />,
  },
  'metodos-pago': {
    description: 'Conectá las pasarelas de pago que vas a usar para cobrar este evento.',
    icon: <Landmark size={18} strokeWidth={1.75} aria-hidden />,
  },
}

/** Página de entrada de Cobros: una tarjeta por herramienta permitida, con el dato clave a la vista. */
export function CobrosView() {
  const access = useWorkspaceAccess()
  const tabs = access ? visibleSectionTabs('cobros', access) : []
  const canSeePayments = tabs.some(t => t.segment === 'payments')
  const eventId = access?.basePath.split('/').filter(Boolean).pop() ?? ''
  const [summary, setSummary] = useState<PaymentsSummary | null>(null)

  useEffect(() => {
    if (!canSeePayments || !eventId) return
    let cancelled = false
    void fetchWorkspacePayments(eventId, { page: 1, pageSize: 1 })
      .then(res => {
        if (!cancelled && res.ok) setSummary(res.summary)
      })
      .catch(() => {
        /* el resumen es opcional: si falla, la tarjeta queda sin datos */
      })
    return () => {
      cancelled = true
    }
  }, [canSeePayments, eventId])

  return (
    <div className="w-full max-w-[720px]">
      <header className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Cobros</h1>
        <p className="mt-1 text-[13px] text-gray-500">Pagos recibidos y pasarelas conectadas del evento.</p>
      </header>

      <div className="space-y-3">
        {access &&
          tabs.map(tab => {
            const details = CARD_DETAILS[tab.segment]
            const showStats = tab.segment === 'payments' && summary
            return (
              <Link
                key={tab.segment}
                href={`${access.basePath}/${tab.segment}`}
                className="group flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] hover:border-gray-300 hover:shadow-[0_6px_20px_-8px_rgba(16,24,40,0.18)]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-gray-900 group-hover:text-white">
                  {details?.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-gray-900">{tab.label}</p>
                  {details && <p className="mt-0.5 text-[13px] text-gray-500">{details.description}</p>}
                </div>
                {showStats && (
                  <div className="hidden shrink-0 text-right sm:block">
                    <Money value={summary.approved.amount} className="block text-[16px] font-semibold tabular-nums text-gray-900" />
                    <span className="text-[12px] text-gray-400">
                      cobrado
                      {summary.pending.count > 0 && ` · ${formatCount(summary.pending.count)} pendientes`}
                    </span>
                  </div>
                )}
                <ChevronRight
                  size={16}
                  className="shrink-0 text-gray-300 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-gray-600"
                  aria-hidden
                />
              </Link>
            )
          })}
      </div>
    </div>
  )
}
