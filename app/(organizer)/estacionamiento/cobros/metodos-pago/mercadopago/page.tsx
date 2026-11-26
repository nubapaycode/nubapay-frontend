import type { Metadata } from 'next'

import { MercadoPagoSection } from '@/components/parkingOwner/ParkingOwnerSections'

export const metadata: Metadata = { title: 'Mercado Pago' }

export default function Page() {
  return <MercadoPagoSection />
}
