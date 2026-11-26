import type { Metadata } from 'next'

import { ParkingOwnerSettingsView } from '@/components/parkingOwner/ParkingOwnerSettingsView'

export const metadata: Metadata = { title: 'Configuración' }

export default function Page() {
  return <ParkingOwnerSettingsView />
}
