import type { Metadata } from 'next'

import { ScannerSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Escáner' }

export default function Page() {
  return <ScannerSection />
}
