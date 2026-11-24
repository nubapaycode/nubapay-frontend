'use client'

import { buyBlockedMessage } from '@/lib/buyerAvailability'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { catalogPaths } from '@/lib/api/paths'
import { browserFetch } from '@/lib/browserFetch'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { formatEventDateLong } from '@/lib/eventDate'
import { saveOrder } from '@/lib/hooks/useOrderHistory'
import { cartItemsKey, clearPendingOrder, loadPendingOrder, pendingIdempotencyKey, savePendingOrder } from '@/lib/pendingOrder'
import { PURCHASE_COPY, itemsOf, limitSelection, selectionScope, storePath, type PurchaseKind } from '@/lib/purchaseKind'
import { computeCartTotals } from '@/lib/serviceFee'
import { clearTicketSelection, startTicketHold, useTicketSelection } from '@/lib/ticketSelection'
import { cn, formatPrice } from '@/lib/utils'
import type { Event } from '@/types'

import { WhatsAppOptIn } from './WhatsAppOptIn'
import { CARD_LOGO_METHOD_IDS, CardLogos, paymentMethods } from './paymentMethods'
import { TICKET_PAGE_BG } from './TicketCard'

interface TicketCheckoutViewProps {
  event: Event
  catalogSlug: string
  /** Métodos de pago configurados para el evento (ej. ['mp', 'sipago']). */
  availablePaymentMethods: string[]
  /** Entradas (por defecto) o parking: mismo checkout, otra lista y otros textos. */
  kind?: PurchaseKind
}

const MUTED = '#6B6B78'
const DANGER = '#DC2626'

export type BuyerField = 'name' | 'email' | 'emailConfirm' | 'phone'
export type BuyerValues = Record<BuyerField, string>
/** Datos de estacionamiento: solo se piden al comprar parking. El lugar queda atado a la patente; el DNI del titular es obligatorio y puede repetirse en varias compras. */
export type VehicleField = 'plate' | 'dni'
export type VehicleValues = Record<VehicleField, string>
type FormField = BuyerField | VehicleField

interface FieldDef<F extends FormField> {
  id: F
  label: string
  placeholder: string
  type?: string
  autoComplete: string
  inputMode?: 'email' | 'tel' | 'numeric'
  full?: boolean
  /** Muestra lo que se escribe en mayúsculas (patente). */
  uppercase?: boolean
}

