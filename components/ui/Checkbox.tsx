'use client'

import { cn } from '@/lib/utils'

/**
 * Casilla de selección de las tablas del panel (catálogo, pedidos): cuadrada, negra al marcarla.
 * `indeterminate` la muestra con un guion (selección parcial, para el "seleccionar todos").
 */
export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  /** Nombre accesible (no se muestra). */
  label: string
  disabled?: boolean
  className?: string
}) {
  const on = checked || indeterminate
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate && !checked ? 'mixed' : checked}
      aria-label={label}
      disabled={disabled}
      onClick={e => {
        // En filas clicables (abren un detalle), marcar no debe abrirlo.
        e.stopPropagation()
        onChange()
      }}
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed',
        on ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white hover:border-gray-400',
        className,
      )}
    >
      {checked ? (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
          <path d="M1 4l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : indeterminate ? (
        <span className="h-[1.6px] w-2 rounded-full bg-white" aria-hidden />
      ) : null}
    </button>
  )
}
