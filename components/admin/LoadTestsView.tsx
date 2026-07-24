'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import {
  LOAD_TEST_TARGETS,
  downloadLoadTestLog,
  fetchEventProducts,
  fetchLoadTests,
  fetchPlatformEvents,
  purgeLoadTest,
  startLoadTest,
  type LoadTestPaymentMethod,
  type LoadTestProduct,
  type LoadTestRun,
  type LoadTestTarget,
  type PlatformAdminEvent,
} from '@/lib/platformAdmin'
import { formatDate, formatPrice } from '@/lib/utils'

const POLL_MS = 3000

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-[#12121A] p-5">{children}</div>
}

const STATUS_STYLE: Record<LoadTestRun['status'], string> = {
  running: 'bg-yellow-500/15 text-yellow-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  failed: 'bg-red-500/15 text-red-300',
}

const STATUS_LABEL: Record<LoadTestRun['status'], string> = {
  running: 'Corriendo',
  completed: 'Completado',
  failed: 'Falló',
}

function StatusBadge({ status }: { status: LoadTestRun['status'] }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

const TABLE_HEADERS = [
  'Inicio',
  'Evento',
  'Producto',
  'Pago',
  'Target',
  'Estado',
  'Creadas',
  'Checkout OK',
  'Errores',
  'Duración',
  'Acciones',
]

export function LoadTestsView() {
  const [events, setEvents] = useState<PlatformAdminEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('')

  const [products, setProducts] = useState<LoadTestProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')

  const [paymentMethod, setPaymentMethod] = useState<LoadTestPaymentMethod>('mp')
  const [starting, setStarting] = useState<LoadTestTarget | null>(null)
  const [startError, setStartError] = useState('')

  const [runs, setRuns] = useState<LoadTestRun[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [purgingId, setPurgingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadHistory = useCallback(async () => {
    const result = await fetchLoadTests(1, 20)
    if (!result.ok) {
      setHistoryError(result.error)
      setHistoryLoading(false)
      return
    }
    setRuns(result.data.runs)
    setHistoryError('')
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    ;(async () => {
      setEventsLoading(true)
      const result = await fetchPlatformEvents(1, 100)
      if (result.ok) setEvents(result.data.events)
      setEventsLoading(false)
      await loadHistory()
    })()
  }, [loadHistory])

  useEffect(() => {
    if (!selectedEventId) return
    let cancelled = false
    ;(async () => {
      setProductsLoading(true)
      const result = await fetchEventProducts(selectedEventId)
      if (cancelled) return
      if (result.ok) {
        setProducts(result.data.products)
        setSelectedProductId(result.data.products[0]?.id ?? '')
      } else {
        setProducts([])
        setSelectedProductId('')
      }
      setProductsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [selectedEventId])

  function handleEventChange(id: string) {
    setSelectedEventId(id)
    setProducts([])
    setSelectedProductId('')
  }

  // Poll history mientras haya alguna corrida en curso.
  useEffect(() => {
    const hasRunning = runs.some((r) => r.status === 'running')
    if (hasRunning && !pollRef.current) {
      pollRef.current = setInterval(loadHistory, POLL_MS)
    }
    if (!hasRunning && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [runs, loadHistory])

  async function handleStart(target: LoadTestTarget) {
    if (!selectedEventId || !selectedProductId) return
    const confirmMsg =
      `Vas a crear ${target} órdenes de prueba reales contra producción (pago: ${paymentMethod}). ` +
      `Quedan marcadas is_test=true — las podés borrar después desde el historial. ¿Continuar?`
    if (!window.confirm(confirmMsg)) return

    setStarting(target)
    setStartError('')
    const result = await startLoadTest({
      event_id: selectedEventId,
      product_id: selectedProductId,
      target_count: target,
      payment_method: paymentMethod,
    })
    setStarting(null)
    if (!result.ok) {
      setStartError(result.error)
      return
    }
    await loadHistory()
  }

  async function handlePurge(run: LoadTestRun) {
    if (!window.confirm(`¿Borrar las ${run.created_count} órdenes de prueba creadas por esta corrida?`)) return
    setPurgingId(run.id)
    const result = await purgeLoadTest(run.id)
    setPurgingId(null)
    if (result.ok) await loadHistory()
    else window.alert(result.error)
  }

  async function handleDownload(run: LoadTestRun) {
    setDownloadingId(run.id)
    const result = await downloadLoadTestLog(run.id)
    setDownloadingId(null)
    if (!result.ok) window.alert(result.error)
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-white">Nueva corrida</h2>
        <p className="mt-1 text-sm text-white/50">
          Crea órdenes reales marcadas <code className="text-white/70">is_test=true</code> contra
          producción, recorriendo el mismo camino que un comprador real: creación → cola → workers
          → checkout de pago. Se pueden borrar después desde el historial sin afectar métricas
          reales.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-white/50">Evento</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0F] px-3 py-2 text-white"
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              disabled={eventsLoading}
            >
              <option value="">{eventsLoading ? 'Cargando…' : 'Elegir evento'}</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-white/50">Producto</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0F] px-3 py-2 text-white disabled:opacity-40"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={!selectedEventId || productsLoading}
            >
              <option value="">
                {productsLoading
                  ? 'Cargando…'
                  : products.length === 0
                    ? 'Sin productos activos'
                    : 'Elegir producto'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.price, p.currency)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-white/50">Método de pago</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0F] px-3 py-2 text-white"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as LoadTestPaymentMethod)}
            >
              <option value="mp">Mercado Pago</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {LOAD_TEST_TARGETS.map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => handleStart(target)}
              disabled={!selectedEventId || !selectedProductId || starting !== null}
              className="flex items-center gap-2 rounded-lg bg-[#C6FF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#b3e600] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {starting === target ? <Spinner size="sm" /> : null}
              Iniciar test de {target}
            </button>
          ))}
        </div>

        {startError ? <p className="mt-3 text-sm text-red-300">{startError}</p> : null}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Historial</h2>
          <button
            type="button"
            onClick={() => loadHistory()}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
          >
            Refrescar
          </button>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-white/60" />
          </div>
        ) : historyError ? (
          <p className="text-sm text-red-300">{historyError}</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-white/40">Todavía no corriste ningún test</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-white/10">
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-white/40"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-sm text-white/80">
                      {r.started_at ? formatDate(r.started_at) : '—'}
                    </td>
                    <td className="px-3 py-2 text-sm text-white/80">{r.event_name ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-white/80">{r.product_name ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-white/80">{r.payment_method}</td>
                    <td className="px-3 py-2 text-sm text-white/80">{r.target_count}</td>
                    <td className="px-3 py-2 text-sm">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2 text-sm text-white/80">
                      {r.created_count}/{r.target_count}
                    </td>
                    <td className="px-3 py-2 text-sm text-white/80">{r.checkout_count}</td>
                    <td className="px-3 py-2 text-sm text-white/80">
                      {r.error_count > 0 ? <span className="text-red-300">{r.error_count}</span> : '0'}
                    </td>
                    <td className="px-3 py-2 text-sm text-white/80">
                      {r.summary ? `${r.summary.duration_s.toFixed(1)}s` : r.status === 'running' ? 'en curso…' : '—'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r.id}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40"
                        >
                          {downloadingId === r.id ? '…' : 'Log'}
                        </button>
                        {r.purged_at ? (
                          <span className="text-xs text-white/40">Borradas ({r.purged_count})</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePurge(r)}
                            disabled={r.status === 'running' || purgingId === r.id}
                            className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                          >
                            {purgingId === r.id ? '…' : 'Borrar órdenes'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
