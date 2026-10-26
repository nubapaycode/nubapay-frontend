'use client'

import { Calendar, Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { DashboardRange } from '@/lib/organizerWorkspace'

import { DateRangeCalendar } from './DateRangeCalendar'

export type Preset = 'all' | 'today' | '7' | '30' | 'custom'

export const PRESETS: { value: Exclude<Preset, 'custom'>; label: string; short: string; key: string }[] = [
  { value: 'today', label: 'Hoy', short: 'Hoy', key: 'H' },
  { value: '7', label: 'Últimos 7 días', short: '7 días', key: 'S' },
  { value: '30', label: 'Últimos 30 días', short: '30 días', key: 'M' },
  { value: 'all', label: 'Todo el evento', short: 'Todo el evento', key: 'T' },
]

/** YYYY-MM-DD en hora local del navegador. */
export function isoLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoLocal(d)
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function rangeForPreset(p: Preset, customFrom: string, customTo: string): DashboardRange | null {
  if (p === 'all') return null
  if (p === 'today') return { from: daysAgo(0), to: daysAgo(0) }
  if (p === 'custom') return customFrom && customTo ? { from: customFrom, to: customTo } : null
  return { from: daysAgo(Number(p) - 1), to: daysAgo(0) }
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

export function PeriodPicker({
  preset,
  range,
  customFrom,
  customTo,
  onPreset,
  onCustom,
}: {
  preset: Preset
  range: DashboardRange | null
  customFrom: string
  customTo: string
  onPreset: (p: Exclude<Preset, 'custom'>) => void
  onCustom: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Atajos de teclado (H, S, M, T) como en Dub: funcionan con el menú cerrado, salvo que se esté escribiendo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      const hit = PRESETS.find(p => p.key === e.key.toUpperCase())
      if (hit) {
        onPreset(hit.value)
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onPreset])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const label =
    preset === 'custom' && range
      ? range.from === range.to
        ? formatDay(range.from)
        : `${formatDay(range.from)} – ${formatDay(range.to)}`
      : PRESETS.find(p => p.value === preset)?.short ?? 'Todo el evento'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Período: ${label}`}
        onClick={() => setOpen(o => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-gray-300 hover:bg-gray-50"
      >
        <Calendar size={15} strokeWidth={1.75} className="text-gray-400" aria-hidden />
        <span className="tabular-nums">{label}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Elegir período"
          className="nb-pop absolute left-0 top-[calc(100%+6px)] z-30 flex w-max max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] sm:flex-row"
        >
          <ul className="flex flex-col p-1.5 sm:w-[220px] sm:border-r sm:border-gray-100">
            {PRESETS.map(p => {
              const active = preset === p.value
              return (
                <li key={p.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      onPreset(p.value)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                      active ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Check size={14} strokeWidth={2.25} className={active ? 'text-gray-900' : 'invisible'} aria-hidden />
                      {p.label}
                    </span>
                    <kbd className="rounded-md border border-gray-200 bg-white px-1.5 font-sans text-[10px] font-semibold text-gray-400">
                      {p.key}
                    </kbd>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-gray-100 p-3 sm:border-t-0">
            <p className="mb-2 text-[11px] font-medium text-gray-400">Rango personalizado</p>
            {/* Solo se marca el rango cuando es el período en uso. */}
            <DateRangeCalendar
              from={preset === 'custom' ? customFrom : ''}
              to={preset === 'custom' ? customTo : ''}
              onChange={(from, to) => {
                onCustom(from, to)
                setOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
