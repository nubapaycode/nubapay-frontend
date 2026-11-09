import type { Metadata } from 'next'

import { EventsView } from '@/components/organizer/EventsView'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Mis eventos',
  description:
    'Creá y administrá tus eventos: menú digital, pedidos en vivo, cobros y puntos de retiro.',
})

export default function OrganizerEventsPage() {
  return (
    <main className="w-full max-w-3xl mx-auto px-6 pt-10 pb-24">
      <EventsView />
    </main>
  )
}
