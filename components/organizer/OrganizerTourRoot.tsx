'use client'

import { TourProvider } from '@/lib/tour/tourContext'
import { TourOverlay } from '@/components/organizer/TourOverlay'

export function OrganizerTourRoot({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider>
      <TourOverlay />
      {children}
    </TourProvider>
  )
}
