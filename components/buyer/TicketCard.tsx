'use client'

import type { Ticket } from '@/types'
import { BUYER_COLORS } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'

interface TicketCardProps {
  ticket: Ticket
  quantity: number
  onAdd: (ticket: Ticket) => void
  onUpdateQuantity: (ticketId: string, quantity: number) => void
  /** Switch global de pagos inhabilitado: oculta los controles de agregar. */
  cartDisabled?: boolean
}

function TicketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M3 7a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V7z"
        stroke={BUYER_COLORS.iconMuted}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 5v12" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.6" strokeDasharray="2 2.4" />
    </svg>
  )
}

/** Fila de un ticket (entrada, parking…): sin imagen ni detalle, solo categoría, precio y cantidad. */
export function TicketCard({ ticket, quantity, onAdd, onUpdateQuantity, cartDisabled = false }: TicketCardProps) {
  const btnBase = 'flex items-center justify-center rounded-full transition-colors active:opacity-90'
  const available = ticket.available !== false
  const remaining = ticket.remaining ?? null
  const atLimit = remaining !== null && quantity >= remaining

  return (
    <div
      className="flex items-center gap-3 rounded-[18px] bg-white p-3.5"
      style={{ border: `1px solid ${BUYER_COLORS.border}`, opacity: available ? 1 : 0.75 }}
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px]"
        style={{ background: BUYER_COLORS.subtleFill }}
      >
        <TicketIcon />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-bold leading-tight" style={{ color: BUYER_COLORS.text }}>
          {ticket.name}
        </h3>
        {ticket.description.trim() ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug" style={{ color: BUYER_COLORS.muted }}>
            {ticket.description}
          </p>
        ) : null}
        <p className="mt-1 text-sm font-extrabold tracking-tight" style={{ color: BUYER_COLORS.text }}>
          {formatPrice(ticket.price)}
        </p>
        {available && remaining !== null && remaining <= 10 && (
          <p className="mt-0.5 text-xs font-semibold" style={{ color: '#D97706' }}>
            {remaining === 1 ? '¡Queda 1!' : `¡Quedan ${remaining}!`}
          </p>
        )}
      </div>

      {!available && (
        <span className="flex-shrink-0 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white">
          Agotado
        </span>
      )}

      {available && !cartDisabled && (
        <div className="flex-shrink-0">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(ticket)}
              className={`${btnBase} h-9 w-9 bg-white shadow-md`}
              style={{ border: `1px solid ${BUYER_COLORS.chipInactiveBorder}`, color: BUYER_COLORS.text }}
              aria-label={`Agregar ${ticket.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <div
              className="flex items-center gap-2 rounded-full px-2 py-1.5 shadow-md"
              style={{ background: BUYER_COLORS.surface, border: `1px solid ${BUYER_COLORS.border}` }}
            >
              <button
                type="button"
                onClick={() => onUpdateQuantity(ticket.id, quantity - 1)}
                className={`${btnBase} h-7 w-7 text-sm font-bold`}
                style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
                aria-label="Quitar uno"
              >
                −
              </button>
              <span className="min-w-[18px] text-center text-sm font-extrabold" style={{ color: BUYER_COLORS.text }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(ticket.id, quantity + 1)}
                disabled={atLimit}
                className={`${btnBase} h-7 w-7 text-sm font-bold disabled:opacity-40`}
                style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
                aria-label="Agregar uno"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
