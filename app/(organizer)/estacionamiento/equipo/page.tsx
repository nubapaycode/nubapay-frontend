import type { Metadata } from 'next'

import { TeamSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Equipo' }

export default function Page() {
  return <TeamSection />
}