const FIELDS: FieldDef<BuyerField>[] = [
  { id: 'name', label: 'Nombre y apellido', placeholder: 'Tu nombre y apellido', autoComplete: 'name', full: true },
  { id: 'email', label: 'Email', placeholder: 'Ingresá tu correo electrónico', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { id: 'emailConfirm', label: 'Repetir email', placeholder: 'Repetí tu correo electrónico', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { id: 'phone', label: 'Teléfono', placeholder: 'Tu teléfono', type: 'tel', autoComplete: 'tel', inputMode: 'tel', full: true },
]

const VEHICLE_FIELDS: FieldDef<VehicleField>[] = [
  { id: 'plate', label: 'Patente', placeholder: 'Ej. AB123CD o ABC123', autoComplete: 'off', uppercase: true },
  { id: 'dni', label: 'DNI del titular', placeholder: 'Sin puntos, ej. 30123456', autoComplete: 'off', inputMode: 'numeric' },
]

const EMPTY_VALUES: BuyerValues = { name: '', email: '', emailConfirm: '', phone: '' }
const EMPTY_VEHICLE: VehicleValues = { plate: '', dni: '' }

/** Patente en mayúsculas, sin espacios, puntos ni guiones: "ab 123 cd" → "AB123CD". */
export function normalizePlate(raw: string): string {
  return raw.replace(/[\s.-]/g, '').toUpperCase()
}

/** DNI solo con números (acepta puntos, espacios y guiones al escribir). */
export function normalizeDni(raw: string): string {
  return raw.replace(/[.\s-]/g, '')
}

/** Errores de los datos del estacionamiento; objeto vacío si todo es válido. Mismas reglas que el backend. */
export function validateVehicle(values: VehicleValues): Partial<Record<VehicleField, string>> {
  const errors: Partial<Record<VehicleField, string>> = {}
  const plate = normalizePlate(values.plate)
  if (!plate) errors.plate = 'Ingresá la patente del vehículo'
  else if (!/^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{5,8}$/.test(plate)) errors.plate = 'Ingresá una patente válida, ej. AB123CD o ABC123'
  // DNI obligatorio. No limita las compras: un mismo DNI puede reservar varios vehículos.
  const dni = normalizeDni(values.dni)
  if (!dni) errors.dni = 'Ingresá el DNI del titular'
  else if (!/^\d{7,8}$/.test(dni)) errors.dni = 'El DNI tiene que tener 7 u 8 números'
  return errors
}

/** Errores por campo de los datos del comprador; objeto vacío si todo es válido. */
export function validateBuyer(values: BuyerValues): Partial<Record<BuyerField, string>> {
  const errors: Partial<Record<BuyerField, string>> = {}
  const email = values.email.trim()
  if (!values.name.trim()) errors.name = 'Ingresá tu nombre y apellido'
  if (!email) errors.email = 'Ingresá tu email'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Ingresá un email válido'
  if (!values.emailConfirm.trim()) errors.emailConfirm = 'Repetí tu email'
  else if (values.emailConfirm.trim().toLowerCase() !== email.toLowerCase()) errors.emailConfirm = 'Los emails no coinciden'
  const phoneDigits = values.phone.replace(/\D/g, '')
  if (!phoneDigits) errors.phone = 'Ingresá tu teléfono'
  else if (phoneDigits.length < 8) errors.phone = 'Ingresá un teléfono válido'
  return errors
}

/** Errores del servidor que corresponden a los datos del vehículo: se muestran en el campo, no solo abajo. */
const PLATE_ERROR_CODES = ['parking_already_purchased', 'vehicle_data_required', 'invalid_vehicle_data']

function ErrorAlert({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="alert"
      className="mb-3 flex items-start gap-3 rounded-[14px] border px-3.5 py-3"
      style={{ background: '#FEF2F2', borderColor: 'rgba(220,38,38,0.25)' }}
    >
      <span
        className="mt-px flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: DANGER, color: '#fff' }}
        aria-hidden
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 3.5v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="7" cy="10.25" r="0.95" fill="currentColor" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-snug" style={{ color: '#991B1B' }}>
          No pudimos completar la compra
        </p>
        <p className="mt-0.5 text-[13px] leading-snug" style={{ color: '#B91C1C' }}>
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="-mr-1 -mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-red-100"
        style={{ color: '#B91C1C' }}
        aria-label="Cerrar aviso"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Hora actual que se actualiza cada segundo mientras `active`. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] bg-white p-5 md:p-7">
      <h2 className="mb-4 text-lg font-semibold tracking-tight md:text-xl" style={{ color: BUYER_COLORS.text }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function TicketCheckoutView({ event, catalogSlug, availablePaymentMethods, kind = 'ticket' }: TicketCheckoutViewProps) {
  const router = useRouter()
  const copy = PURCHASE_COPY[kind]
  const scope = selectionScope(catalogSlug, kind)
  const { ready, lines: storedLines, expiresAt } = useTicketSelection(scope)
  const lines = useMemo(() => limitSelection(storedLines, kind), [storedLines, kind])
  const now = useNow(expiresAt !== null)

  const [values, setValues] = useState<BuyerValues>(EMPTY_VALUES)
  // WhatsApp: solo si el organizador lo tiene activo. Va sin marcar: el comprador tiene que aceptarlo.
  const whatsappEnabled = event.whatsappEnabled ?? false
  const [whatsappOptIn, setWhatsappOptIn] = useState(false)
  const [vehicle, setVehicle] = useState<VehicleValues>(EMPTY_VEHICLE)
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({})
  const isParking = kind === 'parking'
  // Las entradas no se pagan en efectivo (el backend también lo rechaza).
  const methods = paymentMethods.filter(m => m.id !== 'cash' && availablePaymentMethods.includes(m.id))
  const [paymentMethod, setPaymentMethod] = useState(methods[0]?.id ?? '')
  const paymentsEnabled = event.paymentsEnabled
  const purchaseClosed = event.purchaseClosed ?? false
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const leavingRef = useRef(false)
  const precreateRef = useRef<Promise<string | null> | null>(null)

  const selectionKey = cartItemsKey(lines.map(line => ({ productId: line.ticketId, quantity: line.quantity })))

  // La orden queda pendiente apenas hay entradas elegidas, para que el cobro
  // se arme mientras el comprador escribe sus datos.
  useEffect(() => {
    if (!ready || lines.length === 0 || !paymentMethod || !paymentsEnabled) {
      precreateRef.current = null
      return
    }
    const existing = loadPendingOrder(catalogSlug, selectionKey, paymentMethod)
    if (existing) {
      precreateRef.current = Promise.resolve(existing.orderId)
      return
    }

    let cancelled = false
    const items = lines.map(line => ({ ticket_id: line.ticketId, quantity: line.quantity }))
    const promise = (async (): Promise<string | null> => {
      try {
        const res = await browserFetch(catalogPaths.createOrder(catalogSlug), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Branded-Host': window.location.host },
          body: JSON.stringify({
            customer_name: '',
            customer_email: '',
            payment_method: paymentMethod,
            items,
            idempotency_key: pendingIdempotencyKey(catalogSlug, selectionKey, paymentMethod),
          }),
        })
        if (!res.ok || cancelled) return null
        const data = await res.json()
        if (cancelled || !data.order_id) return null
        savePendingOrder({
          orderId: data.order_id,
          slug: catalogSlug,
          itemsKey: selectionKey,
          createdAt: Date.now(),
          paymentMethod,
        })
        return data.order_id as string
      } catch {
        return null
      }
    })()
    precreateRef.current = promise
    return () => {
      cancelled = true
    }
  }, [ready, lines, selectionKey, paymentMethod, paymentsEnabled, catalogSlug])

  // Entrada directa a esta página (sin pasar por "Comprar"): arranca el tiempo acá.
  useEffect(() => {
    if (ready && lines.length > 0 && expiresAt === null) startTicketHold(scope)
  }, [ready, lines.length, expiresAt, scope])

  const selected = lines.flatMap(line => {
    const ticket = itemsOf(event, kind).find(t => t.id === line.ticketId)
    return ticket ? [{ ticket, quantity: line.quantity }] : []
  })
  const { ticketsSubtotal, serviceFee, total } = computeCartTotals(
    selected.map(s => ({ kind: 'ticket' as const, price: s.ticket.price, quantity: s.quantity })),
    event.serviceFeePercent,
  )
  const remainingMs = expiresAt === null ? null : expiresAt - now
  const expired = remainingMs !== null && remainingMs <= 0
  const lowTime = remainingMs !== null && remainingMs < 2 * 60 * 1000
  const venue = event.venue.trim()
  const dateLabel = formatEventDateLong(event.date)
  const backHref = storePath(catalogSlug, kind)

  const restart = () => {
    clearTicketSelection()
    router.push(backHref)
  }

  const handleChange = (field: FormField, value: string) => {
    if (field === 'plate' || field === 'dni') setVehicle(v => ({ ...v, [field]: value }))
    else setValues(v => ({ ...v, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
    if (submitError) setSubmitError('')
  }

  /** Muestra el error del servidor; si es del vehículo, también lo marca en el campo (patente o DNI) y lo enfoca. */
  const showServerError = (body: { error?: string; code?: string }, fallback: string) => {
    const message = body.error ?? fallback
    setSubmitError(message)
    if (body.code === 'invalid_whatsapp_phone') {
      // El teléfono es el mismo campo de siempre: se marca ahí para corregirlo.
      setErrors(e => ({ ...e, phone: message }))
      const input = document.getElementById('buyer-phone')
      input?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      input?.focus({ preventScroll: true })
      return
    }
    if (isParking && body.code && PLATE_ERROR_CODES.includes(body.code)) {
      // Los mensajes del DNI lo nombran; el resto (patente repetida, inválida, faltante) es de la patente.
      const field: VehicleField = /\bDNI\b/.test(message) ? 'dni' : 'plate'
      setErrors(e => ({ ...e, [field]: message }))
      const input = document.getElementById(`buyer-${field}`)
      input?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      input?.focus({ preventScroll: true })
    }
  }

  const handlePay = async () => {
    if (!paymentsEnabled || expired || selected.length === 0) return
    const found: Partial<Record<FormField, string>> = {
      ...validateBuyer(values),
      ...(isParking ? validateVehicle(vehicle) : {}),
    }
    setErrors(found)
    const firstInvalid = [...FIELDS, ...(isParking ? VEHICLE_FIELDS : [])].find(f => found[f.id])
    if (firstInvalid) {
      document.getElementById(`buyer-${firstInvalid.id}`)?.focus()
      return
    }
    if (!paymentMethod) {
      setSubmitError('Elegí un medio de pago')
      return
    }

    setLoading(true)
    setSubmitError('')
    let navigating = false
    try {
      const items = selected.map(s => ({ ticket_id: s.ticket.id, quantity: s.quantity }))
      const vehicleData = isParking
        ? { vehicle_plate: normalizePlate(vehicle.plate), customer_dni: normalizeDni(vehicle.dni) }
        : {}
      // Siempre se manda el valor actual: así destildar la casilla también quita un consentimiento anterior.
      const whatsappData = whatsappEnabled ? { whatsapp_opt_in: whatsappOptIn } : {}
      let orderId = loadPendingOrder(catalogSlug, selectionKey, paymentMethod)?.orderId ?? null
      if (!orderId && precreateRef.current) {
        await precreateRef.current
        orderId = loadPendingOrder(catalogSlug, selectionKey, paymentMethod)?.orderId ?? null
      }
      let orderNumber: number | null = null
      let checkoutUrl: string | null = null

      if (orderId) {
        const res = await browserFetch(catalogPaths.updateOrderCustomer(orderId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Branded-Host': window.location.host },
          body: JSON.stringify({
            customer_name: values.name.trim(),
            customer_email: values.email.trim(),
            customer_phone: values.phone.trim(),
            ...vehicleData,
            ...whatsappData,
          }),
        })
        if (!res.ok && res.status !== 409) {
          if (res.status === 404) {
            clearPendingOrder()
            orderId = null
          } else {
            const body = await res.json().catch(() => ({}))
            showServerError(body, 'No se pudo confirmar la compra. Intentá de nuevo.')
            return
          }
        }
      }

      if (!orderId) {
        const res = await browserFetch(catalogPaths.createOrder(catalogSlug), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Branded-Host': window.location.host },
          body: JSON.stringify({
            customer_name: values.name.trim(),
            customer_email: values.email.trim(),
            customer_phone: values.phone.trim(),
            ...vehicleData,
            ...whatsappData,
            payment_method: paymentMethod,
            items,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          showServerError(body, 'No se pudo crear la compra. Intentá de nuevo.')
          return
        }
        const data = await res.json()
        orderId = data.order_id as string
        orderNumber = data.order_number ?? null
        checkoutUrl = data.checkout_url ?? null
      }

      saveOrder({
        orderId,
        orderNumber,
        slug: catalogSlug,
        total,
        createdAt: new Date().toISOString(),
      })
      clearPendingOrder()
      leavingRef.current = true
      clearTicketSelection()
      navigating = true
      if (checkoutUrl) window.location.assign(checkoutUrl)
      else router.push(buyerFlowPath(event.id, { catalogSlug, path: `order/${orderId}` }))
    } catch {
      setSubmitError('Error de conexión. Revisá tu internet e intentá de nuevo.')
    } finally {
      if (!navigating) setLoading(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: '100svh', background: TICKET_PAGE_BG, fontFamily: BUYER_FONT }}>
      <header
        className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"
        style={{ borderColor: BUYER_COLORS.border }}
      >
        <div className="mx-auto flex h-[60px] max-w-3xl items-center gap-3 px-4 md:px-6">
          <Link
            href={backHref}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
            aria-label={copy.backLabel}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="flex-1 text-[17px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            Comprando
          </h1>
          {remainingMs !== null && !expired && (
            <span
              className="rounded-full px-3 py-1 text-sm font-semibold tabular-nums"
              style={{
                background: lowTime ? 'rgba(220,38,38,0.1)' : BUYER_COLORS.subtleFill,
                color: lowTime ? DANGER : BUYER_COLORS.text,
              }}
              aria-hidden
            >
              {formatCountdown(remainingMs)}
            </span>
          )}
        </div>
      </header>
      {children}
    </div>
  )

  if (!ready) return shell(null)

  if (!leavingRef.current && (selected.length === 0 || expired)) {
    return shell(
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex flex-col items-center rounded-[20px] bg-white px-6 py-14 text-center">
          <p className="mb-1 text-[17px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            {expired ? 'Se terminó el tiempo para comprar' : copy.noSelectionTitle}
          </p>
          <p className="mb-6 max-w-sm text-sm" style={{ color: MUTED }}>
            {expired ? copy.expiredBody : copy.noSelectionBody}
          </p>
          <button
            type="button"
            onClick={restart}
            className="h-12 rounded-full px-8 text-[15px] font-semibold"
            style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
          >
            {copy.chooseAgain}
          </button>
        </div>
      </div>,
    )
  }

  const inputBase =
    'w-full rounded-[12px] border-[1.5px] bg-white px-4 py-3 text-[16px] outline-none transition-colors focus:border-[#0A0A0F]'

  const renderField = <F extends FormField>(field: FieldDef<F>, value: string) => {
    const error = errors[field.id]
    return (
      <div key={field.id} className={cn(field.full && 'md:col-span-2')}>
        <label htmlFor={`buyer-${field.id}`} className="mb-1.5 block text-sm font-semibold" style={{ color: BUYER_COLORS.text }}>
          {field.label}
        </label>
        <input
          id={`buyer-${field.id}`}
          type={field.type ?? 'text'}
          inputMode={field.inputMode}
          autoComplete={field.autoComplete}
          autoCapitalize={field.uppercase ? 'characters' : undefined}
          value={value}
          onChange={e => handleChange(field.id, e.target.value)}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `buyer-${field.id}-error` : undefined}
          className={cn(inputBase, field.uppercase && 'uppercase placeholder:normal-case')}
          style={{ borderColor: error ? DANGER : 'rgba(0,0,0,0.12)', color: BUYER_COLORS.text, fontFamily: BUYER_FONT }}
        />
        {error && (
          <p id={`buyer-${field.id}-error`} className="mt-1 text-[13px]" style={{ color: DANGER }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return shell(
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-black/10 border-t-[#0A0A0F] motion-reduce:animate-none" />
          <p className="text-sm font-semibold" style={{ color: BUYER_COLORS.text }}>
            Procesando tu compra…
          </p>
        </div>
      )}

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-44 pt-5 md:gap-5 md:px-6 md:pt-8">
        <Section title="Tu compra">
          {/* Desktop: tabla con el evento a la izquierda de lo elegido */}
          <table className="hidden w-full text-left text-sm md:table" style={{ color: BUYER_COLORS.text }}>
            <thead>
              <tr className="border-b text-[13px]" style={{ borderColor: BUYER_COLORS.border, color: MUTED }}>
                <th className="pb-3 pr-4 font-semibold">Evento</th>
                <th className="pb-3 pr-4 font-semibold">{copy.tableHeader}</th>
                <th className="pb-3 pr-4 text-right font-semibold">Precio</th>
                <th className="pb-3 pr-4 text-center font-semibold">Cantidad</th>
                <th className="pb-3 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selected.map(({ ticket, quantity }, i) => (
                <tr key={ticket.id} className="border-b align-top" style={{ borderColor: BUYER_COLORS.border }}>
                  {i === 0 && (
                    <td rowSpan={selected.length} className="py-4 pr-6">
                      <p className="font-semibold">{event.name}</p>
                      {venue && <p className="mt-0.5" style={{ color: MUTED }}>{venue}</p>}
                      {dateLabel && <p className="mt-0.5" style={{ color: MUTED }}>{dateLabel}</p>}
                    </td>
                  )}
                  <td className="py-4 pr-4 font-semibold">{ticket.name}</td>
                  <td className="py-4 pr-4 text-right tabular-nums">{formatPrice(ticket.price)}</td>
                  <td className="py-4 pr-4 text-center tabular-nums">{quantity}</td>
                  <td className="py-4 text-right font-semibold tabular-nums">{formatPrice(ticket.price * quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: evento arriba y una fila por entrada */}
          <div className="md:hidden" style={{ color: BUYER_COLORS.text }}>
            <div className="border-b pb-4" style={{ borderColor: BUYER_COLORS.border }}>
              <p className="text-[15px] font-semibold">{event.name}</p>
              {venue && <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{venue}</p>}
              {dateLabel && <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{dateLabel}</p>}
            </div>
            <ul>
              {selected.map(({ ticket, quantity }) => (
                <li
                  key={ticket.id}
                  className="flex items-start justify-between gap-4 border-b py-3"
                  style={{ borderColor: BUYER_COLORS.border }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{ticket.name}</p>
                    <p className="text-[13px] tabular-nums" style={{ color: MUTED }}>
                      {quantity} × {formatPrice(ticket.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatPrice(ticket.price * quantity)}</p>
                </li>
              ))}
            </ul>
          </div>

          <dl className="ml-auto mt-4 flex max-w-xs flex-col gap-1.5 text-sm" style={{ color: BUYER_COLORS.text }}>
            <div className="flex justify-between gap-6">
              <dt style={{ color: MUTED }}>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(ticketsSubtotal)}</dd>
            </div>
            {serviceFee > 0 && (
              <div className="flex justify-between gap-6">
                <dt style={{ color: MUTED }}>Costo de servicio</dt>
                <dd className="tabular-nums">{formatPrice(serviceFee)}</dd>
              </div>
            )}
            <div className="mt-1 flex justify-between gap-6 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(total)}</dd>
            </div>
          </dl>
        </Section>

        {remainingMs !== null && (
          <div
            className="flex items-center gap-4 rounded-[20px] px-5 py-4"
            style={{ background: lowTime ? 'rgba(220,38,38,0.08)' : BUYER_COLORS.text, color: lowTime ? DANGER : '#fff' }}
            role="timer"
          >
            <span className="text-[28px] font-semibold leading-none tabular-nums md:text-[32px]">
              {formatCountdown(remainingMs)}
            </span>
            <span className="text-sm leading-snug md:text-[15px]">
              Tenés 10 minutos para realizar la compra.
            </span>
          </div>
        )}

        <Section title="Datos del comprador">
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map(field => renderField(field, values[field.id]))}
          </div>
          <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
            {copy.emailNote}
          </p>
          {whatsappEnabled && (
            <div className="mt-4">
              <WhatsAppOptIn checked={whatsappOptIn} onChange={setWhatsappOptIn} hint="Te lo mandamos al teléfono de arriba, además del email." />
            </div>
          )}
        </Section>

        {isParking && (
          <Section title="Datos de estacionamiento">
            <div className="grid gap-4 md:grid-cols-2">
              {VEHICLE_FIELDS.map(field => renderField(field, vehicle[field.id]))}
            </div>
            <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
              El lugar queda a nombre de esta patente: se permite un solo lugar por vehículo.
            </p>
          </Section>
        )}

        <Section title="Datos de pago">
          {methods.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              {copy.noPaymentMethods}
            </p>
          ) : (
            <div className="grid gap-2.5" role="radiogroup" aria-label="Medio de pago">
              {methods.map(method => {
                const checked = paymentMethod === method.id
                return (
                  <label
                    key={method.id}
                    className="flex cursor-pointer items-center gap-4 rounded-[16px] border-[1.5px] px-4 py-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                    style={{ borderColor: checked ? BUYER_COLORS.text : 'rgba(0,0,0,0.12)' }}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.id}
                      checked={checked}
                      onChange={() => { setPaymentMethod(method.id); setSubmitError('') }}
                      className="sr-only"
                    />
                    <span
                      className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: BUYER_COLORS.subtleFill }}
                    >
                      {method.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text }}>
                        {method.label}
                      </span>
                      {method.sub && (
                        <span className="mt-0.5 block text-[13px]" style={{ color: MUTED }}>{method.sub}</span>
                      )}
                      {CARD_LOGO_METHOD_IDS.includes(method.id) && <CardLogos methodId={method.id} />}
                    </span>
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2"
                      style={{ borderColor: checked ? BUYER_COLORS.text : 'rgba(0,0,0,0.2)' }}
                      aria-hidden
                    >
                      {checked && <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUYER_COLORS.text }} />}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </Section>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-white px-4 pt-3 md:px-6"
        style={{ borderColor: BUYER_COLORS.border, paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        <div className="mx-auto max-w-3xl">
          {!paymentsEnabled ? (
            <p className="mb-2 text-center text-[13px] font-semibold" style={{ color: DANGER }}>
              {buyBlockedMessage(purchaseClosed, 'pay')}
            </p>
          ) : submitError ? (
            <ErrorAlert message={submitError} onClose={() => setSubmitError('')} />
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px]" style={{ color: MUTED }}>Total</p>
              <p className="text-xl font-semibold tabular-nums tracking-tight" style={{ color: BUYER_COLORS.text }}>
                {formatPrice(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading || !paymentsEnabled || methods.length === 0}
              className="h-[52px] flex-shrink-0 rounded-full px-10 text-base font-semibold tracking-tight transition-opacity active:opacity-85 disabled:opacity-40 md:px-14"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              Pagar
            </button>
          </div>
        </div>
      </div>
    </>,
  )
}
