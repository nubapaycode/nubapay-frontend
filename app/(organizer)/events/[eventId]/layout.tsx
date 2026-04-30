import { EventOrganizerShell } from '@/components/organizer/EventOrganizerShell'

export default async function EventWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return <EventOrganizerShell eventId={eventId}>{children}</EventOrganizerShell>
}
