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
    <main className="w-full max-w-2xl mx-auto px-4 pt-6 pb-24 md:px-6 md:pt-[64px] md:pb-16">
      <EventsView />
    </main>
  )
}
