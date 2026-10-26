'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/** Botón de filtro con menú desplegable. `multiple` permite elegir varias opciones. */
export function FilterMenu({
  label,
  options,
  selected,
  onChange,
  multiple = false,
  triggerClassName,
  hideCount = false,
}: {
  label: string
  options: { value: string; label: string; swatch?: string }[]
  selected: string[]
  onChange: (next: string[]) => void
  multiple?: boolean
  /** Clases extra para el botón (para igualarlo a otros controles de la página). */
  triggerClassName?: string
  /** Oculta el contador de elegidos (cuando la etiqueta ya muestra el valor). */
  hideCount?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (value: string) => {
    if (!multiple) {
      onChange(selected[0] === value ? [] : [value])
      setOpen(false)
      return
    }
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-xl border border-dashed px-3 text-[13px] font-medium transition-colors',
          selected.length
            ? 'border-gray-300 bg-gray-50 text-gray-900'
            : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-900',
          triggerClassName,
        )}
      >
        <span className="truncate">{label}</span>
        {selected.length > 0 && !hideCount && (
          <span className="rounded-md bg-gray-900 px-1.5 text-[11px] font-semibold tabular-nums text-white">{selected.length}</span>
        )}
        <ChevronDown size={13} strokeWidth={2} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          className="nb-pop absolute left-0 top-[calc(100%+6px)] z-30 max-h-72 min-w-[220px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]"
        >
          {options.map(opt => {
            const active = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => toggle(opt.value)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                  active ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border',
                    active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white',
                    !multiple && 'rounded-full',
                  )}
                  aria-hidden
                >
                  {active && <Check size={11} strokeWidth={3} />}
                </span>
                {opt.swatch && <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: opt.swatch }} aria-hidden />}
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
          {selected.length > 0 && (
            <>
              <div className="my-1 h-px bg-gray-100" />
              <button
                type="button"
                onClick={() => {
                  onChange([])
                  setOpen(false)
                }}
                className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                Limpiar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
