'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_FONT } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'
import { useOrderHistory } from '@/lib/hooks/useOrderHistory'

interface FloatingOrdersProps {
  eventId: string
  catalogSlug?: string
}

export function FloatingOrders({ eventId, catalogSlug }: FloatingOrdersProps) {
  const slug = catalogSlug ?? eventId
  const orders = useOrderHistory(slug)
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (orders.length === 0) return null

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        style={{ fontFamily: BUYER_FONT }}
        className="fixed bottom-[88px] right-4 z-40 md:bottom-[72px] flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-lg px-4 py-2.5 text-[13px] font-bold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-black">
          {orders.length}
        </span>
        Mis pedidos
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div
            className="relative bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-sm max-h-[70vh] flex flex-col"
            style={{ fontFamily: BUYER_FONT }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <span className="text-[16px] font-bold text-gray-900">Mis pedidos</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {orders.map(order => (
                <button
                  key={order.orderId}
                  onClick={() => {
                    setOpen(false)
                    router.push(buyerFlowPath(eventId, { catalogSlug, path: `order/${order.orderId}` }))
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-semibold text-gray-900">
                      {order.orderNumber ? `Pedido #${order.orderNumber}` : 'Pedido'}
                    </span>
                    <span className="text-[12px] text-gray-400">
                      {new Date(order.createdAt).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-gray-900">{formatPrice(order.total)}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
