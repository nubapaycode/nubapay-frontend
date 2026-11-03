import type { Metadata } from 'next'

import { EventsView } from '@/components/organizer/EventsView'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Mis eventos',
  description: 'Lista de tus eventos para alternar entre ellos sin salir del panel.',
})

export default function EventsListInsideShellPage() {
  return (
    <main className="w-full max-w-3xl mx-auto px-6 pt-10 pb-24">
      <EventsView embedded />
    </main>
  )
}
