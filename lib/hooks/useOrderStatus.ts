'use client'

import { useState, useEffect } from 'react'
import type { OrderStatus } from '@/types'

export function useOrderStatus(_orderId: string): { status: OrderStatus } {
  const [status, setStatus] = useState<OrderStatus>('ready')


  return { status }
}
