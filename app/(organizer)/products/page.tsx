import type { Metadata } from 'next'
import { ProductsView } from '@/components/organizer/ProductsView'

export const metadata: Metadata = {
  title: 'Productos — Nubapay',
}

export default function OrganizerProductsPage() {
  return (
    <main className="p-6">
      <ProductsView />
    </main>
  )
}
