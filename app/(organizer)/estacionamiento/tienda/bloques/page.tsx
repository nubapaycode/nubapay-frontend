import type { Metadata } from 'next'

import { StoreBlocksSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Bloques de la tienda' }

export default function Page() {
  return <StoreBlocksSection />
}
