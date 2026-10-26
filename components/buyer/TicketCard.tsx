'use client'

import type { Ticket } from '@/types'
import { BUYER_COLORS } from '@/lib/buyerUi'
import { cn, formatPrice } from '@/lib/utils'

interface TicketCardProps {
  ticket: Ticket
  quantity: number
  onAdd: (ticket: Ticket) => void
  onUpdateQuantity: (ticketId: string, quantity: number) => void
  /** Switch global de pagos inhabilitado: oculta los controles de agregar. */
  cartDisabled?: boolean
}

/** Gris del fondo de la página: las muescas del troquel lo usan para "recortar" la entrada. */
export const TICKET_PAGE_BG = BUYER_COLORS.subtleFill
const TICKET_MUTED = '#6B6B78'
const TICKET_LOW_STOCK = '#B45309'

/** Línea troquelada con muescas: horizontal en mobile, vertical en desktop. */
function Perforation({ stubColor }: { stubColor: string }) {
  const notch = 'absolute h-5 w-5 rounded-full'
  return (
    <div
      className={cn(
        'relative h-5 flex-shrink-0 md:h-auto md:w-5',
        // Mitad cuerpo (blanco) y mitad talón, para que el color del talón llegue hasta el troquel.
        'bg-[linear-gradient(to_bottom,#fff_50%,var(--stub)_50%)] md:bg-[linear-gradient(to_right,#fff_50%,var(--stub)_50%)]',
      )}
      style={{ '--stub': stubColor } as React.CSSProperties}
      aria-hidden
    >
      <div
        className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed md:bottom-4 md:left-1/2 md:right-auto md:top-4 md:border-l-2 md:border-t-0"
        style={{ borderColor: 'rgba(0,0,0,0.12)' }}
      />
      <span className={cn(notch, '-left-2.5 top-0 md:-top-2.5 md:left-0')} style={{ background: TICKET_PAGE_BG }} />
      <span className={cn(notch, '-right-2.5 top-0 md:-bottom-2.5 md:left-0 md:right-auto md:top-auto')} style={{ background: TICKET_PAGE_BG }} />
    </div>
  )
}

/**
 * Entrada (general, VIP, parking…) con forma de ticket físico: cuerpo con nombre y detalle,
 * troquel, y talón con precio y selector de cantidad. El talón toma el color del organizador
 * cuando hay unidades elegidas.
 */
export function TicketCard({ ticket, quantity, onAdd, onUpdateQuantity, cartDisabled = false }: TicketCardProps) {
  const remaining = ticket.remaining ?? null
  const available = ticket.available !== false && remaining !== 0
  const atLimit = remaining !== null && quantity >= remaining
  const empty = quantity === 0
  const selected = available && !empty

  const handleIncrement = () => (empty ? onAdd(ticket) : onUpdateQuantity(ticket.id, quantity + 1))

  const stepBtn = cn(
    'flex h-10 w-10 items-center justify-center rounded-full transition-opacity active:opacity-80 disabled:opacity-35',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
  )
  const stepBtnStyle = {
    background: selected ? 'rgba(255,255,255,0.6)' : BUYER_COLORS.subtleFill,
    color: selected ? BUYER_COLORS.accentText : BUYER_COLORS.text,
  }

  return (
    <article className="relative flex flex-col rounded-[20px] bg-white md:flex-row">
      <div className={cn('min-w-0 flex-1 px-5 pb-3 pt-5 md:py-5', !available && 'opacity-55')}>
        <h3 className="text-base font-bold leading-snug tracking-tight md:text-[17px]" style={{ color: BUYER_COLORS.text }}>
          {ticket.name}
        </h3>
        {ticket.description.trim() ? (
          <p className="mt-1 line-clamp-2 max-w-[60ch] text-[13px] leading-relaxed md:text-sm" style={{ color: TICKET_MUTED }}>
            {ticket.description}
          </p>
        ) : null}
        {available && remaining !== null && remaining <= 10 && (
          <p className="mt-2 text-xs font-semibold" style={{ color: TICKET_LOW_STOCK }}>
            {remaining === 1 ? '¡Queda 1!' : `¡Quedan ${remaining}!`}
          </p>
        )}
      </div>

      <Perforation stubColor={selected ? BUYER_COLORS.accent : BUYER_COLORS.surface} />

      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-b-[20px] px-5 pb-5 pt-3 transition-colors duration-200 motion-reduce:transition-none',
          'md:w-[272px] md:flex-shrink-0 md:rounded-bl-none md:rounded-r-[20px] md:py-5 md:pl-4',
        )}
        style={{
          background: selected ? BUYER_COLORS.accent : BUYER_COLORS.surface,
          color: selected ? BUYER_COLORS.accentText : BUYER_COLORS.text,
        }}
      >
        <div className={cn('min-w-0', !available && 'opacity-55')}>
          <p className={cn('text-lg font-bold tabular-nums tracking-tight', !available && 'line-through')}>
            {formatPrice(ticket.price)}
          </p>
        </div>

        {!available ? (
          <span className="text-sm font-semibold" style={{ color: TICKET_MUTED }}>
            Agotado
          </span>
        ) : cartDisabled ? null : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateQuantity(ticket.id, quantity - 1)}
              disabled={empty}
              className={stepBtn}
              style={stepBtnStyle}
              aria-label="Quitar uno"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="min-w-[28px] text-center text-base font-bold tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={atLimit}
              className={stepBtn}
              style={stepBtnStyle}
              aria-label={empty ? `Agregar ${ticket.name}` : 'Agregar uno'}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
