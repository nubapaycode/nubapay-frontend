'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import jsQR from 'jsqr'
import { AlertTriangle, Camera, Check, Minus, PackageCheck, Plus, QrCode, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { previewQr, scanQr } from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'

type ChipTone = 'neutral' | 'success' | 'warning' | 'danger'

const CHIP_ICON_TONE: Record<ChipTone, string> = {
  neutral: 'bg-gray-100 text-gray-500',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-500',
}

const CHIP_LABEL_TONE: Record<ChipTone, string> = {
  neutral: 'text-gray-500',
  success: 'text-green-700',
  warning: 'text-amber-700',
  danger: 'text-red-600',
}

function StatusChip({ tone, icon: Icon, children }: { tone: ChipTone; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', CHIP_ICON_TONE[tone])}>
        <Icon size={15} strokeWidth={2} aria-hidden />
      </span>
      <p className={cn('text-xs font-medium uppercase tracking-wider', CHIP_LABEL_TONE[tone])}>{children}</p>
    </div>
  )
}

function OrderIdentity({ order }: { order: Order }) {
  const number = order.orderNumber != null ? `#${order.orderNumber}` : null
  const name = order.customerName?.trim() || null
  if (!number && !name) return null
  return (
    <div className="mb-3 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
      {number && <span className="text-sm font-semibold tracking-tight text-gray-900">{number}</span>}
      {name && <span className="min-w-0 truncate text-sm text-gray-400">{name}</span>}
    </div>
  )
}

type ScanState = 'idle' | 'scanning' | 'loading' | 'confirming' | 'confirm_loading' | 'ready' | 'partial' | 'already_scanned' | 'error'

export function ScannerView({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<ScanState>('idle')
  const [order, setOrder] = useState<Order | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [errorMsg, setErrorMsg] = useState('')
  const [cameraError, setCameraError] = useState('')

  const incQty = useCallback((id: string, max: number) => {
    setSelectedQty(prev => {
      const next = Math.min(max, (prev[id] ?? 0) + 1)
      return { ...prev, [id]: next }
    })
  }, [])

  const decQty = useCallback((id: string) => {
    setSelectedQty(prev => {
      const next = Math.max(0, (prev[id] ?? 0) - 1)
      return { ...prev, [id]: next }
    })
  }, [])

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

    const result = await previewQr(eventId, orderId)
    if (result.ok) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100)
      setOrder(result.order)
      setPendingOrderId(orderId)
      setSelectedQty({})
      setState('confirming')
    } else if (result.alreadyScanned) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
      setOrder(result.order ?? null)
      setState('already_scanned')
    } else {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(300)
      setErrorMsg(result.error)
      setState('error')
    }
  }, [eventId, stopCamera])

  const confirmScan = useCallback(async () => {
    const itemQuantities = Object.fromEntries(
      Object.entries(selectedQty).filter(([, qty]) => qty > 0),
    )
    if (!pendingOrderId || Object.keys(itemQuantities).length === 0) return
    setState('confirm_loading')
    const result = await scanQr(eventId, pendingOrderId, itemQuantities)
    if (result.ok) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100])
      setOrder(result.order)
      setState(result.order.status === 'delivered' ? 'ready' : 'partial')
    } else if (result.alreadyScanned) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
      setOrder(result.order ?? null)
      setState('already_scanned')
    } else {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(300)
      setErrorMsg(result.error)
      setState('error')
    }
  }, [eventId, pendingOrderId, selectedQty])

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
    setPendingOrderId(null)
    setSelectedQty({})
    setErrorMsg('')
    setCameraError('')
    setState('idle')
  }, [stopCamera])

  const cancelScan = useCallback(() => {
    setOrder(null)
    setPendingOrderId(null)
    setSelectedQty({})
    startCamera()
  }, [startCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  const selectedCount = Object.values(selectedQty).reduce((sum, qty) => sum + qty, 0)

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

      <div aria-live="polite">
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
            <button
              type="button"
              onClick={startCamera}
              style={organizerAccentFilledButtonStyle()}
              className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-opacity hover:opacity-90"
            >
              <Camera size={16} strokeWidth={2} aria-hidden />
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 relative overflow-hidden">
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                  <span
                    className="scanner-sweep absolute inset-x-1 top-0 h-0.5 rounded-full"
                    style={{
                      background: 'var(--organizer-accent, #C6FF00)',
                      boxShadow: '0 0 12px 2px var(--organizer-accent, #C6FF00)',
                    }}
                    aria-hidden
                  />
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

        {/* Confirming — pick which products are being handed over now */}
        {(state === 'confirming' || state === 'confirm_loading') && order && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <OrderIdentity order={order} />
              <StatusChip tone="neutral" icon={PackageCheck}>
                ¿Qué entregás ahora?
              </StatusChip>
              <div className="flex flex-col gap-1">
                {order.items.map((item, i) => {
                  const id = item.id ?? String(i)
                  const redeemedQty = item.redeemedQuantity ?? 0
                  const remaining = item.quantity - redeemedQty
                  const fullyRedeemed = remaining <= 0
                  const qty = selectedQty[id] ?? 0
                  return (
                    <div
                      key={id}
                      className={cn('flex items-center gap-3 rounded-xl px-2.5 py-2.5', fullyRedeemed && 'opacity-60')}
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                        {item.quantity}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={cn('block text-sm', fullyRedeemed ? 'text-gray-400 line-through' : 'text-gray-800')}>
                          {item.name}
                        </span>
                        {redeemedQty > 0 && !fullyRedeemed && (
                          <span className="block text-[10px] font-medium text-amber-600 uppercase tracking-wide">
                            {redeemedQty}/{item.quantity} ya entregado
                          </span>
                        )}
                      </span>
                      {fullyRedeemed ? (
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Entregado</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Restar ${item.name}`}
                            onClick={() => decQty(id)}
                            disabled={qty <= 0 || state === 'confirm_loading'}
                            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors active:bg-gray-100 disabled:opacity-30"
                          >
                            <Minus size={13} strokeWidth={2.5} aria-hidden />
                          </button>
                          <span className="w-5 shrink-0 text-center text-sm font-semibold text-gray-900">{qty}</span>
                          <button
                            type="button"
                            aria-label={`Sumar ${item.name}`}
                            onClick={() => incQty(id, remaining)}
                            disabled={qty >= remaining || state === 'confirm_loading'}
                            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors active:bg-gray-100 disabled:opacity-30"
                          >
                            <Plus size={13} strokeWidth={2.5} aria-hidden />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={confirmScan}
                disabled={state === 'confirm_loading' || selectedCount === 0}
                style={organizerAccentFilledButtonStyle()}
                className="w-full rounded-full py-3.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {state === 'confirm_loading'
                  ? 'Confirmando…'
                  : selectedCount === 0
                    ? 'Marcar entregados'
                    : `Marcar ${selectedCount} entregado${selectedCount === 1 ? '' : 's'}`}
              </button>
              <button
                type="button"
                onClick={cancelScan}
                disabled={state === 'confirm_loading'}
                className="w-full rounded-full border border-gray-200 py-3.5 text-sm font-medium text-gray-700 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Ready — order fully delivered */}
        {state === 'ready' && order && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-green-100 p-4">
              <OrderIdentity order={order} />
              <StatusChip tone="success" icon={Check}>
                Pedido verificado
              </StatusChip>
              <div className="flex flex-col gap-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">{item.quantity}</span>
                    <span className="text-sm text-gray-800">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              style={organizerAccentFilledButtonStyle()}
              className="w-full rounded-full py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
            >
              Escanear otro
            </button>
          </div>
        )}

        {/* Partial — some products delivered now, others left for a later scan */}
        {state === 'partial' && order && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-amber-100 p-4">
              <OrderIdentity order={order} />
              <StatusChip tone="warning" icon={PackageCheck}>
                Entrega parcial registrada
              </StatusChip>
              <div className="flex flex-col gap-2">
                {order.items.map((item, i) => {
                  const redeemedQty = item.redeemedQuantity ?? 0
                  const fullyRedeemed = redeemedQty >= item.quantity
                  const partiallyRedeemed = redeemedQty > 0 && !fullyRedeemed
                  return (
                    <div key={item.id ?? i} className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                          fullyRedeemed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {fullyRedeemed ? <Check size={11} strokeWidth={3} aria-hidden /> : item.quantity - redeemedQty}
                      </span>
                      <span className={cn('text-sm', fullyRedeemed ? 'text-gray-800' : 'text-gray-400')}>{item.name}</span>
                      {partiallyRedeemed && (
                        <span className="text-[10px] font-medium text-gray-400">
                          ({redeemedQty}/{item.quantity} entregado)
                        </span>
                      )}
                      {!fullyRedeemed && (
                        <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Pendiente</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center px-2">
              Quedan productos pendientes. Podés volver a escanear este mismo QR más tarde para entregarlos.
            </p>
            <button
              type="button"
              onClick={reset}
              style={organizerAccentFilledButtonStyle()}
              className="w-full rounded-full py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
            >
              Escanear otro
            </button>
          </div>
        )}

        {/* Already scanned */}
        {state === 'already_scanned' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-amber-200 p-4">
              {order && <OrderIdentity order={order} />}
              <StatusChip tone="warning" icon={AlertTriangle}>
                El pedido ya fue entregado
              </StatusChip>
              {order && (
                <div className="flex flex-col gap-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">{item.quantity}</span>
                      <span className="text-sm text-gray-800">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={reset}
              style={organizerAccentFilledButtonStyle()}
              className="w-full rounded-full py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
            >
              Escanear otro
            </button>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <X size={22} strokeWidth={2.25} aria-hidden />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">{errorMsg || 'QR no válido'}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
