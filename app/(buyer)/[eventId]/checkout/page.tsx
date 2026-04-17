interface CheckoutPageProps {
  params: Promise<{ eventId: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { eventId } = await params

  return (
    <main className="min-h-screen p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Pago</h1>
        <p className="text-sm text-gray-500">Evento: {eventId}</p>
      </header>
    </main>
  )
}
