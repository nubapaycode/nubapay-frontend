'use client'

import { ArrowDown, ArrowUp, Copy, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Money, formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import { ToggleSwitch } from '@/components/organizer/BlocksView'
import { cn } from '@/lib/utils'
import type { WorkspaceTicket } from '@/lib/organizerWorkspace'

/** A partir de este % vendido se avisa "Quedan pocas". */
const LOW_STOCK_PCT = 85

export type TicketLike = Pick<WorkspaceTicket, 'name' | 'description' | 'price' | 'stock' | 'sold' | 'is_active'> &
  Partial<Pick<WorkspaceTicket, 'id' | 'currency' | 'revenue' | 'redeemed'>>

export function ticketAvailability(t: TicketLike) {
  const soldOut = t.stock != null && t.sold >= t.stock
  const pct = t.stock ? Math.min((t.sold / t.stock) * 100, 100) : 0
  const remaining = t.stock != null ? Math.max(t.stock - t.sold, 0) : null
  const low = !soldOut && t.stock != null && pct >= LOW_STOCK_PCT
  return { soldOut, pct, remaining, low }
}

function StatusPill({ t }: { t: TicketLike }) {
  const { soldOut, low, remaining } = ticketAvailability(t)
  const [label, cls] = !t.is_active
    ? ['Pausado', 'bg-gray-100 text-gray-500']
    : soldOut
      ? ['Agotado', 'bg-red-50 text-red-700']
      : low
        ? [`Quedan ${remaining}`, 'bg-amber-50 text-amber-800']
        : ['En venta', 'bg-emerald-50 text-emerald-700']
  return <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', cls)}>{label}</span>
}

function CardMenu({
  name,
  onEdit,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  name: string
  onEdit: () => void
  onDuplicate: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = (label: string, icon: React.ReactNode, fn: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false)
        fn()
      }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Opciones de ${name}`}
        onClick={() => setOpen(o => !o)}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <MoreHorizontal size={16} strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="nb-pop absolute right-0 top-[calc(100%+4px)] z-20 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]">
          {item('Editar', <Pencil size={14} strokeWidth={1.75} />, onEdit)}
          {item('Duplicar', <Copy size={14} strokeWidth={1.75} />, onDuplicate)}
          {onMoveUp && item('Subir', <ArrowUp size={14} strokeWidth={1.75} />, onMoveUp)}
          {onMoveDown && item('Bajar', <ArrowDown size={14} strokeWidth={1.75} />, onMoveDown)}
          <div className="my-1 h-px bg-gray-100" />
          {item('Eliminar', <Trash2 size={14} strokeWidth={1.75} />, onDelete, true)}
        </div>
      )}
    </div>
  )
}

/**
 * Tarjeta con forma de entrada: cuerpo con datos + talón con el precio, separados por un troquel.
 * Sin `actions` funciona como vista previa (en el formulario).
 */
export function TicketCard({
  ticket: t,
  actions,
  dragging,
  dragHandleProps,
}: {
  ticket: TicketLike
  actions?: {
    toggling: boolean
    onToggle: () => void
    onEdit: () => void
    onDuplicate: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    onDelete: () => void
  }
  dragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}) {
  const { soldOut, pct, low } = ticketAvailability(t)
  const name = t.name.trim() || 'Nombre del ticket'
  const attendancePct = t.sold ? Math.round(((t.redeemed ?? 0) / t.sold) * 100) : 0

  return (
    <div
      className={cn(
        'group relative flex min-h-[148px] rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[box-shadow,opacity,transform] duration-200',
        actions && 'hover:shadow-[0_6px_20px_-8px_rgba(16,24,40,0.18)]',
        !t.is_active && 'opacity-70',
        dragging && 'scale-[0.99] opacity-50',
      )}
    >
      {/* Cuerpo */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 pl-3">
        <div className="flex items-start gap-1.5">
          {dragHandleProps && (
            <span
              {...dragHandleProps}
              title="Arrastrá para reordenar"
              className="mt-0.5 cursor-grab rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 active:cursor-grabbing group-hover:opacity-100"
            >
              <GripVertical size={15} strokeWidth={1.75} aria-hidden />
            </span>
          )}
          <div className={cn('min-w-0 flex-1', !dragHandleProps && 'pl-1')}>
            <div className="flex items-center gap-2">
              <h3 className={cn('truncate text-[15px] font-semibold tracking-tight', t.name.trim() ? 'text-gray-900' : 'text-gray-300')}>
                {name}
              </h3>
              <StatusPill t={t} />
            </div>
            {t.description && <p className="mt-0.5 line-clamp-2 text-[12px] text-gray-500">{t.description}</p>}
          </div>
          {actions && (
            <CardMenu
              name={t.name}
              onEdit={actions.onEdit}
              onDuplicate={actions.onDuplicate}
              onMoveUp={actions.onMoveUp}
              onMoveDown={actions.onMoveDown}
              onDelete={actions.onDelete}
            />
          )}
        </div>

        {/* Capacidad */}
        <div className="mt-auto pl-1">
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
            <span className={cn('tabular-nums', soldOut ? 'font-semibold text-red-600' : 'text-gray-500')}>
              {t.stock == null ? (
                <>
                  <span className="font-semibold text-gray-900">{formatCount(t.sold)}</span> vendidos · sin límite
                </>
              ) : soldOut ? (
                `Agotado · ${formatCount(t.sold)}/${formatCount(t.stock)}`
              ) : (
                <>
                  <span className="font-semibold text-gray-900">{formatCount(t.sold)}</span> de {formatCount(t.stock)} vendidos
                </>
              )}
            </span>
            {t.stock != null && <span className="text-[11px] tabular-nums text-gray-400">{Math.round(pct)}%</span>}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            {t.stock != null && (
              <div
                className={cn('nb-grow h-full rounded-full', soldOut ? 'bg-red-500' : low ? 'bg-amber-400' : 'bg-gray-900')}
                style={{ width: `${Math.max(pct, t.sold ? 2 : 0)}%` }}
              />
            )}
          </div>
          {actions && t.sold > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
              <span>
                <Money value={t.revenue ?? 0} className="font-semibold tabular-nums text-gray-900" /> recaudado
              </span>
              <span title="Entradas ya escaneadas en el ingreso">
                <span className="font-semibold tabular-nums text-gray-900">{formatCount(t.redeemed ?? 0)}</span> ingresaron
                <span className="tabular-nums text-gray-400"> · {attendancePct}%</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Troquel: línea punteada + dos muescas */}
      <div className="relative w-px shrink-0 border-l border-dashed border-gray-200" aria-hidden>
        <span className="absolute -left-[9px] -top-[9px] size-[18px] rounded-full border border-gray-200/80 bg-[var(--nb-notch,#fff)] [clip-path:inset(50%_0_0_0)]" />
        <span className="absolute -bottom-[9px] -left-[9px] size-[18px] rounded-full border border-gray-200/80 bg-[var(--nb-notch,#fff)] [clip-path:inset(0_0_50%_0)]" />
      </div>

      {/* Talón */}
      <div className="flex w-[128px] shrink-0 flex-col items-center justify-center gap-2 px-3 py-4 text-center sm:w-[148px]">
        <span className="text-[11px] text-gray-400">Precio</span>
        <Money value={t.price || 0} className="text-[22px] font-semibold leading-none tracking-tight tabular-nums text-gray-900" />
        {actions ? (
          <label className="mt-1 flex items-center gap-2 text-[11px] font-medium text-gray-500">
            <ToggleSwitch checked={t.is_active} disabled={actions.toggling} onChange={actions.onToggle} />
            <span className="sr-only">{t.is_active ? `Pausar ${t.name}` : `Poner en venta ${t.name}`}</span>
            <span aria-hidden>{t.is_active ? 'En venta' : 'Pausado'}</span>
          </label>
        ) : (
          <span className="text-[11px] text-gray-400">Vista previa</span>
        )}
      </div>
    </div>
  )
}
