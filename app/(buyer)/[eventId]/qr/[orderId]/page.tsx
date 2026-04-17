interface QRPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export default async function QRPage({ params }: QRPageProps) {
  const { orderId } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold">Retirá tu pedido</h1>
      <p className="mt-1 text-sm text-gray-500">#{orderId}</p>
    </main>
  )
}
