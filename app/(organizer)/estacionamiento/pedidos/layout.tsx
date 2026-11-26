import { ParkingOwnerOrdersTabs } from '@/components/parkingOwner/ParkingOwnerOrdersTabs'

export default function ParkingOrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParkingOwnerOrdersTabs />
      {children}
    </>
  )
}
