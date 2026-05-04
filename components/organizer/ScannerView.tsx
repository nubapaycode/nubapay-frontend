'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { QrCode } from 'lucide-react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { getOrder } from '@/lib/hooks/useOrderStore'
import { formatPrice } from '@/lib/utils'

type ScanState = 'idle' | 'scanning' | 'found' | 'invalid' | 'delivered'

interface ScannedOrder {
  orderId: string
  items: { productId: string; name: string; price: number; quantity: number }[]
  total: number
  paymentMethod: string
}

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago', cash: 'Efectivo', transfer: 'Transferencia',
}

export function ScannerView({ eventId: _eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<ScanState>('idle')
  const [scannedOrder, setScannedOrder] = useState<ScannedOrder | null>(null)
  const [error, setError] = useState('')

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const scan = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scan)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      try {
        const url = new URL(code.data)
        const parts = url.pathname.split('/')
        const orderIdx = parts.indexOf('order')
        const orderId = orderIdx !== -1 ? parts[orderIdx + 1] : null

        if (!orderId) throw new Error('invalid')

        const order = getOrder(orderId)
        if (order) {
          stopCamera()
          setScannedOrder(order)
          setState('found')
        } else {
          stopCamera()
          setState('invalid')
        }
      } catch {
        stopCamera()
        setState('invalid')
      }
      return
    }

    rafRef.current = requestAnimationFrame(scan)
  }, [stopCamera])

  const startCamera = useCallback(async () => {
    setError('')
    setState('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        rafRef.current = requestAnimationFrame(scan)
      }
    } catch {
      setError('No se pudo acceder a la cámara. Verificá los permisos.')
      setState('idle')
    }
  }, [scan])

  const reset = useCallback(() => {
    stopCamera()
    setScannedOrder(null)
    setError('')
    setState('idle')
  }, [stopCamera])

  const confirmDelivery = () => {
    setState('delivered')
  }

  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <div className="w-full max-w-md mx-auto">
      <OrganizerToolHeading
        title="Escáner"
        description="Validá el código QR del comprador."
        prefix={
          <span className="mt-0.5 rounded-xl bg-gray-100 p-2 text-gray-900" aria-hidden>
            <QrCode size={22} strokeWidth={1.75} />
          </span>
        }
        actions={
          state !== 'idle' ? (
            <button type="button" onClick={reset} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Resetear
            </button>
          ) : undefined
        }
      />

      {/* Idle */}
      {state === 'idle' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900">
            <QrCode size={32} strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <p className="text-base font-medium text-gray-900">Escanear QR de retiro</p>
            <p className="text-sm text-gray-400 mt-1">Activá la cámara para validar un pedido</p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={startCamera}
            className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 transition-colors"
          >
            Activar cámara
          </button>
        </div>
      )}

      {/* Scanning */}
      {state === 'scanning' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="relative aspect-square w-full bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {/* Visor */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 relative">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
              </div>
            </div>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-gray-400">Apuntá al código QR del comprador</p>
          </div>
        </div>
      )}

      {/* Found */}
      {state === 'found' && scannedOrder && (
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pedido encontrado</p>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {scannedOrder.items.map(item => (
                <div key={item.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">{item.quantity}</span>
                    <span className="text-sm text-gray-800">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-medium text-gray-900">{formatPrice(scannedOrder.total)}</span>
            </div>
            {scannedOrder.paymentMethod && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">Pago</span>
                <span className="text-sm font-medium text-gray-900">{paymentLabels[scannedOrder.paymentMethod] ?? scannedOrder.paymentMethod}</span>
              </div>
            )}
          </div>

          <button
            onClick={confirmDelivery}
            className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3.5 hover:bg-gray-700 transition-colors"
          >
            Confirmar entrega
          </button>
          <button onClick={reset} className="w-full rounded-full border border-gray-200 text-sm font-medium text-gray-600 py-3 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      )}

      {/* Invalid */}
      {state === 'invalid' && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl">✕</div>
          <div>
            <p className="text-base font-medium text-gray-900">QR no válido</p>
            <p className="text-sm text-gray-400 mt-1">No se encontró ningún pedido asociado</p>
          </div>
          <button onClick={reset} className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 transition-colors">
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Delivered */}
      {state === 'delivered' && (
        <div className="bg-white rounded-2xl border border-green-100 p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-xl">✓</div>
          <div>
            <p className="text-base font-medium text-gray-900">Entrega confirmada</p>
            <p className="text-sm text-gray-400 mt-1">El pedido fue marcado como entregado</p>
          </div>
          <button onClick={reset} className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 transition-colors">
            Escanear otro
          </button>
        </div>
      )}
    </div>
  )
}
