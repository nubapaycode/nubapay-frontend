'use client'

import { useEffect, useState } from 'react'

import { CourtesyView } from '@/components/organizer/CourtesyView'
import { Spinner } from '@/components/ui/Spinner'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

/** Cortesías de un evento: espera los módulos del evento para ofrecer solo parking y/o entradas. */
export function EventCourtesies({ eventId }: { eventId: string }) {
  const [modules, setModules] = useState<string[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchOrganizerEventDetail(eventId).then(res => {
      if (!cancelled) setModules(res.ok ? res.event.modules ?? [] : [])
    })
    return () => {
      cancelled = true
    }
  }, [eventId])

  if (!modules) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" className="text-gray-900" />
      </div>
    )
  }
  return <CourtesyView eventId={eventId} modules={modules} />
}
