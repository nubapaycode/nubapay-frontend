import type { Metadata } from 'next'

import { PaymentsListSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Cobros' }

export default function Page() {
  return <PaymentsListSection />
}
