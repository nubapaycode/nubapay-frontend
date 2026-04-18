import type { Metadata } from 'next'
import { DashboardView } from '@/components/organizer/DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard — Nubapay',
}

export default function OrganizerDashboardPage() {
  return (
    <main className="p-6">
      <DashboardView />
    </main>
  )
}
