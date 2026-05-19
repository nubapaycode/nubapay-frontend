'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { QrCode } from 'lucide-react'

import { AccentButton } from '@/components/organizer/AccentButton'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { scanQr } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'
import type { Order } from '@/types'

type ScanState = 'idle' | 'scanning' | 'loading' | 'ready' | 'error'

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago', cash: 'Efectivo', transfer: 'Transferencia',
}

export function ScannerView({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<ScanState>('idle')
  const [order, setOrder] = useState<Order | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [cameraError, setCameraError] = useState('')

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const handleQrData = useCallback(async (data: string) => {
    stopCamera()
    setState('loading')

    let orderId: string | null = null
    try {
      const url = new URL(data)
      const parts = url.pathname.split('/')
      const idx = parts.indexOf('order')
      orderId = idx !== -1 ? parts[idx + 1] : null
    } catch {
      // not a URL — treat raw data as order id
      orderId = data.trim()
    }

    if (!orderId) {
      setErrorMsg('QR no reconocido')
      setState('error')
      return
    }

    const result = await scanQr(eventId, orderId)
    if (result.ok) {
      setOrder(result.order)
      setState('ready')
    } else {
      setErrorMsg(result.error)
      setState('error')
    }
  }, [eventId, stopCamera])

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
      handleQrData(code.data)
      return
    }

    rafRef.current = requestAnimationFrame(scan)
  }, [handleQrData])

  const startCamera = useCallback(async () => {
    setCameraError('')
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
      setCameraError('No se pudo acceder a la cámara. Verificá los permisos.')
      setState('idle')
    }
  }, [scan])

  const reset = useCallback(() => {
    stopCamera()
    setOrder(null)
    setErrorMsg('')
    setCameraError('')
    setState('idle')
  }, [stopCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <div className="w-full max-w-md mx-auto">
      <OrganizerToolHeading
        title="Escáner"
        description="Validá el código QR del comprador."
        prefix={
          <span
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900"
            aria-hidden
          >
            <QrCode size={20} strokeWidth={1.75} className="shrink-0" />
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
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-900">
            <QrCode size={30} strokeWidth={1.75} className="shrink-0" aria-hidden />
          </div>
          <div>
            <p className="text-base font-medium text-gray-900">Escanear QR de retiro</p>
            <p className="text-sm text-gray-400 mt-1">Activá la cámara para validar un pedido</p>
          </div>
          {cameraError && <p className="text-red-500 text-sm">{cameraError}</p>}
          <AccentButton onClick={startCamera} className="w-full py-3 hover:opacity-90">
            Activar cámara
          </AccentButton>
        </div>
      )}

      {/* Scanning */}
      {state === 'scanning' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="relative aspect-square w-full bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
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

      {/* Loading */}
      {state === 'loading' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
          <p className="text-sm text-gray-400">Verificando pedido…</p>
        </div>
      )}

      {/* Ready — order marked as delivered */}
      {state === 'ready' && order && (
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-green-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-sm">✓</div>
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Pedido finalizado</p>
                {order.customerName && (
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                )}
              </div>
              {order.orderNumber && (
                <span className="ml-auto text-xs font-mono text-gray-400">#{order.orderNumber}</span>
              )}
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
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
              <span className="text-lg font-medium text-gray-900">{formatPrice(order.total)}</span>
            </div>
            {order.paymentMethod && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">Pago</span>
                <span className="text-sm font-medium text-gray-900">{paymentLabels[order.paymentMethod] ?? order.paymentMethod}</span>
              </div>
            )}
          </div>
          <AccentButton onClick={reset} className="w-full py-3.5 hover:opacity-90">
            Escanear otro
          </AccentButton>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl">✕</div>
          <div>
            <p className="text-base font-medium text-gray-900">QR no válido</p>
            <p className="text-sm text-gray-400 mt-1">{errorMsg}</p>
          </div>
          <AccentButton onClick={reset} className="w-full py-3 hover:opacity-90">
            Intentar de nuevo
          </AccentButton>
        </div>
      )}
    </div>
  )
}
