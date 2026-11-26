'use client'

import { type KeyboardEvent, type RefObject, useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'

// ── Utilidades de fecha (YYYY-MM-DD en hora local, sin corrimientos por zona) ──

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTH_FMT = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const DAY_LABEL_FMT = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftIso(iso: string, days: number): string {
  const d = parseIso(iso)!
  return toIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days))
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** YYYY-MM-DD → dd/mm/aaaa */
function isoToText(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

/** Lo que se va escribiendo → "dd/mm/aaaa" con las barras puestas solas. */
function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** dd/mm/aaaa completo y válido → YYYY-MM-DD; si no, null. */
function textToIso(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  if (d.getDate() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return null
  return toIso(d)
}

function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`
}

function textToTime(text: string): string | null {
  const m = /^(\d{2}):(\d{2})$/.exec(text)
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null
  return text
}

/** Minutos entre dos horas; si el fin es menor o igual, cuenta hasta el día siguiente. */
function durationLabel(start: string, end: string): string {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  let diff = toMin(end) - toMin(start)
  if (diff <= 0) diff += 24 * 60
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)

// ── Popover compartido ────────────────────────────────────────────────────────

function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, ref, close])
}

const triggerClass =
  'flex w-full min-w-0 items-center gap-2 rounded-xl border bg-white pl-3.5 pr-2 text-[15px] text-[#0A0A0F] transition-[border-color,box-shadow]'

function triggerState(invalid: boolean, open: boolean) {
  if (invalid) return 'border-red-500 ring-4 ring-red-500/10'
  return open ? 'border-[#0A0A0F] ring-4 ring-black/5' : 'border-black/10 hover:border-black/20'
}

const popoverClass =
  'absolute left-0 top-[calc(100%+6px)] z-30 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18),0_2px_6px_rgba(16,24,40,0.06)]'

// ── Fecha ─────────────────────────────────────────────────────────────────────

export function DatePickerField({
  id,
  value,
  onChange,
  onBlur,
  min,
  rangeStart,
  invalid,
  describedBy,
}: {
  id: string
  value: string
  onChange: (iso: string) => void
  onBlur?: () => void
  /** Primer día elegible (YYYY-MM-DD). */
  min?: string
  /** Día de inicio a marcar como referencia (para la fecha de fin). */
  rangeStart?: string
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = useState(false)
  // Lo que se está escribiendo; null = mostrar el valor confirmado.
  const [draft, setDraft] = useState<string | null>(null)
  const [view, setView] = useState(() => {
    const d = parseIso(value) ?? parseIso(min ?? '') ?? new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [focusIso, setFocusIso] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const dialogId = useId()
  const todayIso = toIso(new Date())

  const close = () => {
    setOpen(false)
    setFocusIso(null)
  }
  useDismiss(open, wrapRef, close)

  // El foco del teclado dentro de la grilla sigue a `focusIso`.
  useEffect(() => {
    if (!open || !focusIso) return
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)?.focus()
  }, [open, focusIso, view])

  const showMonthOf = (iso: string) => {
    const d = parseIso(iso)
    if (d) setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const openCalendar = () => {
    if (open) return
    showMonthOf(value || (min && min > todayIso ? min : todayIso))
    setOpen(true)
  }

  const pick = (iso: string) => {
    onChange(iso)
    setDraft(null)
    close()
    inputRef.current?.focus()
  }

  const isDisabled = (iso: string) => !!min && iso < min

  const moveFocus = (from: string, days: number) => {
    let next = shiftIso(from, days)
    if (isDisabled(next)) next = min!
    setFocusIso(next)
    showMonthOf(next)
  }

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = focusIso ?? value ?? todayIso
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (step) {
      e.preventDefault()
      moveFocus(from, step)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
      inputRef.current?.focus()
    }
  }

  const first = new Date(view.year, view.month, 1)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(view.year, view.month, i + 1))),
  ]
  const minDate = parseIso(min ?? '')
  const canGoBack = !minDate || view.year > minDate.getFullYear() || (view.year === minDate.getFullYear() && view.month > minDate.getMonth())
  const shiftMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const selected = parseIso(value)

  return (
    <div ref={wrapRef} className="relative">
      <div className={cn(triggerClass, 'h-[46px]', triggerState(!!invalid, open))}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          value={draft ?? isoToText(value)}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          onFocus={openCalendar}
          onClick={openCalendar}
          onChange={e => {
            const text = maskDate(e.target.value)
            const iso = textToIso(text)
            if (iso) {
              onChange(iso)
              setDraft(null)
              showMonthOf(iso)
            } else {
              setDraft(text)
              if (value) onChange('')
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') close()
            if (e.key === 'ArrowDown' && open) {
              e.preventDefault()
              setFocusIso(value || (min && min > todayIso ? min : todayIso))
            }
          }}
          onBlur={onBlur}
          className="min-w-0 flex-1 bg-transparent py-2.5 outline-none placeholder:text-[#A8A8B3]"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Abrir calendario"
          onClick={() => (open ? close() : (openCalendar(), inputRef.current?.focus()))}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6B6B78] transition-colors hover:bg-black/5 hover:text-[#0A0A0F]"
        >
          <CalendarDays size={17} aria-hidden />
        </button>
      </div>
      {selected && !open && (
        <p className="sr-only" aria-live="polite">
          {DAY_LABEL_FMT.format(selected)}
        </p>
      )}

      {open && (
        <div id={dialogId} role="dialog" aria-modal="false" aria-labelledby={titleId} className={cn(popoverClass, 'w-[296px] max-w-[calc(100vw-2rem)]')}>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={!canGoBack}
              aria-label="Mes anterior"
              className="flex size-8 items-center justify-center rounded-lg text-[#0A0A0F] transition-colors hover:bg-black/5 disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <p id={titleId} className="text-[14px] font-semibold text-[#0A0A0F]">
              {capitalize(MONTH_FMT.format(first))}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Mes siguiente"
              className="flex size-8 items-center justify-center rounded-lg text-[#0A0A0F] transition-colors hover:bg-black/5"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-[#9A9AA8]" aria-hidden>
            {WEEKDAYS.map(w => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>
          <div ref={gridRef} role="grid" aria-labelledby={titleId} onKeyDown={onGridKey} className="grid grid-cols-7 gap-y-0.5">
            {cells.map((iso, i) => {
              if (!iso) return <span key={`e${i}`} />
              const day = Number(iso.slice(8))
              const disabled = isDisabled(iso)
              const isSelected = iso === value
              const isToday = iso === todayIso
              const inRange = !!rangeStart && !!value && iso > rangeStart && iso < value
              const isRangeStart = iso === rangeStart
              const tabbable = iso === (focusIso ?? (value && parseIso(value)?.getMonth() === view.month ? value : null))
              return (
                <button
                  key={iso}
                  type="button"
                  data-iso={iso}
                  disabled={disabled}
                  tabIndex={tabbable ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-label={capitalize(DAY_LABEL_FMT.format(parseIso(iso)!))}
                  onClick={() => pick(iso)}
                  className={cn(
                    'relative mx-auto flex size-9 items-center justify-center rounded-full text-[13px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0F]',
                    disabled && 'cursor-default text-[#D0D0D8]',
                    !disabled && !isSelected && 'text-[#0A0A0F] hover:bg-black/5',
                    inRange && !isSelected && 'bg-black/[0.04]',
                    isRangeStart && !isSelected && 'ring-1 ring-inset ring-black/20',
                    isSelected && 'bg-[#0A0A0F] font-semibold text-white',
                  )}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-[#0A0A0F]" aria-hidden />
                  )}
                </button>
              )
            })}
          </div>
          {(!min || todayIso >= min) && value !== todayIso && (
            <div className="mt-2 border-t border-black/[0.06] pt-2">
              <button
                type="button"
                onClick={() => pick(todayIso)}
                className="w-full rounded-lg py-1.5 text-[13px] font-medium text-[#0A0A0F] transition-colors hover:bg-black/5"
              >
                Hoy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Hora ──────────────────────────────────────────────────────────────────────

export function TimePickerField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  relativeTo,
  placeholder = '--:--',
  scrollHint = '20:00',
}: {
  id: string
  value: string
  onChange: (time: string) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
  /** Hora de inicio: la lista muestra cuánto dura el evento con cada opción. */
  relativeTo?: string
  placeholder?: string
  /** Hora a la que se desplaza la lista si todavía no hay valor. */
  scrollHint?: string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [active, setActive] = useState<number>(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  // Para la hora de fin, la lista arranca justo después del inicio y sigue en orden de duración.
  const options = (() => {
    if (!relativeTo) return TIME_OPTIONS
    const i = TIME_OPTIONS.findIndex(t => t > relativeTo)
    return i <= 0 ? TIME_OPTIONS : [...TIME_OPTIONS.slice(i), ...TIME_OPTIONS.slice(0, i)]
  })()

  const close = () => {
    setOpen(false)
    setActive(-1)
  }
  useDismiss(open, wrapRef, close)

  // Al abrir, la lista arranca en la hora elegida (o en una hora razonable para un evento).
  useEffect(() => {
    if (!open) return
    const idx = value ? options.indexOf(value) : relativeTo ? 0 : options.findIndex(t => t >= scrollHint)
    const el = listRef.current?.children[Math.max(idx, 0)] as HTMLElement | undefined
    if (el && listRef.current) listRef.current.scrollTop = el.offsetTop - 8
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active < 0) return
    ;(listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' })
  }, [active])

  const pick = (t: string) => {
    onChange(t)
    setDraft(null)
    close()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      const start = value ? options.indexOf(value) : relativeTo ? 0 : options.findIndex(t => t >= scrollHint)
      const next = active < 0 ? Math.max(start, 0) : active + (e.key === 'ArrowDown' ? 1 : -1)
      setActive((next + options.length) % options.length)
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault()
      pick(options[active])
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      close()
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className={cn(triggerClass, 'h-[46px]', triggerState(!!invalid, open))}>
        <Clock size={16} className="shrink-0 text-[#6B6B78]" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          placeholder={placeholder}
          value={draft ?? value}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={e => {
            const text = maskTime(e.target.value)
            const t = textToTime(text)
            setOpen(true)
            setActive(-1)
            if (t) {
              onChange(t)
              setDraft(null)
            } else {
              setDraft(text)
              if (value) onChange('')
            }
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // "21" o "9" al salir se completan como hora en punto.
            if (draft && /^\d{1,2}$/.test(draft) && Number(draft) <= 23) {
              onChange(`${draft.padStart(2, '0')}:00`)
              setDraft(null)
            }
            onBlur?.()
          }}
          className="min-w-0 flex-1 bg-transparent py-2.5 tabular-nums outline-none placeholder:text-[#A8A8B3]"
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Horarios"
          className={cn(popoverClass, 'max-h-64 w-full min-w-[160px] overflow-y-auto p-1.5')}
        >
          {options.map((t, i) => {
            const isSelected = t === value
            return (
              <li
                key={t}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(t)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[14px] tabular-nums',
                  isSelected ? 'bg-[#0A0A0F] font-semibold text-white' : i === active ? 'bg-black/5 text-[#0A0A0F]' : 'text-[#0A0A0F]',
                )}
              >
                {t}
                {relativeTo && (
                  <span className={cn('text-[12px]', isSelected ? 'text-white/70' : 'text-[#9A9AA8]')}>
                    {durationLabel(relativeTo, t)}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Interruptor ───────────────────────────────────────────────────────────────

export function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/10',
          checked ? 'bg-[#0A0A0F]' : 'bg-black/15 hover:bg-black/20',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block size-[18px] rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-[14px] font-medium text-[#0A0A0F]">{label}</span>
        {description && <span className="block text-[12px] text-[#8A8A96]">{description}</span>}
      </label>
    </div>
  )
}
