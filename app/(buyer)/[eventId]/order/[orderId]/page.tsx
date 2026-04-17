interface OrderPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params

  return (
    <main className="min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Estado de tu pedido</h1>
        <p className="text-sm text-gray-500">#{orderId}</p>
      </header>
    </main>
  )
}
