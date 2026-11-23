'use client'

import { Check } from 'lucide-react'

import { BUYER_COLORS } from '@/lib/buyerUi'
import { ParkingIcon } from '@/lib/parkingIcons'
import { cn, formatPrice } from '@/lib/utils'
import type { Ticket } from '@/types'

const MUTED = '#6B6B78'
const LOW_STOCK = '#B45309'
/** Desde cuántos lugares libres se avisa que quedan pocos. */
const LOW_STOCK_AT = 10

/** Texto de disponibilidad de un vehículo; `null` si no tiene límite de lugares. */
export function parkingAvailability(ticket: Ticket): { text: string; low: boolean } | null {
  const remaining = ticket.remaining ?? null
  if (ticket.available === false || remaining === 0) return { text: 'Agotado', low: false }
  if (remaining === null) return null
  if (remaining <= LOW_STOCK_AT) return { text: remaining === 1 ? '¡Queda 1 lugar!' : `¡Quedan ${remaining} lugares!`, low: true }
  return { text: `${remaining} lugares libres`, low: false }
}

/**
 * Un tipo de vehículo de parking como opción única (radio): se toca la tarjeta entera.
 * Elegida, lleva un borde gris suave y la tilde con el color del organizador.
 */
export function ParkingOption({
  ticket,
  checked,
  onSelect,
  disabled = false,
}: {
  ticket: Ticket
  checked: boolean
  onSelect: (id: string) => void
  /** Pagos inhabilitados: se ve la opción pero no se puede elegir. */
  disabled?: boolean
}) {
  const availability = parkingAvailability(ticket)
  const soldOut = availability?.text === 'Agotado'
  const inactive = soldOut || disabled

  return (
    <label
      className={cn(
        'flex items-center gap-3.5 rounded-[18px] border-[1.5px] bg-white px-4 py-3.5 transition-colors md:gap-4 md:px-5 md:py-4',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
        inactive ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
      style={{ borderColor: checked ? 'rgba(10,10,15,0.28)' : 'transparent', outlineColor: BUYER_COLORS.text }}
    >
      <input
        type="radio"
        name="parking-vehicle"
        value={ticket.id}
        checked={checked}
        disabled={inactive}
        onChange={() => onSelect(ticket.id)}
        className="sr-only"
      />
      <span
        className={cn(
          'flex size-11 flex-shrink-0 items-center justify-center rounded-[12px] transition-colors',
          soldOut && 'opacity-50',
        )}
        style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
        aria-hidden
      >
        <ParkingIcon iconKey={ticket.icon} size={22} strokeWidth={1.75} />
      </span>

      <span className={cn('min-w-0 flex-1', soldOut && 'opacity-55')}>
        <span className="block truncate text-[15px] font-bold tracking-tight md:text-base" style={{ color: BUYER_COLORS.text }}>
          {ticket.name}
        </span>
        {ticket.description.trim() && (
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug" style={{ color: MUTED }}>
            {ticket.description}
          </span>
        )}
        {availability && (
          <span
            className="mt-0.5 block text-[13px]"
            style={{ color: availability.low ? LOW_STOCK : MUTED, fontWeight: availability.low ? 600 : 400 }}
          >
            {availability.text}
          </span>
        )}
      </span>

      <span
        className={cn('flex-shrink-0 text-base font-bold tabular-nums tracking-tight md:text-lg', soldOut && 'line-through opacity-55')}
        style={{ color: BUYER_COLORS.text }}
      >
        {formatPrice(ticket.price)}
      </span>

      <span
        className="flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: checked ? BUYER_COLORS.accent : 'rgba(0,0,0,0.18)',
          background: checked ? BUYER_COLORS.accent : 'transparent',
          color: BUYER_COLORS.accentText,
          opacity: inactive && !checked ? 0.4 : 1,
        }}
        aria-hidden
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
    </label>
  )
}
