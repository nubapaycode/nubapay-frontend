'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import { cn } from '@/lib/utils'

import { STATUS_TABS, statusUi, type StatusFilter } from './orderUi'

const dotFor = (key: StatusFilter) => (key === 'all' ? null : statusUi(key === 'unredeemed' ? 'paid' : key).dot)

/** Selector de estados de los pedidos (se pueden elegir varios; ninguno = todos), con el conteo de cada uno. */
export function StatusSelect({
  value,
  onChange,
  countFor,
}: {
  value: StatusFilter[]
  onChange: (next: StatusFilter[]) => void
  countFor: (key: StatusFilter) => number | null | undefined
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

  const options = STATUS_TABS.filter(t => t.key !== 'all')
  const picked = options.filter(t => value.includes(t.key))
  const sum = (keys: StatusFilter[]) => {
    let total = 0
    for (const k of keys) {
      const n = countFor(k)
      if (n == null) return null
      total += n
    }
    return total
  }
  const triggerN = picked.length ? sum(picked.map(t => t.key)) : countFor('all')
  const triggerLabel = picked.length === 0 ? 'Todos' : picked.length === 1 ? picked[0].label : `${picked.length} estados`

  const toggle = (key: StatusFilter) => {
    const next = value.includes(key) ? value.filter(k => k !== key) : [...value, key]
    // Si quedan todos marcados es lo mismo que "Todos": se limpia para no mandar un filtro de más.
    onChange(next.length === options.length ? [] : next)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Estado: ${picked.length ? picked.map(t => t.label).join(', ') : 'Todos'}`}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-[13px] font-medium text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors',
          open ? 'border-gray-400' : 'border-gray-200 hover:border-gray-300',
        )}
      >
        {picked.length > 0 && (
          <span className="flex -space-x-0.5" aria-hidden>
            {picked.map(t => (
              <span key={t.key} className={cn('size-1.5 rounded-full ring-1 ring-white', dotFor(t.key))} />
            ))}
          </span>
        )}
        {triggerLabel}
        {triggerN != null && <span className="tabular-nums text-gray-400">{formatCount(triggerN)}</span>}
        <ChevronDown size={13} strokeWidth={2} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Estado"
          aria-multiselectable
          className="nb-pop absolute left-0 top-[calc(100%+6px)] z-30 min-w-[232px] rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]"
        >
          <Option
            label="Todos"
            n={countFor('all')}
            active={value.length === 0}
            onClick={() => {
              onChange([])
              setOpen(false)
            }}
          />
          <div className="my-1 h-px bg-gray-100" aria-hidden />
          {options.map(t => (
            <Option key={t.key} label={t.label} dot={dotFor(t.key)} n={countFor(t.key)} active={value.includes(t.key)} onClick={() => toggle(t.key)} />
          ))}
        </div>
      )}
    </div>
  )
}

function Option({
  label,
  dot,
  n,
  active,
  onClick,
}: {
  label: string
  dot?: string | null
  n: number | null | undefined
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
        active ? 'font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded border',
          active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white',
        )}
        aria-hidden
      >
        {active && <Check size={11} strokeWidth={3} />}
      </span>
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden />}
      <span className="flex-1 truncate">{label}</span>
      {n != null && <span className="tabular-nums text-gray-400">{formatCount(n)}</span>}
    </button>
  )
}
