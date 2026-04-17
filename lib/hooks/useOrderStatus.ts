'use client'

import { useState, useEffect } from 'react'
import type { OrderStatus } from '@/types'

export function useOrderStatus(_orderId: string): { status: OrderStatus } {
  const [status, setStatus] = useState<OrderStatus>('pending')

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('preparing'), 3000)
    const t2 = setTimeout(() => setStatus('ready'), 6000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [_orderId])

  return { status }
}
