import type { Metadata } from 'next'
import { EventsView } from '@/components/organizer/EventsView'

export const metadata: Metadata = {
  title: 'Eventos — Nubapay',
}

export default function OrganizerEventsPage() {
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <EventsView />
    </main>
  )
}
