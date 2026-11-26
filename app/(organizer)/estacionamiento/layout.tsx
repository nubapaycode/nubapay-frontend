import { ParkingOwnerAccountProvider } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { ParkingOwnerGuard } from '@/components/parkingOwner/ParkingOwnerGuard'
import { ParkingOwnerShell } from '@/components/parkingOwner/ParkingOwnerShell'

/** Panel global del dueño de estacionamiento (no está atado a un evento). */
export default function ParkingOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParkingOwnerGuard>
      <ParkingOwnerShell>
        <ParkingOwnerAccountProvider>{children}</ParkingOwnerAccountProvider>
      </ParkingOwnerShell>
    </ParkingOwnerGuard>
  )
}
