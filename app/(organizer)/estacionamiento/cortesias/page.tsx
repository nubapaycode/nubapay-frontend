import type { Metadata } from 'next'

import { CourtesiesSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Cortesías' }

export default function Page() {
  return <CourtesiesSection />
}
