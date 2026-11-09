import type { Metadata } from 'next'

import { DocsIndexView } from '@/components/organizer/docs/DocsIndexView'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Documentación',
  description: 'Guías paso a paso de cada herramienta del panel de Nubapay.',
})

type Props = { searchParams: Promise<{ evento?: string | string[] }> }

/** El panel abre la documentación con `?evento=` para volver a ese evento y abrir cada herramienta. */
export default async function DocsPage({ searchParams }: Props) {
  const { evento } = await searchParams
  const eventId = typeof evento === 'string' && evento.trim() ? evento.trim() : undefined
  return <DocsIndexView eventId={eventId} />
}
