import type { Metadata } from 'next'
import { mockEvent } from '@/lib/mock/event'
import { CatalogView } from '@/components/buyer/CatalogView'

interface CatalogPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { eventId } = await params
  return { title: `Catálogo — ${eventId}` }
}

export default function CatalogPage() {
  return (
    <main className="min-h-screen pb-32">
      <CatalogView event={mockEvent} />
    </main>
  )
}
