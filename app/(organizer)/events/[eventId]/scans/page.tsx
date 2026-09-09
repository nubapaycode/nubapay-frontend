import { redirect } from 'next/navigation'

/**
 * La vista de Escaneos se fusionó con Pedidos (pestaña "Escaneos" en `/orders`).
 * Se mantiene esta ruta solo para redirigir enlaces antiguos.
 */
export default async function EventScansPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  redirect(`/events/${eventId}/orders`)
}
