'use client'

import { useEffect, useState } from 'react'

import { FilterMenu } from '@/components/organizer/orders/FilterMenu'
import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { type ParkingOwnerEventOption, fetchParkingOwnerEventOptions } from '@/lib/parkingOwner'

export type EventScope = {
  /** Evento sobre el que se monta la vista: el base (todo el estacionamiento) o uno puntual. */
  eventId: string
  baseEventId: string
  options: ParkingOwnerEventOption[]
  setEventId: (id: string) => void
}

/** Estado del filtro de evento: arranca en todo el estacionamiento. */
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

/**
 * Filtro "Evento" con el mismo estilo que los demás filtros de la fila (Pago, Estado…).
 * Sin selección = todos los eventos del estacionamiento.
 */
export function EventFilter({ eventId, baseEventId, options, setEventId }: EventScope) {
  if (options.length === 0) return null
  const selected = eventId === baseEventId ? [] : [eventId]
  const current = options.find(o => o.id === eventId)
  return (
    <FilterMenu
      label={current ? current.name : 'Evento'}
      hideCount
      options={options.map(o => ({ value: o.id, label: o.name }))}
      selected={selected}
      onChange={v => setEventId(v[0] ?? baseEventId)}
      triggerClassName="max-w-[240px]"
    />
  )
}
