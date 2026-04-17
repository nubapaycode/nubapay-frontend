import type { Metadata } from 'next'

interface CatalogPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { eventId } = await params
  return { title: `Catálogo — ${eventId}` }
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { eventId } = await params

  return (
    <main className="min-h-screen p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-gray-500">Evento: {eventId}</p>
      </header>
    </main>
  )
}
