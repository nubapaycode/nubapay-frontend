'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTH_FMT = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const DAY_LABEL_FMT = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

/** "Octubre de 2026": solo la primera letra en mayúscula. */
function monthTitle(year: number, month: number): string {
  const s = MONTH_FMT.format(new Date(year, month, 1))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** YYYY-MM-DD → Date local (sin corrimiento por zona horaria). */
function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Celdas del mes empezando en lunes; `null` para los huecos antes del día 1. */
function monthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  return [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))]
}

/**
 * Calendario para elegir un rango: primer clic = desde, segundo = hasta (se ordenan solos).
 * Mientras falta el segundo clic, pasar el mouse muestra cómo queda el tramo.
 */
export function DateRangeCalendar({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const todayIso = toIso(new Date())
  const initial = parseIso(to) ?? new Date()
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() })
  const [anchor, setAnchor] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  // Mientras se elige, el tramo va del primer clic al día bajo el mouse.
  const [start, end] = anchor
    ? [anchor, hover ?? anchor].sort()
    : [from, to].sort()

  const pick = (iso: string) => {
    if (!anchor) {
      setAnchor(iso)
      return
    }
    const [a, b] = [anchor, iso].sort()
    setAnchor(null)
    setHover(null)
    onChange(a, b)
  }

  const shift = (delta: number) =>
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const isCurrentMonth = view.year === new Date().getFullYear() && view.month === new Date().getMonth()
  const cells = monthCells(view.year, view.month)

  return (
    <div className="w-[268px] select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Mes anterior"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        </button>
        <p className="text-[13px] font-semibold text-gray-900" aria-live="polite">
          {monthTitle(view.year, view.month)}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
          className="rounded-lg p-1.5 text-gray-500 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-gray-900 disabled:opacity-30"
        >
          <ChevronRight size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-400">
        {WEEKDAYS.map(d => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5" role="grid" aria-label="Calendario" onMouseLeave={() => setHover(null)}>
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} />
          const iso = toIso(date)
          const future = iso > todayIso
          const isStart = iso === start
          const isEnd = iso === end
          const inRange = iso > start && iso < end
          const edge = isStart || isEnd
          const col = i % 7
          return (
            <div
              key={iso}
              className={cn(
                'relative flex h-9 items-center justify-center',
                // Banda gris del tramo: se corta en los bordes de la semana y en los extremos.
                (inRange || (edge && start !== end)) && 'bg-gray-100',
                isStart && start !== end && 'rounded-l-full',
                isEnd && start !== end && 'rounded-r-full',
                inRange && col === 0 && 'rounded-l-lg',
                inRange && col === 6 && 'rounded-r-lg',
              )}
            >
              <button
                type="button"
                disabled={future}
                aria-label={DAY_LABEL_FMT.format(date)}
                aria-pressed={edge}
                onClick={() => pick(iso)}
                onMouseEnter={() => anchor && setHover(iso)}
                className={cn(
                  'relative z-[1] flex size-9 items-center justify-center rounded-full text-[13px] tabular-nums transition-colors',
                  edge
                    ? 'bg-gray-900 font-semibold text-white'
                    : future
                      ? 'cursor-not-allowed text-gray-300'
                      : 'text-gray-700 hover:bg-gray-200/80',
                )}
              >
                {date.getDate()}
                {iso === todayIso && !edge && <span className="absolute bottom-1 size-1 rounded-full bg-gray-900" aria-hidden />}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-[11px] text-gray-400">
        {anchor ? 'Elegí el día final.' : 'Tocá el primer día y después el último. Hora de Argentina.'}
      </p>
    </div>
  )
}
