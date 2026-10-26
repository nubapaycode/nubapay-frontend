'use client'

import { BadgePercent, Boxes, Camera, ChevronDown, GripVertical, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Money } from '@/components/organizer/dashboard/AnimatedNumber'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import type { WorkspaceProduct, WorkspaceProductPromotion } from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'

/** Botón principal "Nuevo" con menú: producto o combo. */
export function NewItemMenu({ onProduct, onCombo }: { onProduct: () => void; onCombo: () => void }) {
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

  const option = (label: string, hint: string, icon: React.ReactNode, fn: () => void) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false)
        fn()
      }}
      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">{icon}</span>
      <span>
        <span className="block text-[13px] font-semibold text-gray-900">{label}</span>
        <span className="block text-[12px] text-gray-500">{hint}</span>
      </span>
    </button>
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={organizerAccentFilledButtonStyle()}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl pl-3.5 pr-3 text-[14px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition-[filter] hover:brightness-95"
      >
        <Plus size={16} strokeWidth={2.25} aria-hidden />
        Nuevo
        <ChevronDown size={14} strokeWidth={2.25} className={cn('opacity-60 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="nb-pop absolute right-0 top-[calc(100%+6px)] z-30 w-[260px] rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]">
          {option('Producto', 'Algo que se vende suelto', <Package size={16} strokeWidth={1.75} />, onProduct)}
          {option('Combo', 'Varios productos con un precio', <Boxes size={16} strokeWidth={1.75} />, onCombo)}
        </div>
      )}
    </div>
  )
}

export function CatalogThumb({ src, size = 48 }: { src: string | null; size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-xl border border-gray-200/70 bg-gray-50"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- imágenes subidas por el organizador (Supabase)
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-gray-300" title="Sin foto">
          <Camera size={Math.round(size * 0.38)} strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  )
}

function promoState(product: WorkspaceProduct, promo?: WorkspaceProductPromotion) {
  const active = Boolean(promo?.is_active)
  const promoPrice = active && promo?.promo_price != null && promo.promo_price < product.price ? promo.promo_price : null
  return { active, promoPrice, label: promo?.badge_label ?? 'Promo' }
}

function RowAction({
  label,
  onClick,
  danger,
  active,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-lg p-2 transition-colors',
        danger ? 'text-gray-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900',
        active && 'text-gray-900',
      )}
    >
      {children}
    </button>
  )
}

/**
 * Fila del catálogo (producto o combo): foto, nombre, categoría o contenido del combo,
 * precio con la promo visible, estado y acciones.
 */
export function CatalogItemRow({
  item,
  promo,
  checked,
  onToggleChecked,
  toggle,
  onPromo,
  onEdit,
  onDelete,
  drag,
}: {
  item: WorkspaceProduct
  promo?: WorkspaceProductPromotion
  checked?: boolean
  onToggleChecked?: () => void
  toggle: React.ReactNode
  onPromo: () => void
  onEdit: () => void
  onDelete: () => void
  drag?: {
    dragging: boolean
    over: boolean
    handlers: React.HTMLAttributes<HTMLDivElement> & { draggable: boolean }
  }
}) {
  const { active: promoActive, promoPrice, label: promoLabel } = promoState(item, promo)
  const isCombo = item.type === 'combo'

  return (
    <div
      {...drag?.handlers}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-3 transition-colors',
        drag?.over ? 'bg-gray-50' : 'hover:bg-gray-50/60',
        drag?.dragging && 'opacity-40',
      )}
    >
      {drag?.over && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gray-900" aria-hidden />}
      {drag && (
        <span className="-ml-1 cursor-grab text-gray-300 opacity-0 transition-opacity hover:text-gray-500 active:cursor-grabbing group-hover:opacity-100" title="Arrastrá para reordenar">
          <GripVertical size={15} strokeWidth={1.75} aria-hidden />
        </span>
      )}
      {onToggleChecked && (
        <button
          type="button"
          role="checkbox"
          aria-checked={Boolean(checked)}
          aria-label={`Seleccionar ${item.name}`}
          onClick={onToggleChecked}
          className={cn(
            'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
            checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white hover:border-gray-400',
          )}
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
              <path d="M1 4l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      <div className={cn('flex min-w-0 flex-1 items-center gap-3', !item.is_active && 'opacity-60')}>
        <CatalogThumb src={item.image_url} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="truncate text-left text-[14px] font-semibold tracking-tight text-gray-900 hover:underline"
            >
              {item.name}
            </button>
            {!item.is_active && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Pausado</span>
            )}
            {promoActive && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                <BadgePercent size={11} strokeWidth={2} aria-hidden />
                {promoLabel}
              </span>
            )}
          </div>
          {isCombo ? (
            item.combo_lines.length > 0 ? (
              <p className="mt-0.5 truncate text-[12px] text-gray-500">
                {item.combo_lines.map(l => `${l.quantity}× ${l.name}`).join(' · ')}
              </p>
            ) : (
              <p className="mt-0.5 text-[12px] text-amber-700">Sin productos: agregale al menos uno</p>
            )
          ) : (
            <p className="mt-0.5 truncate text-[12px] text-gray-500">{item.category_name ?? 'Sin categoría'}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          {promoPrice != null ? (
            <>
              <Money value={promoPrice} className="block text-[14px] font-semibold tabular-nums text-gray-900" />
              <Money value={item.price} className="block text-[12px] tabular-nums text-gray-400 line-through" />
            </>
          ) : (
            <Money value={item.price} className="block text-[14px] font-semibold tabular-nums text-gray-900" />
          )}
        </div>
      </div>

      {/* Acciones: visibles al pasar el mouse en escritorio, siempre en pantallas táctiles. */}
      <div className="flex shrink-0 items-center gap-0.5 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
        <RowAction label={promoActive ? 'Editar promoción' : 'Agregar promoción'} onClick={onPromo} active={promoActive}>
          <BadgePercent size={15} strokeWidth={1.75} aria-hidden />
        </RowAction>
        <RowAction label="Editar" onClick={onEdit}>
          <Pencil size={15} strokeWidth={1.75} aria-hidden />
        </RowAction>
        <RowAction label={`Eliminar ${item.name}`} onClick={onDelete} danger>
          <Trash2 size={15} strokeWidth={1.75} aria-hidden />
        </RowAction>
      </div>
      <div className="ml-1 shrink-0">{toggle}</div>
    </div>
  )
}
