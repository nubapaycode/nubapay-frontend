'use client'

import { Badge } from '@/components/ui/Badge'

interface QRDisplayProps {
  orderId: string
}

const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,1,0],
  [1,0,0,0,0,0,1,0,0,1],
  [1,0,1,1,1,0,1,0,1,0],
  [1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0],
  [1,0,0,0,0,0,1,1,0,1],
  [1,1,1,1,1,1,1,0,1,0],
  [0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,0,0,1,1],
  [0,1,0,0,1,0,1,1,0,1],
]

export function QRDisplay({ orderId }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Badge variant="success" className="text-sm px-4 py-1">
        Listo para retirar
      </Badge>

      <p className="text-gray-600">Mostrá este código al retirar tu pedido</p>

      <div className="border-4 border-gray-900 rounded-lg p-4 bg-white">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: 'repeat(10, 1fr)', width: 160 }}
        >
          {QR_PATTERN.flat().map((cell, i) => (
            <div
              key={i}
              className={`w-4 h-4 ${cell ? 'bg-gray-900' : 'bg-white'}`}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 font-mono">#{orderId.slice(0, 8)}</p>
    </div>
  )
}
