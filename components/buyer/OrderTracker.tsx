'use client'

import { useRouter } from 'next/navigation'
import { useOrderStatus } from '@/lib/hooks/useOrderStatus'
import { Button } from '@/components/ui/Button'
import type { OrderStatus } from '@/types'

interface OrderTrackerProps {
  orderId: string
  eventId: string
}

const steps: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Recibido' },
  { key: 'preparing', label: 'En preparación' },
  { key: 'ready', label: 'Listo' },
  { key: 'delivered', label: 'Entregado' },
]

const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered']

function getStepState(
  stepKey: OrderStatus,
  currentStatus: OrderStatus
): 'completed' | 'active' | 'pending' {
  const stepIdx = statusOrder.indexOf(stepKey)
  const currentIdx = statusOrder.indexOf(currentStatus)
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

export function OrderTracker({ orderId, eventId }: OrderTrackerProps) {
  const router = useRouter()
  const { status } = useOrderStatus(orderId)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Tu pedido</h1>
      <p className="text-sm text-gray-500 mb-6">#{orderId.slice(0, 8)}</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col gap-4">
          {steps.map(step => {
            const state = getStepState(step.key, status)
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    state === 'completed'
                      ? 'bg-green-500 text-white'
                      : state === 'active'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {state === 'completed' ? '✓' : state === 'active' ? '●' : '○'}
                </div>
                <span
                  className={`text-sm font-medium ${
                    state === 'pending' ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {status === 'ready' && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push(`/${eventId}/qr/${orderId}`)}
        >
          Ver QR de retiro →
        </Button>
      )}
    </div>
  )
}
