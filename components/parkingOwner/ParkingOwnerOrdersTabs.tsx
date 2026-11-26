'use client'

import { ParkingOwnerSubTabs } from '@/components/parkingOwner/ParkingOwnerSubTabs'
import { getAuthUser } from '@/lib/authSession'
import { hasModule } from '@/lib/modules'

/** Pedidos / Reservas de vehículos. Sin el módulo parking no hay reservas: no se muestran pestañas. */
export function ParkingOwnerOrdersTabs() {
  if (!hasModule(getAuthUser()?.modules ?? [], 'parking')) return null
  return (
    <ParkingOwnerSubTabs
      label="Secciones de pedidos"
      tabs={[
        { href: '/estacionamiento/pedidos', label: 'Pedidos' },
        { href: '/estacionamiento/pedidos/reservas', label: 'Reservas de vehículos' },
      ]}
    />
  )
}
