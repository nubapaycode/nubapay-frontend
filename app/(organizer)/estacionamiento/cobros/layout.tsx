import { ParkingOwnerSubTabs } from '@/components/parkingOwner/ParkingOwnerSubTabs'

const TABS = [
  { href: '/estacionamiento/cobros', label: 'Pagos' },
  { href: '/estacionamiento/cobros/metodos-pago', label: 'Métodos de pago' },
]

export default function ParkingPaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParkingOwnerSubTabs tabs={TABS} label="Secciones de cobros" />
      {children}
    </>
  )
}
