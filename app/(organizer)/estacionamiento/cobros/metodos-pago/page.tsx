import type { Metadata } from 'next'

import { PaymentsSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Métodos de pago' }

export default function Page() {
  return <PaymentsSection />
}
