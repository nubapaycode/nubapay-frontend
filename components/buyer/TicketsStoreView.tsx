'use client'

import Image from 'next/image'
import Link from 'next/link'

import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { useCart } from '@/lib/hooks/useCart'
import type { Event } from '@/types'

import { FloatingCart } from './FloatingCart'
import { FloatingOrders } from './FloatingOrders'
import { TicketCard } from './TicketCard'

interface TicketsStoreViewProps {
  event: Event
  catalogSlug: string
}

/** Página de tickets del evento. Comparte carrito y checkout con el catálogo. */
export function TicketsStoreView({ event, catalogSlug }: TicketsStoreViewProps) {
  const { items, addItem, updateQuantity, total, count } = useCart()
  const paymentsEnabled = event.paymentsEnabled
  const hasCatalog = event.products.length + event.combos.length + event.blocks.length > 0

  const heroSrc = event.coverImageUrl && event.coverImageUrl.trim() !== '' ? event.coverImageUrl : '/images/Frame.jpg'
  const getQuantity = (id: string) => items.find(i => i.productId === id)?.quantity ?? 0

  return (
    <div style={{ minHeight: '100svh', background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}>
      <div className="relative h-[160px] overflow-hidden sm:h-[240px] md:h-[280px]">
        <Image
          src={heroSrc}
          alt={event.name}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          unoptimized={heroSrc.startsWith('http')}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-5 pt-4 md:px-8 md:pb-7">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/75">Tickets</p>
          <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl" style={{ letterSpacing: '-0.03em' }}>
            {event.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 pt-5 md:px-6">
        {!paymentsEnabled && (
          <div
            className="mb-4 rounded-[14px] px-4 py-3 text-center text-[13px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626' }}
          >
            Compra inhabilitada temporalmente. No es posible agregar tickets ni pagar en este momento.
          </div>
        )}

        {event.tickets.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <p className="mb-1 text-[17px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
              Sin tickets disponibles
            </p>
            <p className="text-sm" style={{ color: BUYER_COLORS.muted }}>
              Este evento todavía no tiene tickets a la venta
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {event.tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                quantity={getQuantity(ticket.id)}
                onAdd={paymentsEnabled ? addItem : () => {}}
                onUpdateQuantity={updateQuantity}
                cartDisabled={!paymentsEnabled}
              />
            ))}
          </div>
        )}

        {hasCatalog && (
          <Link
            href={buyerFlowPath(event.id, { catalogSlug })}
            className="mt-6 flex h-[50px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition-opacity active:opacity-75"
            style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
          >
            Ver catálogo de productos
          </Link>
        )}
      </div>

      <FloatingCart count={count} total={total} eventId={event.id} catalogSlug={catalogSlug} />
      <FloatingOrders eventId={event.id} catalogSlug={catalogSlug} />
    </div>
  )
}
