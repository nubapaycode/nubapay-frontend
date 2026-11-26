import type { Metadata } from 'next'

import { MobbexSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Mobbex' }

export default function Page() {
  return <MobbexSection />
}
