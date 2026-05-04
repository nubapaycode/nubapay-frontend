'use client'

import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

import { buyerFlowPath } from '@/lib/buyerRoutes'

interface QRDisplayProps {
  orderId: string
  eventId: string
  catalogSlug?: string
}

export function QRDisplay({ orderId, eventId, catalogSlug }: QRDisplayProps) {
  const router = useRouter()
  const orderRelativePath = buyerFlowPath(eventId, {
    catalogSlug,
    path: `order/${orderId}`,
  })
  const orderUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${orderRelativePath}` : orderRelativePath

  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-sm">
      <div>
        <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full">
          Listo para retirar
        </span>
      </div>

      <div>
        <p className="text-xl font-bold text-gray-900">Tu código de retiro</p>
        <p className="text-sm text-gray-400 mt-1">Mostrá este QR al retirar tu pedido</p>
      </div>

      <div className="border border-gray-100 rounded-3xl p-6 bg-white shadow-sm">
        <QRCodeSVG
          value={orderUrl}
          size={200}
          bgColor="#ffffff"
          fgColor="#111111"
          level="M"
        />
      </div>

      <p className="text-xs text-gray-400 font-mono tracking-widest">#{orderId.slice(0, 8).toUpperCase()}</p>

      <button
        onClick={() => router.push(orderRelativePath)}
        className="w-full rounded-full border border-gray-200 text-sm font-semibold text-gray-700 py-3 hover:bg-gray-50 transition-colors"
      >
        Ver detalle del pedido
      </button>
    </div>
  )
}
