'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { catalogPaths } from '@/lib/api/paths'
import { browserFetch } from '@/lib/browserFetch'
import { buyerFlowPath, ticketsPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { formatEventDateLong } from '@/lib/eventDate'
import { saveOrder } from '@/lib/hooks/useOrderHistory'
import { computeCartTotals } from '@/lib/serviceFee'
import { clearTicketSelection, startTicketHold, useTicketSelection } from '@/lib/ticketSelection'
import { cn, formatPrice } from '@/lib/utils'
import type { Event } from '@/types'

import { SIPAGO_CARD_LOGOS, paymentMethods } from './paymentMethods'
import { TICKET_PAGE_BG } from './TicketCard'

interface TicketCheckoutViewProps {
  event: Event
  catalogSlug: string
  /** Métodos de pago configurados para el evento (ej. ['mp', 'sipago']). */
  availablePaymentMethods: string[]
}

const MUTED = '#6B6B78'
const DANGER = '#DC2626'

export type BuyerField = 'name' | 'email' | 'emailConfirm' | 'phone' | 'document'
export type BuyerValues = Record<BuyerField, string>

const FIELDS: {
  id: BuyerField
  label: string
  placeholder: string
  type?: string
  autoComplete: string
  inputMode?: 'email' | 'tel'
  full?: boolean
}[] = [
  { id: 'name', label: 'Nombre y apellido', placeholder: 'Como figura en tu documento', autoComplete: 'name', full: true },
  { id: 'email', label: 'Email', placeholder: 'Ingresá tu correo electrónico', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { id: 'emailConfirm', label: 'Repetir email', placeholder: 'Repetí tu correo electrónico', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { id: 'phone', label: 'Teléfono', placeholder: 'Tu teléfono', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  { id: 'document', label: 'DNI o pasaporte', placeholder: 'Ingresá tu DNI o pasaporte', autoComplete: 'off' },
]

const EMPTY_VALUES: BuyerValues = { name: '', email: '', emailConfirm: '', phone: '', document: '' }

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
  const documentId = values.document.replace(/[^0-9a-z]/gi, '')
  if (!documentId) errors.document = 'Ingresá tu DNI o pasaporte'
  else if (documentId.length < 6) errors.document = 'Ingresá un DNI o pasaporte válido'
  return errors
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
      <h2 className="mb-4 text-lg font-bold tracking-tight md:text-xl" style={{ color: BUYER_COLORS.text }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function TicketCheckoutView({ event, catalogSlug, availablePaymentMethods }: TicketCheckoutViewProps) {
  const router = useRouter()
  const { ready, lines, expiresAt } = useTicketSelection(catalogSlug)
  const now = useNow(expiresAt !== null)

  const [values, setValues] = useState<BuyerValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<Partial<Record<BuyerField, string>>>({})
  // Las entradas no se pagan en efectivo (el backend también lo rechaza).
  const methods = paymentMethods.filter(m => m.id !== 'cash' && availablePaymentMethods.includes(m.id))
  const [paymentMethod, setPaymentMethod] = useState(methods[0]?.id ?? '')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  // Entrada directa a esta página (sin pasar por "Comprar"): arranca el tiempo acá.
  useEffect(() => {
    if (ready && lines.length > 0 && expiresAt === null) startTicketHold(catalogSlug)
  }, [ready, lines.length, expiresAt, catalogSlug])

  const selected = lines.flatMap(line => {
    const ticket = event.tickets.find(t => t.id === line.ticketId)
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
  const backHref = ticketsPath(catalogSlug)
  const paymentsEnabled = event.paymentsEnabled

  const restart = () => {
    clearTicketSelection()
    router.push(backHref)
  }

  const handleChange = (field: BuyerField, value: string) => {
    setValues(v => ({ ...v, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
    if (submitError) setSubmitError('')
  }

  const handlePay = async () => {
    if (!paymentsEnabled || expired || selected.length === 0) return
    const found = validateBuyer(values)
    setErrors(found)
    const firstInvalid = FIELDS.find(f => found[f.id])
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
      const res = await browserFetch(catalogPaths.createOrder(catalogSlug), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Branded-Host': window.location.host },
        body: JSON.stringify({
          customer_name: values.name.trim(),
          customer_email: values.email.trim(),
          customer_phone: values.phone.trim(),
          customer_document: values.document.trim(),
          payment_method: paymentMethod,
          items: selected.map(s => ({ ticket_id: s.ticket.id, quantity: s.quantity })),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setSubmitError(body.error ?? 'No se pudo crear la compra. Intentá de nuevo.')
        return
      }
      const data = await res.json()
      const orderId = data.order_id as string
      saveOrder({
        orderId,
        orderNumber: data.order_number ?? null,
        slug: catalogSlug,
        total,
        createdAt: new Date().toISOString(),
      })
      clearTicketSelection()
      navigating = true
      if (data.checkout_url) window.location.assign(data.checkout_url)
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
            aria-label="Volver a las entradas"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="flex-1 text-[17px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            Comprando
          </h1>
          {remainingMs !== null && !expired && (
            <span
              className="rounded-full px-3 py-1 text-sm font-bold tabular-nums"
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

  if (selected.length === 0 || expired) {
    return shell(
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex flex-col items-center rounded-[20px] bg-white px-6 py-14 text-center">
          <p className="mb-1 text-[17px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            {expired ? 'Se terminó el tiempo para comprar' : 'No elegiste entradas'}
          </p>
          <p className="mb-6 max-w-sm text-sm" style={{ color: MUTED }}>
            {expired
              ? 'Pasaron los 10 minutos para completar la compra. Volvé a elegir tus entradas para empezar de nuevo.'
              : 'Elegí las entradas que querés comprar y volvé a esta página.'}
          </p>
          <button
            type="button"
            onClick={restart}
            className="h-12 rounded-full px-8 text-[15px] font-bold"
            style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
          >
            Elegir entradas
          </button>
        </div>
      </div>,
    )
  }

  const inputBase =
    'w-full rounded-[12px] border-[1.5px] bg-white px-4 py-3 text-[16px] outline-none transition-colors focus:border-[#0A0A0F]'

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
          {/* Desktop: tabla con el evento a la izquierda de las entradas elegidas */}
          <table className="hidden w-full text-left text-sm md:table" style={{ color: BUYER_COLORS.text }}>
            <thead>
              <tr className="border-b text-[13px]" style={{ borderColor: BUYER_COLORS.border, color: MUTED }}>
                <th className="pb-3 pr-4 font-medium">Evento</th>
                <th className="pb-3 pr-4 font-medium">Entrada</th>
                <th className="pb-3 pr-4 text-right font-medium">Precio</th>
                <th className="pb-3 pr-4 text-center font-medium">Cantidad</th>
                <th className="pb-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selected.map(({ ticket, quantity }, i) => (
                <tr key={ticket.id} className="border-b align-top" style={{ borderColor: BUYER_COLORS.border }}>
                  {i === 0 && (
                    <td rowSpan={selected.length} className="py-4 pr-6">
                      <p className="font-bold">{event.name}</p>
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
              <p className="text-[15px] font-bold">{event.name}</p>
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
            <div className="mt-1 flex justify-between gap-6 text-base font-bold">
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
            <span className="text-[28px] font-bold leading-none tabular-nums md:text-[32px]">
              {formatCountdown(remainingMs)}
            </span>
            <span className="text-sm leading-snug md:text-[15px]">
              Tenés 10 minutos para realizar la compra.
            </span>
          </div>
        )}

        <Section title="Datos del comprador">
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map(field => {
              const error = errors[field.id]
              return (
                <div key={field.id} className={cn(field.full && 'md:col-span-2')}>
                  <label
                    htmlFor={`buyer-${field.id}`}
                    className="mb-1.5 block text-sm font-semibold"
                    style={{ color: BUYER_COLORS.text }}
                  >
                    {field.label}
                  </label>
                  <input
                    id={`buyer-${field.id}`}
                    type={field.type ?? 'text'}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    value={values[field.id]}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `buyer-${field.id}-error` : undefined}
                    className={inputBase}
                    style={{ borderColor: error ? DANGER : 'rgba(0,0,0,0.12)', color: BUYER_COLORS.text, fontFamily: BUYER_FONT }}
                  />
                  {error && (
                    <p id={`buyer-${field.id}-error`} className="mt-1 text-[13px]" style={{ color: DANGER }}>
                      {error}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
            Te enviamos las entradas a este email.
          </p>
        </Section>

        <Section title="Datos de pago">
          {methods.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              Este evento todavía no tiene medios de pago para entradas.
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
                      <span className="block text-[15px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
                        {method.label}
                      </span>
                      {method.sub && (
                        <span className="mt-0.5 block text-[13px]" style={{ color: MUTED }}>{method.sub}</span>
                      )}
                      {method.id === 'sipago' && (
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          {SIPAGO_CARD_LOGOS.map(logo => (
                            <Image key={logo.src} src={logo.src} alt={logo.alt} width={32} height={20} unoptimized className="h-5 w-8 object-contain" />
                          ))}
                        </span>
                      )}
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
              Compra inhabilitada temporalmente. No es posible pagar en este momento.
            </p>
          ) : submitError ? (
            <p className="mb-2 text-center text-[13px] font-semibold" style={{ color: DANGER }} role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px]" style={{ color: MUTED }}>Total</p>
              <p className="text-xl font-bold tabular-nums tracking-tight" style={{ color: BUYER_COLORS.text }}>
                {formatPrice(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading || !paymentsEnabled || methods.length === 0}
              className="h-[52px] flex-shrink-0 rounded-full px-10 text-base font-bold tracking-tight transition-opacity active:opacity-85 disabled:opacity-40 md:px-14"
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
