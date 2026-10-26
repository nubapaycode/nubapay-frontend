'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { buyerFlowPath, ticketsCheckoutPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { eventDateParts } from '@/lib/eventDate'
import { startTicketHold, useTicketSelection } from '@/lib/ticketSelection'
import { formatPrice } from '@/lib/utils'
import type { Event } from '@/types'

import { TICKET_PAGE_BG, TicketCard } from './TicketCard'

interface TicketsStoreViewProps {
  event: Event
  catalogSlug: string
}

/**
 * Página de tickets del evento. Las entradas no usan el carrito del catálogo: se eligen acá
 * y "Comprar" lleva a su propio checkout (`/tickets/:slug/comprar`).
 */
export function TicketsStoreView({ event, catalogSlug }: TicketsStoreViewProps) {
  const router = useRouter()
  const { lines, quantityOf, setQuantity } = useTicketSelection(catalogSlug)
  const paymentsEnabled = event.paymentsEnabled
  const hasCatalog = event.products.length + event.combos.length + event.blocks.length > 0
  const ticketFee = event.serviceFeePercent?.ticket ?? 0
  const date = eventDateParts(event.date)
  const venue = event.venue.trim()

  const heroSrc = event.coverImageUrl && event.coverImageUrl.trim() !== '' ? event.coverImageUrl : '/images/Frame.jpg'

  const selected = lines.flatMap(line => {
    const ticket = event.tickets.find(t => t.id === line.ticketId)
    return ticket ? [{ ticket, quantity: line.quantity }] : []
  })
  const count = selected.reduce((sum, s) => sum + s.quantity, 0)
  const subtotal = selected.reduce((sum, s) => sum + s.ticket.price * s.quantity, 0)

  const goToCheckout = () => {
    startTicketHold(catalogSlug)
    router.push(ticketsCheckoutPath(catalogSlug))
  }

  return (
    <div style={{ minHeight: '100svh', background: TICKET_PAGE_BG, fontFamily: BUYER_FONT }}>
      <header className="relative h-[220px] overflow-hidden sm:h-[280px] md:h-[320px]">
        <Image
          src={heroSrc}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          unoptimized={heroSrc.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15" />
        <div className="relative mx-auto flex h-full max-w-3xl items-end gap-4 px-4 pb-6 md:gap-5 md:px-6 md:pb-8">
          {date && (
            <div
              className="flex w-[60px] flex-shrink-0 flex-col items-center overflow-hidden rounded-[14px] bg-white text-center md:w-[72px]"
              style={{ color: BUYER_COLORS.text }}
            >
              <span
                className="w-full py-1 text-[11px] font-bold md:text-xs"
                style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
              >
                {date.month}
              </span>
              <span className="pt-1 text-[26px] font-bold leading-none tabular-nums md:text-[32px]">{date.day}</span>
              <span className="pb-1.5 pt-0.5 text-[11px] font-medium md:text-xs" style={{ color: '#6B6B78' }}>
                {date.weekday}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-[1.1] text-white md:text-[40px]" style={{ letterSpacing: '-0.03em' }}>
              {event.name}
            </h1>
            {(venue || date) && (
              <p className="mt-1.5 line-clamp-2 text-sm text-white/80 md:text-base">
                {venue}
                {venue && date ? ', ' : ''}
                {date ? `desde las ${date.time}` : ''}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-10 pt-7 md:px-6 md:pt-10">
        {!paymentsEnabled && (
          <div
            className="mb-5 rounded-[14px] px-4 py-3 text-center text-[13px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626' }}
          >
            Compra inhabilitada temporalmente. No es posible agregar tickets ni pagar en este momento.
          </div>
        )}

        {event.tickets.length === 0 ? (
          <div className="flex flex-col items-center rounded-[20px] bg-white px-6 py-14 text-center">
            <p className="mb-1 text-[17px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
              Sin tickets disponibles
            </p>
            <p className="text-sm" style={{ color: '#6B6B78' }}>
              Este evento todavía no tiene entradas a la venta. Volvé a entrar más cerca de la fecha.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 md:mb-5">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl" style={{ color: BUYER_COLORS.text }}>
                Elegí tus entradas
              </h2>
              {ticketFee > 0 && (
                <p className="mt-1 text-[13px] md:text-sm" style={{ color: '#6B6B78' }}>
                  Al pagar se suma un {ticketFee}% de costo de servicio.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 md:gap-4">
              {event.tickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  quantity={quantityOf(ticket.id)}
                  onAdd={t => paymentsEnabled && setQuantity(t.id, quantityOf(t.id) + 1)}
                  onUpdateQuantity={setQuantity}
                  cartDisabled={!paymentsEnabled}
                />
              ))}
            </div>
          </>
        )}

        {hasCatalog && (
          <Link
            href={buyerFlowPath(event.id, { catalogSlug })}
            className="mt-8 flex items-center justify-between gap-4 rounded-[20px] bg-white px-5 py-4 transition-opacity active:opacity-75"
            style={{ color: BUYER_COLORS.text }}
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-bold tracking-tight">Ver catálogo de productos</span>
              <span className="block text-[13px]" style={{ color: '#6B6B78' }}>
                Pedí comida y bebida y retirala sin hacer fila.
              </span>
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="flex-shrink-0">
              <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </section>

      {paymentsEnabled && count > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-white px-4 pt-3 md:px-6"
          style={{ borderColor: BUYER_COLORS.border, paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0" aria-live="polite">
              <p className="text-lg font-bold tabular-nums tracking-tight" style={{ color: BUYER_COLORS.text }}>
                {formatPrice(subtotal)}
              </p>
              <p className="text-[13px]" style={{ color: '#6B6B78' }}>
                {count} {count === 1 ? 'entrada' : 'entradas'}
                {ticketFee > 0 ? ' más costo de servicio' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={goToCheckout}
              className="h-[52px] flex-shrink-0 rounded-full px-10 text-base font-bold tracking-tight transition-opacity active:opacity-85 md:px-14"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              Comprar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
