import type { Metadata } from 'next'

import { ParkingReservationsSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Reservas de vehículos' }

export default function Page() {
  return <ParkingReservationsSection />
}
