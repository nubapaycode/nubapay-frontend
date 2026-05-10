import { EventOrganizerShell } from '@/components/organizer/EventOrganizerShell'
import { logOrganizerSsrContext } from '@/lib/server/logOrganizerRequestContext'

export default async function EventWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  await logOrganizerSsrContext('events/[eventId] layout (dashboard y herramientas)', { eventId })

  return <EventOrganizerShell eventId={eventId}>{children}</EventOrganizerShell>
}
