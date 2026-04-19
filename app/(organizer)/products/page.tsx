import type { Metadata } from 'next'
import { ProductsView } from '@/components/organizer/ProductsView'

export const metadata: Metadata = {
  title: 'Productos — Nubapay',
}

export default function OrganizerProductsPage() {
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <ProductsView />
    </main>
  )
}
