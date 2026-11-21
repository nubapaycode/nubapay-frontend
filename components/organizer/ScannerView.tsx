'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import jsQR from 'jsqr'
import { AlertTriangle, Banknote, Camera, Check, Keyboard, Minus, PackageCheck, Plus, QrCode, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { confirmCashPayment, previewQr, scanQr } from '@/lib/organizerWorkspace'
import { extractOrderId } from '@/lib/scanner/extractOrderId'
import { cn, formatPrice } from '@/lib/utils'
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

type ScanState =
  | 'idle'
  | 'scanning'
  | 'reader'
  | 'loading'
  | 'cash_pending'
  | 'cash_confirming'
  | 'confirming'
  | 'confirm_loading'
  | 'ready'
  | 'partial'
  | 'already_scanned'
  | 'error'

/** Cómo se lee el QR: cámara del dispositivo o lector físico (USB/Bluetooth que "tipea" el código). */
type ScanMode = 'camera' | 'reader'

const SCAN_MODE_KEY = 'nubapay_scanner_mode'
function loadScanMode(): ScanMode {
  try {
    return window.localStorage.getItem(SCAN_MODE_KEY) === 'reader' ? 'reader' : 'camera'
  } catch {
    return 'camera'
  }
}

function saveScanMode(mode: ScanMode) {
  try {
    window.localStorage.setItem(SCAN_MODE_KEY, mode)
  } catch {
    // sin storage: el modo solo vale para esta sesión
  }
}

type ScanKind = 'tickets' | 'products' | 'mixed'

function scanKind(order: Order | null): ScanKind {
  const items = order?.items ?? []
  if (items.length > 0 && items.every(i => i.isTicket)) return 'tickets'
  if (items.some(i => i.isTicket)) return 'mixed'
  return 'products'
}

/** Las entradas se "usan"; los productos se "entregan". Un pedido mixto usa un texto neutro. */
const SCAN_COPY: Record<ScanKind, {
  prompt: string
  confirmAll: string
  confirmSome: (n: number) => string
  verified: string
  partial: string
  pendingNote: string
  alreadyDone: string
}> = {
  products: {
    prompt: '¿Qué entregás ahora?',
    confirmAll: 'Marcar entregados',
    confirmSome: n => `Marcar ${n} entregado${n === 1 ? '' : 's'}`,
    verified: 'Pedido verificado',
    partial: 'Entrega parcial registrada',
    pendingNote: 'Quedan productos pendientes. Podés volver a escanear este mismo QR más tarde para entregarlos.',
    alreadyDone: 'El pedido ya fue entregado',
  },
  tickets: {
    prompt: 'Entradas a usar',
    confirmAll: 'Marcar entradas como usadas',
    confirmSome: n => `Marcar ${n} entrada${n === 1 ? '' : 's'} como usada${n === 1 ? '' : 's'}`,
    verified: 'Entradas verificadas',
    partial: 'Uso parcial registrado',
    pendingNote: 'Quedan entradas sin usar. Podés volver a escanear este mismo QR más tarde para usarlas.',
    alreadyDone: 'Las entradas ya fueron usadas',
  },
  mixed: {
    prompt: 'Entradas a usar y productos a entregar',
    confirmAll: 'Confirmar',
    confirmSome: n => `Confirmar ${n}`,
    verified: 'Pedido verificado',
    partial: 'Registro parcial guardado',
    pendingNote: 'Quedan entradas o productos pendientes. Podés volver a escanear este mismo QR más tarde.',
    alreadyDone: 'El pedido ya fue completado',
  },
}

/** Etiquetas por línea: depende de si la línea es una entrada o un producto. */
function itemWording(item: { isTicket?: boolean; quantity: number }) {
  return item.isTicket
    ? { alreadyDone: item.quantity === 1 ? 'ya usada' : 'ya usadas', done: item.quantity === 1 ? 'Usada' : 'Usadas', doneLower: 'usadas' }
    : { alreadyDone: 'ya entregado', done: 'Entregado', doneLower: 'entregado' }
}

export function ScannerView({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const readerInputRef = useRef<HTMLInputElement>(null)
  const modeRef = useRef<ScanMode>('camera')

  const [state, setState] = useState<ScanState>('idle')
  const [order, setOrder] = useState<Order | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({})
  const [errorMsg, setErrorMsg] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [readerValue, setReaderValue] = useState('')
  const copy = SCAN_COPY[scanKind(order)]

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

    const orderId = extractOrderId(data)

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
      const awaitingCash = result.order.paymentMethod === 'cash' && result.order.paymentStatus !== 'approved'
      setState(awaitingCash ? 'cash_pending' : 'confirming')
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

  const confirmCashReceived = useCallback(async () => {
    if (!pendingOrderId) return
    setState('cash_confirming')
    const result = await confirmCashPayment(eventId, pendingOrderId)
    if (result.ok) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100])
      setOrder(result.order)
      setSelectedQty({})
      setState('confirming')
    } else {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(300)
      setErrorMsg(result.error)
      setState('error')
    }
  }, [eventId, pendingOrderId])

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
    modeRef.current = 'camera'
    saveScanMode('camera')
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

  const startReader = useCallback(() => {
    stopCamera()
    modeRef.current = 'reader'
    saveScanMode('reader')
    setCameraError('')
    setReaderValue('')
    setState('reader')
  }, [stopCamera])

  /** Vuelve a la pantalla inicial (elegir cámara o lector). */
  const reset = useCallback(() => {
    stopCamera()
    setOrder(null)
    setPendingOrderId(null)
    setSelectedQty({})
    setErrorMsg('')
    setCameraError('')
    setReaderValue('')
    setState('idle')
  }, [stopCamera])

  /** Deja todo listo para el próximo QR en el mismo modo (lector: de inmediato; cámara: pantalla inicial). */
  const next = useCallback(() => {
    if (modeRef.current === 'reader') {
      setOrder(null)
      setPendingOrderId(null)
      setSelectedQty({})
      setErrorMsg('')
      setReaderValue('')
      setState('reader')
    } else {
      reset()
    }
  }, [reset])

  const cancelScan = useCallback(() => {
    setOrder(null)
    setPendingOrderId(null)
    setSelectedQty({})
    if (modeRef.current === 'reader') startReader()
    else startCamera()
  }, [startCamera, startReader])

  const submitReader = useCallback(() => {
    const value = readerValue.trim()
    setReaderValue('')
    if (!value) return
    void handleQrData(value)
  }, [readerValue, handleQrData])

  useEffect(() => () => stopCamera(), [stopCamera])

  // Recordar el modo elegido la última vez (el lector físico suele quedar fijo en una PC de acceso).
  useEffect(() => {
    modeRef.current = loadScanMode()
  }, [])

  // En modo lector el input debe tener el foco siempre: el lector "teclea" donde esté el cursor.
  useEffect(() => {
    if (state === 'reader') readerInputRef.current?.focus()
  }, [state])

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
              <p className="text-sm text-gray-400 mt-1">Usá la cámara o un lector de QR físico para validar un pedido</p>
            </div>
            {cameraError && <p className="text-red-500 text-sm">{cameraError}</p>}
            <div className="flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={startCamera}
                style={organizerAccentFilledButtonStyle()}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-opacity hover:opacity-90"
              >
                <Camera size={16} strokeWidth={2} aria-hidden />
                Activar cámara
              </button>
              <button
                type="button"
                onClick={startReader}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-opacity hover:opacity-90"
              >
                <Keyboard size={16} strokeWidth={2} aria-hidden />
                Usar lector físico
              </button>
            </div>
          </div>
        )}

        {/* Reader — lector físico (USB/Bluetooth): escribe el código y envía Enter */}
        {state === 'reader' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-5 text-center">
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-900">
              <Keyboard size={30} strokeWidth={1.75} className="shrink-0" aria-hidden />
              <span
                className="absolute -right-1 -top-1 size-3 animate-pulse rounded-full"
                style={{ background: 'var(--organizer-accent, #C6FF00)' }}
                aria-hidden
              />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">Listo para escanear</p>
              <p className="text-sm text-gray-400 mt-1">Apuntá el lector al QR del comprador y disparalo</p>
            </div>
            <input
              ref={readerInputRef}
              type="text"
              value={readerValue}
              onChange={e => setReaderValue(e.target.value)}
              onKeyDown={e => {
                // La mayoría de los lectores cierran con Enter; algunos con Tab.
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  submitReader()
                }
              }}
              onBlur={e => {
                // Si el foco se pierde sin ir a otro control, recuperarlo para no perder lecturas.
                if (!e.relatedTarget) window.setTimeout(() => readerInputRef.current?.focus(), 0)
              }}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Código leído por el lector de QR"
              placeholder="El código aparece acá"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-center text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400">
              Si el lector no funciona, hacé clic en el campo y probá de nuevo. El lector debe estar en modo teclado (HID).
            </p>
            <button
              type="button"
              onClick={reset}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Cambiar a cámara
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

        {/* Cash pending — staff must confirm they physically received the money */}
        {(state === 'cash_pending' || state === 'cash_confirming') && order && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-amber-100 p-4">
              <OrderIdentity order={order} />
              <StatusChip tone="warning" icon={Banknote}>
                Pago en efectivo pendiente
              </StatusChip>
              <p className="text-sm text-gray-500">Debés recibir</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(order.total)}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void confirmCashReceived()}
                disabled={state === 'cash_confirming'}
                style={organizerAccentFilledButtonStyle()}
                className="w-full rounded-full py-3.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {state === 'cash_confirming' ? 'Confirmando…' : 'Ya lo recibí'}
              </button>
              <button
                type="button"
                onClick={cancelScan}
                disabled={state === 'cash_confirming'}
                className="w-full rounded-full border border-gray-200 py-3.5 text-sm font-medium text-gray-700 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Escanear otro
              </button>
            </div>
          </div>
        )}

        {/* Confirming — pick which products are being handed over now */}
        {(state === 'confirming' || state === 'confirm_loading') && order && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <OrderIdentity order={order} />
              <StatusChip tone="neutral" icon={PackageCheck}>
                {copy.prompt}
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
                            {redeemedQty}/{item.quantity} {itemWording(item).alreadyDone}
                          </span>
                        )}
                      </span>
                      {fullyRedeemed ? (
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{itemWording(item).done}</span>
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
                    ? copy.confirmAll
                    : copy.confirmSome(selectedCount)}
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
                {copy.verified}
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
              onClick={next}
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
                {copy.partial}
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
                          ({redeemedQty}/{item.quantity} {itemWording(item).doneLower})
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
              {copy.pendingNote}
            </p>
            <button
              type="button"
              onClick={next}
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
                {copy.alreadyDone}
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
              onClick={next}
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
              onClick={next}
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
