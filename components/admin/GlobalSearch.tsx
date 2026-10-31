'use client'

import { CalendarDays, Receipt, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { fmtDateTime } from './format'
import { OrderStatusPill, cx, useDebounced } from './ui'
import { searchPlatform, type SearchResults } from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

export type SearchTarget =
  | { type: 'order'; id: string }
  | { type: 'event'; id: string }
  | { type: 'user'; email: string }

type Item = { key: string; group: string; icon: ReactNode; title: ReactNode; sub: ReactNode; right?: ReactNode; target: SearchTarget }

function toItems(r: SearchResults): Item[] {
  return [
    ...r.orders.map<Item>((o) => ({
      key: `o${o.id}`,
      group: 'Órdenes',
      icon: <Receipt size={15} />,
      title: `#${o.order_number ?? '—'} · ${o.customer_name ?? o.customer_email ?? 'Sin nombre'}`,
      sub: `${o.event_name ?? '—'} · ${fmtDateTime(o.created_at)}`,
      right: (
        <span className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-white/70">{formatPrice(o.total_amount, o.currency)}</span>
          <OrderStatusPill status={o.status_raw} />
        </span>
      ),
      target: { type: 'order', id: o.id },
    })),
    ...r.events.map<Item>((e) => ({
      key: `e${e.id}`,
      group: 'Eventos',
      icon: <CalendarDays size={15} />,
      title: e.name,
      sub: `${e.tenant_subdomain ?? 'sin tenant'} · /${e.slug}${e.is_active ? '' : ' · ventas pausadas'}`,
      target: { type: 'event', id: e.id },
    })),
    ...r.users.map<Item>((u) => ({
      key: `u${u.id}`,
      group: 'Usuarios',
      icon: <UserRound size={15} />,
      title: u.name,
      sub: `${u.email} · ${u.role}`,
      target: { type: 'user', email: u.email },
    })),
  ]
}

export function GlobalSearch(props: { open: boolean; onClose: () => void; onSelect: (t: SearchTarget) => void }) {
  // Se monta solo abierto: consulta y resultados arrancan limpios en cada apertura.
  return props.open ? <SearchDialog {...props} /> : null
}

function SearchDialog({ onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (t: SearchTarget) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cursor, setCursor] = useState(0)
  const dq = useDebounced(q.trim(), 250)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (dq.length < 2) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- indicador de búsqueda en curso
    setLoading(true)
    ;(async () => {
      const r = await searchPlatform(dq)
      if (cancelled) return
      setLoading(false)
      if (r.ok) {
        setResults(r.data)
        setError('')
        setCursor(0)
      } else {
        setError(r.error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dq])

  const shown = dq.length >= 2 ? results : null
  const items = useMemo(() => (shown ? toItems(shown) : []), [shown])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  function choose(i: number) {
    const it = items[i]
    if (it) {
      onSelect(it.target)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="admin-fade absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Búsqueda global" className="admin-pop relative w-full max-w-xl overflow-hidden rounded-lg border border-white/10 bg-admin-raised shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
          <Search size={17} className="text-white/55" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCursor((c) => Math.min(items.length - 1, c + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCursor((c) => Math.max(0, c - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                choose(cursor)
              }
            }}
            placeholder="Buscar orden, email, ID de pago, evento o usuario…"
            aria-label="Buscar"
            className="h-14 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-admin-mono text-[10px] text-white/55">Esc</kbd>
        </div>

        <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {error && <li className="px-3 py-6 text-center text-sm text-red-300">{error}</li>}
          {!error && dq.length < 2 && <li className="px-3 py-8 text-center text-sm text-white/50">Escribí al menos 2 caracteres.</li>}
          {!error && dq.length >= 2 && !loading && shown && items.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-white/55">Sin resultados para “{dq}”.</li>
          )}
          {items.map((it, i) => (
            <li key={it.key}>
              {(i === 0 || items[i - 1].group !== it.group) && (
                <p className="px-3 pb-1 pt-3 text-xs font-medium text-white/45">{it.group}</p>
              )}
              <button
                type="button"
                data-active={i === cursor}
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(i)}
                className={cx('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors', i === cursor ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]')}
              >
                <span className="text-white/55">{it.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white/90">{it.title}</span>
                  <span className="block truncate text-xs text-white/55">{it.sub}</span>
                </span>
                {it.right}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
