'use client'

import { ChevronRight, CreditCard, Landmark, Percent } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { useWorkspaceAccess } from '@/components/organizer/WorkspaceAccessContext'
import { visibleSectionTabs } from '@/lib/organizerWorkspaceSections'

const CARD_DETAILS: Record<string, { description: string; icon: ReactNode }> = {
  payments: {
    description: 'Registros de cobro asociados a pedidos del evento.',
    icon: <CreditCard size={16} strokeWidth={1.75} aria-hidden />,
  },
  'metodos-pago': {
    description: 'Conectá las pasarelas de pago que vas a usar para cobrar este evento.',
    icon: <Landmark size={16} strokeWidth={1.75} aria-hidden />,
  },
  comision: {
    description: '1% sobre cada transacción aprobada de tu evento.',
    icon: <Percent size={16} strokeWidth={1.75} aria-hidden />,
  },
}

/** Página de entrada de Cobros: una tarjeta por herramienta permitida. */
export function CobrosView() {
  const access = useWorkspaceAccess()
  const tabs = access ? visibleSectionTabs('cobros', access) : []

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <OrganizerToolHeading
        title="Cobros"
        description="Pagos recibidos, pasarelas conectadas y comisiones del evento."
      />

      <div className="space-y-3">
        {access && tabs.map(tab => {
          const details = CARD_DETAILS[tab.segment]
          return (
            <Link
              key={tab.segment}
              href={`${access.basePath}/${tab.segment}`}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-colors hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
                {details?.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{tab.label}</p>
                {details && <p className="text-xs text-gray-400 mt-0.5">{details.description}</p>}
              </div>
              <ChevronRight
                size={16}
                className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-600"
                aria-hidden
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
