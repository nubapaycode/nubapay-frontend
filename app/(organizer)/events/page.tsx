import type { Metadata } from 'next'
import { EventsView } from '@/components/organizer/EventsView'

export const metadata: Metadata = {
  title: 'Eventos — Nubapay',
}

export default function OrganizerEventsPage() {
  return (
    <main className="p-6">
      <EventsView />
    </main>
  )
}
