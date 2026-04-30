import type { Metadata } from 'next'

import { OrganizerGuard } from '@/components/organizer/OrganizerGuard'
import { ORGANIZER_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  robots: ORGANIZER_ROBOTS,
}

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizerGuard>
      {children}
    </OrganizerGuard>
  )
}
