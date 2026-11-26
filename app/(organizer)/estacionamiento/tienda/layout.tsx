import { ParkingOwnerSubTabs } from '@/components/parkingOwner/ParkingOwnerSubTabs'

const TABS = [
  { href: '/estacionamiento/tienda', label: 'Productos' },
  { href: '/estacionamiento/tienda/bloques', label: 'Bloques' },
]

export default function ParkingStoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParkingOwnerSubTabs tabs={TABS} label="Secciones de la tienda" />
      {children}
    </>
  )
}
