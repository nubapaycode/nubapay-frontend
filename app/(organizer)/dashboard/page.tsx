import type { Metadata } from 'next'
import { DashboardView } from '@/components/organizer/DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard — Nubapay',
}

export default function OrganizerDashboardPage() {
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <DashboardView />
    </main>
  )
}
