'use client'

import { Check, ScanLine, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import { fetchProductScanSummary, type ProductScanSummaryItem } from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'

type ScanFilter = 'all' | 'pending' | 'done'

/** Producto · comprados · retirados · faltan · avance (la barra vive en la primera columna en celular). */
const SCANS_GRID = 'md:grid-cols-[minmax(0,1fr)_96px_96px_96px_120px]'

const pct = (scanned: number, purchased: number) =>
  purchased > 0 ? Math.min(100, Math.round((scanned / purchased) * 100)) : 0

function ScansSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white" aria-busy="true">
      <p className="sr-only">Cargando escaneos…</p>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-gray-100 px-4 py-4 first:border-t-0">
          <div className="h-3 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
          <div className="h-1.5 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

/**
 * Pestaña "Escaneos" de Pedidos: cuánto se compró y cuánto se retiró de cada producto.
 * El buscador y el botón de actualizar los pone Pedidos (`query` y remontar con `key`).
 */
export function ProductScanSummaryView({ eventId, query = '' }: { eventId: string; query?: string }) {
  const [products, setProducts] = useState<ProductScanSummaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ScanFilter>('all')

  const [attempt, setAttempt] = useState(0)

  // Arranca en `loading`; "Reintentar" lo vuelve a poner y sube `attempt`.
  useEffect(() => {
    let cancelled = false
    void fetchProductScanSummary(eventId).then(res => {
      if (cancelled) return
      setError(res.ok ? '' : res.error)
      setProducts(res.ok ? res.products : [])
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setError('No se pudo conectar con el servidor')
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [eventId, attempt])

  const totals = useMemo(() => {
    const purchased = products.reduce((a, p) => a + p.purchased, 0)
    const scanned = products.reduce((a, p) => a + Math.min(p.scanned, p.purchased), 0)
    const pending = products.filter(p => p.scanned < p.purchased).length
    return { purchased, scanned, pending, done: products.length - pending }
  }, [products])

  const q = query.trim().toLowerCase()
  const rows = useMemo(
    () =>
      products
        .filter(p => !q || p.name.toLowerCase().includes(q))
        .filter(p => (filter === 'pending' ? p.scanned < p.purchased : filter === 'done' ? p.scanned >= p.purchased : true))
        // Lo que más falta retirar va arriba: es lo que hay que preparar en la barra.
        .sort((a, b) => b.purchased - b.scanned - (a.purchased - a.scanned) || a.name.localeCompare(b.name, 'es')),
    [products, q, filter],
  )

  if (loading) return <ScansSkeleton />

  const totalPct = pct(totals.scanned, totals.purchased)

  return (
    <>
      {products.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-[13px] text-gray-500">
            <span>
              <span className="font-semibold tabular-nums text-gray-900">{formatCount(totals.purchased)}</span> u. compradas
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${totalPct}%` }} />
              </span>
              <span>
                <span className="font-semibold tabular-nums text-gray-900">{totalPct}%</span> retirado
                <span className="tabular-nums text-gray-400">
                  {' '}
                  ({formatCount(totals.scanned)} de {formatCount(totals.purchased)} u.)
                </span>
              </span>
            </span>
          </div>

          <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Filtrar productos">
            {(
              [
                ['all', 'Todos', products.length],
                ['pending', 'Por retirar', totals.pending],
                ['done', 'Completos', totals.done],
              ] as const
            ).map(([key, label, n]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors',
                  filter === key ? 'bg-white text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-gray-500 hover:text-gray-900',
                )}
              >
                {label}
                <span className="tabular-nums text-gray-400">{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">
          {error}
          <button type="button" onClick={() => {
              setLoading(true)
              setAttempt(n => n + 1)
            }} className="shrink-0 font-medium underline-offset-2 hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/80 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gray-50">
            {q ? (
              <Search size={20} strokeWidth={1.5} className="text-gray-300" aria-hidden />
            ) : (
              <ScanLine size={20} strokeWidth={1.5} className="text-gray-300" aria-hidden />
            )}
          </div>
          <p className="text-[15px] font-semibold text-gray-900">
            {products.length === 0 ? 'Sin escaneos todavía' : 'Nada en esta vista'}
          </p>
          <p className="mt-1 text-[13px] text-gray-400">
            {q || filter !== 'all'
              ? 'Probá otra búsqueda o cambiá el filtro.'
              : 'Cuando se vendan productos vas a ver acá cuánto se retiró de cada uno.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div
            className={cn(
              'hidden gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[11px] font-medium text-gray-400 md:grid',
              SCANS_GRID,
            )}
          >
            <span>Producto</span>
            <span className="text-right">Comprados</span>
            <span className="text-right">Retirados</span>
            <span className="text-right">Faltan</span>
            <span className="text-right">Avance</span>
          </div>

          <ul>
            {rows.map(p => {
              const done = p.scanned >= p.purchased && p.purchased > 0
              const left = Math.max(0, p.purchased - p.scanned)
              const value = pct(p.scanned, p.purchased)
              return (
                <li
                  key={p.name}
                  className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-gray-100 px-4 py-3 first:border-t-0 transition-colors hover:bg-gray-50/60 md:py-3.5', SCANS_GRID)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-gray-900" title={p.name}>{p.name}</p>
                    {/* En celular: los números en una línea debajo del nombre. */}
                    <p className="mt-0.5 text-[12px] tabular-nums text-gray-400 md:hidden">
                      {formatCount(p.scanned)} de {formatCount(p.purchased)} retirados
                      {left > 0 && <> · faltan <span className="font-medium text-gray-700">{formatCount(left)}</span></>}
                    </p>
                  </div>
                  <span className="hidden text-right text-[13px] tabular-nums text-gray-900 md:block">{formatCount(p.purchased)}</span>
                  <span className="hidden text-right text-[13px] tabular-nums text-gray-500 md:block">{formatCount(p.scanned)}</span>
                  <span className={cn('hidden text-right text-[13px] tabular-nums md:block', left > 0 ? 'font-semibold text-gray-900' : 'text-gray-300')}>
                    {left > 0 ? formatCount(left) : '—'}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100" aria-hidden>
                      <span
                        className={cn('block h-full rounded-full', done ? 'bg-emerald-500' : 'bg-gray-900')}
                        style={{ width: `${value}%` }}
                      />
                    </span>
                    {done ? (
                      <Check size={14} strokeWidth={2.25} className="w-8 text-emerald-600" aria-label="Completo" />
                    ) : (
                      <span className="w-8 text-right text-[12px] tabular-nums text-gray-500">{value}%</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </>
  )
}
