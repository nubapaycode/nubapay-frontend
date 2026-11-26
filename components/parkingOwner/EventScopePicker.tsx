'use client'

import { useEffect, useState } from 'react'

import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { type ParkingOwnerEventOption, fetchParkingOwnerEventOptions } from '@/lib/parkingOwner'

export type EventScope = {
  /** Evento sobre el que se monta la vista: el base (todo el estacionamiento) o uno puntual. */
  eventId: string
  baseEventId: string
  options: ParkingOwnerEventOption[]
  setEventId: (id: string) => void
}

/** Estado del selector "todos los eventos / uno": arranca en todo el estacionamiento. */
export function useEventScope(): EventScope {
  const { account } = useParkingOwnerAccount()
  const [eventId, setEventId] = useState(account.base_event_id)
  const [options, setOptions] = useState<ParkingOwnerEventOption[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchParkingOwnerEventOptions().then(r => {
      if (!cancelled && r.ok) setOptions(r.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { eventId, baseEventId: account.base_event_id, options, setEventId }
}

export function EventScopePicker({
  eventId,
  baseEventId,
  options,
  setEventId,
  allLabel = 'Todos los eventos',
}: EventScope & { allLabel?: string }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <label htmlFor="event-scope" className="text-[13px] font-semibold text-gray-600">
        Evento
      </label>
      <select
        id="event-scope"
        value={eventId}
        onChange={e => setEventId(e.target.value)}
        className="h-9 max-w-xs rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-900 outline-none focus:border-gray-400"
      >
        <option value={baseEventId}>{allLabel}</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  )
}
