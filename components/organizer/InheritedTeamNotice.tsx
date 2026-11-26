'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getAuthUser } from '@/lib/authSession'
import { PARKING_OWNER_HOME, isParkingOwner } from '@/lib/modules'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

/**
 * Equipo de un evento de un estacionamiento: el equipo general del estacionamiento ya trabaja acá; lo que se
 * suma en esta pantalla vale solo para este evento.
 */
export function InheritedTeamNotice({ eventId }: { eventId: string }) {
  const [inherits, setInherits] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchOrganizerEventDetail(eventId).then(res => {
      if (!cancelled && res.ok) setInherits(Boolean(res.event.parent_event_id))
    })
    return () => {
      cancelled = true
    }
  }, [eventId])

  if (!inherits) return null
  const owner = isParkingOwner(getAuthUser())
  return (
    <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-gray-50 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-gray-900">El equipo de tu estacionamiento también trabaja en este evento</p>
        <p className="mt-0.5 text-[13px] text-gray-500">
          Las personas que invites acá tienen acceso solo a este evento, con los permisos que les des.
        </p>
      </div>
      {owner && (
        <Link
          href={`${PARKING_OWNER_HOME}/equipo`}
          className="inline-flex h-9 shrink-0 items-center rounded-xl border border-gray-200 bg-white px-3.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          Ver equipo del estacionamiento
        </Link>
      )}
    </section>
  )
}
