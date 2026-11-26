'use client'

import { MapPin, SquareParking } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { buyerFlowPath, parkingPath, ticketsPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { eventDateParts } from '@/lib/eventDate'
import { isGoogleMapsUrl } from '@/lib/googleMaps'
import { hasModule } from '@/lib/modules'
import { PURCHASE_COPY, checkoutPath, itemsOf, limitSelection, maxPerPurchase, selectionScope, type PurchaseKind } from '@/lib/purchaseKind'
import { startTicketHold, useTicketSelection } from '@/lib/ticketSelection'
import { cn, formatPriceOrFree } from '@/lib/utils'
import type { Event } from '@/types'

import { ParkingMap } from './ParkingMap'
import { ParkingOption } from './ParkingOption'
import { TICKET_PAGE_BG, TicketCard } from './TicketCard'

interface TicketsStoreViewProps {
  event: Event
  catalogSlug: string
  /** Entradas (por defecto) o parking: misma página de venta, otra lista y otros textos. */
  kind?: PurchaseKind
}

/**
 * Página de tickets del evento. Las entradas no usan el carrito del catálogo: se eligen acá
 * y "Comprar" lleva a su propio checkout (`/tickets/:slug/comprar` o `/parking/:slug/comprar`).
 */
function CrossLink({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="mt-8 flex items-center justify-between gap-4 rounded-[20px] bg-white px-5 py-4 transition-opacity active:opacity-75"
      style={{ color: BUYER_COLORS.text }}
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold tracking-tight">{title}</span>
        <span className="block text-[13px]" style={{ color: '#6B6B78' }}>
          {subtitle}
        </span>
      </span>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="flex-shrink-0">
        <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

export function TicketsStoreView({ event, catalogSlug, kind = 'ticket' }: TicketsStoreViewProps) {
  const router = useRouter()
  const copy = PURCHASE_COPY[kind]
  const isParking = kind === 'parking'
  const items = itemsOf(event, kind)
  const { lines: storedLines, quantityOf, setQuantity, selectOnly } = useTicketSelection(selectionScope(catalogSlug, kind))
  const lines = limitSelection(storedLines, kind)
  const maxQuantity = maxPerPurchase(kind)
  // Parking: un solo lugar por compra, así que elegir un vehículo reemplaza al anterior.
  const addItem = (id: string) => (maxQuantity === 1 ? selectOnly(id) : setQuantity(id, quantityOf(id) + 1))
  const paymentsEnabled = event.paymentsEnabled
  const purchaseClosed = event.purchaseClosed ?? false
  const hasCatalog = event.products.length + event.combos.length + event.blocks.length > 0
  const ticketFee = event.serviceFeePercent?.ticket ?? 0
  const date = eventDateParts(event.date)
  const venue = event.venue.trim()

  // Parking con mapa: en desktop, la lista a la izquierda y el mapa fijo a la derecha.
  const showMap = isParking && !!event.parkingMapsUrl && isGoogleMapsUrl(event.parkingMapsUrl)
  const container = showMap ? 'max-w-3xl lg:max-w-6xl' : 'max-w-3xl'

  const heroSrc = event.coverImageUrl && event.coverImageUrl.trim() !== '' ? event.coverImageUrl : '/images/Frame.jpg'

  const selected = lines.flatMap(line => {
    const ticket = items.find(t => t.id === line.ticketId)
    return ticket ? [{ ticket, quantity: line.quantity }] : []
  })
  const count = selected.reduce((sum, s) => sum + s.quantity, 0)
  const subtotal = selected.reduce((sum, s) => sum + s.ticket.price * s.quantity, 0)

  const goToCheckout = () => {
    startTicketHold(selectionScope(catalogSlug, kind))
    router.push(checkoutPath(catalogSlug, kind))
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
        <div className={cn('relative mx-auto flex h-full items-end gap-4', container, 'px-4 pb-6 md:gap-5 md:px-6 md:pb-8')}>
          {date && (
            <div
              className="flex w-[60px] flex-shrink-0 flex-col items-center overflow-hidden rounded-[14px] bg-white text-center md:w-[72px]"
              style={{ color: BUYER_COLORS.text }}
            >
              <span
                className="w-full py-1 text-[11px] font-semibold md:text-xs"
                style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
              >
                {date.month}
              </span>
              <span className="pt-1 text-[26px] font-semibold leading-none tabular-nums md:text-[32px]">{date.day}</span>
              <span className="pb-1.5 pt-0.5 text-[11px] font-semibold md:text-xs" style={{ color: '#6B6B78' }}>
                {date.weekday}
              </span>
            </div>
          )}
          <div className="min-w-0">
            {isParking && (
              <span
                className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold md:text-[13px]"
                style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
              >
                <SquareParking size={14} strokeWidth={2.25} aria-hidden />
                Estacionamiento
              </span>
            )}
            <h1 className="text-[26px] font-semibold leading-[1.1] text-white md:text-[40px]" style={{ letterSpacing: '-0.03em' }}>
              {event.name}
            </h1>
            {venue && (
              <p className="mt-1.5 line-clamp-2 text-sm text-white/80 md:text-base">{venue}</p>
            )}
          </div>
        </div>
      </header>

      <section
        className={cn(
          'mx-auto px-4 pb-10 pt-7 md:px-6 md:pt-10',
          container,
          showMap && 'lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8',
        )}
      >
        <div className="min-w-0">
        {!paymentsEnabled && (
          <div
            className="mb-5 rounded-[14px] px-4 py-3 text-center text-[13px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626' }}
          >
            {purchaseClosed ? copy.closed : copy.disabled}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center rounded-[20px] bg-white px-6 py-14 text-center">
            <p className="mb-1 text-[17px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text }}>
              {copy.noneTitle}
            </p>
            <p className="text-sm" style={{ color: '#6B6B78' }}>
              {copy.noneBody}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-end justify-between gap-4 md:mb-5">
              <h2
                id="store-heading"
                className="text-xl font-semibold tracking-tight md:text-2xl"
                style={{ color: BUYER_COLORS.text }}
              >
                {copy.heading}
              </h2>
              {showMap && (
                <a
                  href="#ubicacion"
                  className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline lg:hidden"
                  style={{ color: BUYER_COLORS.text }}
                >
                  <MapPin size={15} strokeWidth={2} aria-hidden />
                  Ver ubicación
                </a>
              )}
            </div>
            {isParking ? (
              <div role="radiogroup" aria-labelledby="store-heading" className="flex flex-col gap-2.5 md:gap-3">
                {items.map(ticket => (
                  <ParkingOption
                    key={ticket.id}
                    ticket={ticket}
                    checked={lines.some(l => l.ticketId === ticket.id)}
                    onSelect={selectOnly}
                    disabled={!paymentsEnabled}
                  />
                ))}
              </div>
            ) : (
            <div className="flex flex-col gap-3 md:gap-4">
              {items.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  quantity={lines.find(l => l.ticketId === ticket.id)?.quantity ?? 0}
                  onAdd={t => paymentsEnabled && addItem(t.id)}
                  onUpdateQuantity={setQuantity}
                  cartDisabled={!paymentsEnabled}
                  maxQuantity={maxQuantity}
                />
              ))}
            </div>
            )}
          </>
        )}

        {kind === 'ticket' && hasModule(event.modules, 'parking') && (event.parking?.length ?? 0) > 0 && (
          <CrossLink href={parkingPath(catalogSlug)} title="Reservá tu estacionamiento" subtitle="Elegí tu tipo de vehículo y mirá dónde queda." />
        )}
        {isParking && hasModule(event.modules, 'tickets') && event.tickets.length > 0 && (
          <CrossLink href={ticketsPath(catalogSlug)} title="Comprá tus entradas" subtitle="Elegí tu entrada para el evento." />
        )}

        {hasCatalog && (
          <Link
            href={buyerFlowPath(event.id, { catalogSlug })}
            className="mt-8 flex items-center justify-between gap-4 rounded-[20px] bg-white px-5 py-4 transition-opacity active:opacity-75"
            style={{ color: BUYER_COLORS.text }}
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold tracking-tight">Ver catálogo de productos</span>
              <span className="block text-[13px]" style={{ color: '#6B6B78' }}>
                Pedí comida y bebida y retirala sin hacer fila.
              </span>
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="flex-shrink-0">
              <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}

        </div>

        {showMap && (
          <ParkingMap
            id="ubicacion"
            url={event.parkingMapsUrl}
            resolvedUrl={event.parkingMapsResolvedUrl}
            className="scroll-mt-6 lg:sticky lg:top-6 lg:mt-0"
          />
        )}
      </section>

      {paymentsEnabled && count > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-white px-4 pt-3 md:px-6"
          style={{ borderColor: BUYER_COLORS.border, paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
          <div className={cn('mx-auto flex items-center justify-between gap-4', container)}>
            <div className="min-w-0" aria-live="polite">
              <p className="text-lg font-semibold tabular-nums tracking-tight" style={{ color: BUYER_COLORS.text }}>
                {formatPriceOrFree(subtotal)}
              </p>
              <p className="text-[13px]" style={{ color: '#6B6B78' }}>
                {isParking && selected[0] ? selected[0].ticket.name : copy.countLabel(count)}
                {ticketFee > 0 ? ' más costo de servicio' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={goToCheckout}
              className="h-[52px] flex-shrink-0 rounded-full px-10 text-base font-semibold tracking-tight transition-opacity active:opacity-85 md:px-14"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              {subtotal === 0 ? 'Reservar' : 'Comprar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
