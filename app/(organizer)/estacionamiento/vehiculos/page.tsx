import type { Metadata } from 'next'

import { VehiclesSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Vehículos' }

export default function Page() {
  return <VehiclesSection />
}
