import type { Metadata } from 'next'

import { SipagoSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Sipago' }

export default function Page() {
  return <SipagoSection />
}
