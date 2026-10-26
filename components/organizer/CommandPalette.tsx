'use client'

import { ArrowRight, CalendarDays, Clock3, CornerDownLeft, Download, Hash, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Money } from '@/components/organizer/dashboard/AnimatedNumber'
import { OPEN_COMMAND_EVENT, OPEN_ORDER_EVENT } from '@/components/organizer/commandEvents'
import { visibleNavItems } from '@/components/organizer/EventOrganizerSidebar'
import { itemsSummary } from '@/components/organizer/orders/orderUi'
import type { OrganizerStaffTools } from '@/lib/authSession'
import { downloadOrdersCsv, fetchWorkspaceOrders } from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'


type Command = {
  id: string
  group: 'Pedidos' | 'Ir a' | 'Acciones'
  label: string
  hint?: string
  icon: React.ReactNode
  right?: React.ReactNode
  keywords?: string
  run: () => void
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function CommandPalette({
  eventId,
  basePath,
  pathname,
  tools,
  membership,
}: {
  eventId: string
  basePath: string
  pathname: string
  tools: OrganizerStaffTools
  membership: 'owner' | 'staff'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [orderResults, setOrderResults] = useState<Order[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // ⌘K / Ctrl+K abre y cierra; también se abre con el evento global.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    const onOpen = () => setOpen(true)
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setQuery('')
      setActive(0)
      setOrderResults([])
    })
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  // Búsqueda de pedidos en el servidor mientras se escribe (número, cliente, email o producto).
  const orderQuery = query.trim().replace(/^#/, '')
  useEffect(() => {
    if (!open || !tools.orders || orderQuery.length < 2) {
      queueMicrotask(() => {
        setOrderResults([])
        setSearching(false)
      })
      return
    }
    let cancelled = false
    queueMicrotask(() => setSearching(true))
    const t = window.setTimeout(() => {
      void fetchWorkspaceOrders(eventId, { q: orderQuery, pageSize: 5, paymentStatus: 'approved' }).then(res => {
        if (cancelled) return
        setOrderResults(res.ok ? res.orders : [])
        setSearching(false)
      })
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [open, orderQuery, tools.orders, eventId])

  const close = () => setOpen(false)

  const commands = useMemo<Command[]>(() => {
    /** Misma página con otros filtros: recarga, porque las vistas leen la URL al montar. */
    const go = (url: string) => {
      setOpen(false)
      if (url.split('?')[0] === pathname) window.location.assign(url)
      else router.push(url)
    }
    const ordersPath = `${basePath}/orders`

    const orderCmds: Command[] = orderResults.map(o => ({
      id: `order-${o.id}`,
      group: 'Pedidos',
      label: `${o.orderNumber != null ? `#${o.orderNumber}` : 'Pedido'} · ${o.customerName || 'Sin nombre'}`,
      hint: itemsSummary(o),
      icon: <Hash size={15} strokeWidth={1.75} />,
      right: <Money value={o.total} className="text-[12px] font-semibold tabular-nums text-gray-700" />,
      run: () => {
        if (pathname === ordersPath) {
          setOpen(false)
          window.dispatchEvent(new CustomEvent(OPEN_ORDER_EVENT, { detail: { id: o.id } }))
        } else go(`${ordersPath}?pedido=${o.id}`)
      },
    }))

    const navCmds: Command[] = [
      ...visibleNavItems(basePath, tools, membership).map(item => ({
        id: `nav-${item.href}`,
        group: 'Ir a' as const,
        label: item.label,
        icon: item.icon,
        keywords: item.group,
        run: () => go(item.href),
      })),
      {
        id: 'nav-events',
        group: 'Ir a',
        label: 'Mis eventos',
        hint: 'Cambiar de evento',
        icon: <CalendarDays size={15} strokeWidth={1.75} />,
        keywords: 'evento cambiar',
        run: () => go(`${basePath}/all`),
      },
    ]

    const actionCmds: Command[] = []
    if (tools.dashboard) {
      actionCmds.push({
        id: 'act-today',
        group: 'Acciones',
        label: 'Ver las ventas de hoy',
        icon: <CalendarDays size={15} strokeWidth={1.75} />,
        keywords: 'dashboard hoy recaudado metricas',
        run: () => go(`${basePath}/dashboard?periodo=today`),
      })
    }
    if (tools.orders) {
      actionCmds.push(
        {
          id: 'act-unredeemed',
          group: 'Acciones',
          label: 'Ver pedidos sin retirar',
          icon: <Clock3 size={15} strokeWidth={1.75} />,
          keywords: 'pendientes retiro pedidos',
          run: () => go(`${ordersPath}?estado=unredeemed`),
        },
        {
          id: 'act-export',
          group: 'Acciones',
          label: 'Exportar todos los pedidos (CSV)',
          icon: <Download size={15} strokeWidth={1.75} />,
          keywords: 'descargar excel planilla csv',
          run: () => {
            setOpen(false)
            void downloadOrdersCsv(eventId, { paymentStatus: 'approved' })
          },
        },
      )
    }

    const q = normalize(query.trim())
    const match = (c: Command) => !q || normalize(`${c.label} ${c.hint ?? ''} ${c.keywords ?? ''}`).includes(q)
    return [...orderCmds, ...navCmds.filter(match), ...actionCmds.filter(match)]
  }, [orderResults, basePath, tools, membership, pathname, query, router, eventId])

  const activeIndex = Math.min(active, Math.max(commands.length - 1, 0))

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  let lastGroup = ''

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[12vh]">
      <button
        type="button"
        aria-label="Cerrar buscador"
        onClick={close}
        className="nb-cmd-fade absolute inset-0 cursor-default bg-gray-900/25 backdrop-blur-[2px]"
      />
      <style>{`
        @keyframes nb-cmd-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nb-cmd-in { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
        .nb-cmd-fade { animation: nb-cmd-fade 150ms ease-out both; }
        .nb-cmd-in { animation: nb-cmd-in 180ms cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .nb-cmd-fade, .nb-cmd-in { animation: none; } }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscador"
        className="nb-cmd-in relative w-full max-w-[600px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_-12px_rgba(16,24,40,0.35)]"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          <Search size={17} strokeWidth={1.75} className="shrink-0 text-gray-400" aria-hidden />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="nb-cmd-list"
            aria-activedescendant={commands[activeIndex] ? `nb-cmd-${commands[activeIndex].id}` : undefined}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive(i => Math.min(i + 1, commands.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive(i => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                commands[activeIndex]?.run()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                close()
              }
            }}
            placeholder={tools.orders ? 'Buscá un pedido (#567, nombre, email) o una herramienta…' : 'Buscá una herramienta…'}
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {searching && <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" aria-label="Buscando" />}
          <kbd className="shrink-0 rounded-md border border-gray-200 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-gray-400">Esc</kbd>
        </div>

        <div ref={listRef} id="nb-cmd-list" role="listbox" className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
          {commands.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] text-gray-400">
              {searching ? 'Buscando…' : `Nada para “${query}”.`}
            </p>
          ) : (
            commands.map((c, i) => {
              const header = c.group !== lastGroup ? c.group : null
              lastGroup = c.group
              const isActive = i === activeIndex
              return (
                <div key={c.id}>
                  {header && <p className="px-3 pb-1 pt-2.5 text-[11px] font-medium text-gray-400">{header}</p>}
                  <button
                    type="button"
                    id={`nb-cmd-${c.id}`}
                    role="option"
                    aria-selected={isActive}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={c.run}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-gray-100' : 'hover:bg-gray-50',
                    )}
                  >
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-white text-gray-900 shadow-sm' : 'bg-gray-50 text-gray-500')}>
                      {c.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-gray-900">{c.label}</span>
                      {c.hint && <span className="block truncate text-[12px] text-gray-400">{c.hint}</span>}
                    </span>
                    {c.right}
                    {isActive && (c.group === 'Pedidos' ? <CornerDownLeft size={14} className="shrink-0 text-gray-400" /> : <ArrowRight size={14} className="shrink-0 text-gray-400" />)}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/70 px-4 py-2 text-[11px] text-gray-400">
          <span><kbd className="font-sans font-semibold">↑↓</kbd> moverse</span>
          <span><kbd className="font-sans font-semibold">↵</kbd> abrir</span>
          <span className="ml-auto"><kbd className="font-sans font-semibold">⌘K</kbd> abrir o cerrar</span>
        </div>
      </div>
    </div>
  )
}
