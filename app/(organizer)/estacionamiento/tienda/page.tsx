import type { Metadata } from 'next'

import { StoreProductsSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Tienda' }

export default function Page() {
  return <StoreProductsSection />
}
