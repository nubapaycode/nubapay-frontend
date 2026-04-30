import { redirect } from 'next/navigation'

export default function LegacyOrganizerRedirectPage() {
  redirect('/events')
}
