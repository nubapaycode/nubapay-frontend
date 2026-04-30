import type { Metadata } from 'next'

import { CatalogView } from '@/components/buyer/CatalogView'
import { mockEvent } from '@/lib/mock/event'
import { pageMeta } from '@/lib/seo'

interface CatalogPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  await params
  return pageMeta({
    title: 'Menú y pedidos',
    description:
      'Explorá productos y combos, armá tu pedido y pagá desde el celular. Retiro ágil con código QR.',
  })
}

export default function CatalogPage() {
  return (
    <main className="min-h-screen pb-32">
      <CatalogView event={mockEvent} />
    </main>
  )
}
