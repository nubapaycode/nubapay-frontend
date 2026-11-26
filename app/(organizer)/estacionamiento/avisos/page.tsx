import type { Metadata } from 'next'

import { AnnouncementsSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Avisos' }

export default function Page() {
  return <AnnouncementsSection />
}
