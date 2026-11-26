import type { Metadata } from 'next'

import { OrdersSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Pedidos' }

export default function Page() {
  return <OrdersSection />
}
