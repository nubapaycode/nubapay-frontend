import type { Metadata } from 'next'

import { ParkingOwnerEventsView } from '@/components/parkingOwner/ParkingOwnerEventsView'

export const metadata: Metadata = { title: 'Eventos' }

export default function ParkingOwnerEventsPage() {
  return <ParkingOwnerEventsView />
}
