'use client'

import { useEffect, useState } from 'react'

import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'

/** null mientras carga. true = el evento cobra costo de servicio al comprador. */
export function useServiceFeeMode(eventId: string): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setEnabled(null)
    void fetchOrganizerEventDetail(eventId).then(res => {
      if (cancelled) return
      setEnabled(res.ok ? Boolean(res.event.service_fee_enabled) : false)
    })
    return () => {
      cancelled = true
    }
  }, [eventId])

  return enabled
}

export function settlementToolLabel(serviceFeeEnabled: boolean) {
  return serviceFeeEnabled ? 'Costo de servicio' : 'Comisión'
}

/** Lo que le corresponde a Nubapay en un pago aprobado. */
export function settlementDue(amount: number, serviceFee: number, serviceFeeEnabled: boolean) {
  if (serviceFeeEnabled) return serviceFee
  return Math.max(0, amount - serviceFee) * 0.01
}
