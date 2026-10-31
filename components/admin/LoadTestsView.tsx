'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { fmtDateTime } from './format'
import { Btn, Card, ConfirmDialog, Pill, Select, Table, Td, Th, useToast, type Tone } from './ui'
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
import { formatPrice } from '@/lib/utils'

const POLL_MS = 3000

const STATUS_TONE: Record<LoadTestRun['status'], Tone> = {
  running: 'warning',
  completed: 'good',
  failed: 'critical',
}

const STATUS_LABEL: Record<LoadTestRun['status'], string> = {
  running: 'Corriendo',
  completed: 'Completado',
  failed: 'Falló',
}

const PAYMENT_OPTIONS: { value: LoadTestPaymentMethod; label: string }[] = [
  { value: 'mp', label: 'Mercado Pago' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
]

const paymentLabel = (m: LoadTestPaymentMethod) => PAYMENT_OPTIONS.find((o) => o.value === m)?.label ?? m

export function LoadTestsView() {
  const toast = useToast()
  const [pendingStart, setPendingStart] = useState<LoadTestTarget | null>(null)
  const [pendingPurge, setPendingPurge] = useState<LoadTestRun | null>(null)
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
    setPendingStart(null)
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
    setPendingPurge(null)
    setPurgingId(run.id)
    const result = await purgeLoadTest(run.id)
    setPurgingId(null)
    if (result.ok) await loadHistory()
    else toast('error', result.error)
  }

  async function handleDownload(run: LoadTestRun) {
    setDownloadingId(run.id)
    const result = await downloadLoadTestLog(run.id)
    setDownloadingId(null)
    if (!result.ok) toast('error', result.error)
  }

  const productPlaceholder = productsLoading ? 'Cargando…' : products.length === 0 ? 'Sin productos activos' : 'Elegir producto'

  return (
    <div className="space-y-6">
      <Card
        title="Nueva corrida"
        subtitle={
          <>
            Crea órdenes reales marcadas <code className="font-admin-mono text-white/70">is_test=true</code> contra producción, recorriendo el mismo
            camino que un comprador real: creación → cola → workers → checkout de pago. Se pueden borrar después desde el historial sin
            afectar métricas reales.
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block space-y-1.5 text-xs">
            <span className="text-white/55">Evento</span>
            <Select
              label="Evento"
              value={selectedEventId}
              onChange={handleEventChange}
              disabled={eventsLoading}
              options={[
                { value: '', label: eventsLoading ? 'Cargando…' : 'Elegir evento' },
                ...events.map((e) => ({ value: e.id, label: e.name })),
              ]}
            />
          </label>

          <label className="block space-y-1.5 text-xs">
            <span className="text-white/55">Producto</span>
            <Select
              label="Producto"
              value={selectedProductId}
              onChange={setSelectedProductId}
              disabled={!selectedEventId || productsLoading}
              options={[
                { value: '', label: productPlaceholder },
                ...products.map((p) => ({ value: p.id, label: `${p.name} — ${formatPrice(p.price, p.currency)}` })),
              ]}
            />
          </label>

          <label className="block space-y-1.5 text-xs">
            <span className="text-white/55">Método de pago</span>
            <Select
              label="Método de pago"
              value={paymentMethod}
              onChange={(v) => setPaymentMethod(v as LoadTestPaymentMethod)}
              options={PAYMENT_OPTIONS}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {LOAD_TEST_TARGETS.map((target) => (
            <Btn
              key={target}
              variant="primary"
              onClick={() => setPendingStart(target)}
              disabled={!selectedEventId || !selectedProductId || starting !== null}
            >
              {starting === target ? <Spinner size="sm" /> : null}
              Iniciar test de {target}
            </Btn>
          ))}
        </div>

        {startError ? <p className="mt-3 text-sm text-red-300">{startError}</p> : null}
      </Card>

      <Card
        title="Historial"
        action={
          <Btn size="sm" onClick={() => loadHistory()}>
            Refrescar
          </Btn>
        }
        flush
      >
        {historyLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-white/60" />
          </div>
        ) : historyError ? (
          <p className="px-5 pb-5 text-sm text-red-300">{historyError}</p>
        ) : runs.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-white/55">Todavía no corriste ningún test</p>
        ) : (
          <Table min={900}>
            <thead className="border-b border-white/[0.06]">
              <tr>
                <Th>Inicio</Th>
                <Th>Evento</Th>
                <Th>Pago</Th>
                <Th>Estado</Th>
                <Th align="right">Creadas</Th>
                <Th align="right">Checkout OK</Th>
                <Th align="right">Errores</Th>
                <Th align="right">Duración</Th>
                <th className="sticky right-0 border-l border-white/[0.06] bg-admin-surface" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {runs.map((r) => (
                <tr key={r.id} className="transition-colors duration-150 hover:bg-white/[0.02]">
                  <Td muted className="whitespace-nowrap">
                    {fmtDateTime(r.started_at)}
                  </Td>
                  <Td className="max-w-[190px]">
                    <p className="truncate font-medium text-white" title={r.event_name ?? undefined}>
                      {r.event_name ?? '—'}
                    </p>
                    <p className="truncate text-xs text-white/55">{r.product_name ?? 'Sin producto'}</p>
                  </Td>
                  <Td muted className="whitespace-nowrap">
                    {paymentLabel(r.payment_method)}
                  </Td>
                  <Td>
                    <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    {r.created_count}/{r.target_count}
                  </Td>
                  <Td align="right">{r.checkout_count}</Td>
                  <Td align="right" className={r.error_count > 0 ? '!text-red-300' : undefined}>
                    {r.error_count}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    {r.summary ? `${r.summary.duration_s.toFixed(1)} s` : r.status === 'running' ? 'en curso…' : '—'}
                  </Td>
                  {/* Fija a la derecha: con poco ancho las acciones no quedan detrás del scroll. */}
                  <Td className="sticky right-0 border-l border-white/[0.06] bg-admin-surface">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Btn size="sm" onClick={() => handleDownload(r)} disabled={downloadingId === r.id}>
                        {downloadingId === r.id ? '…' : 'Log'}
                      </Btn>
                      {r.purged_at ? (
                        <span className="text-xs text-white/55">{r.purged_count} borradas</span>
                      ) : (
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick={() => setPendingPurge(r)}
                          disabled={r.status === 'running' || purgingId === r.id}
                        >
                          {purgingId === r.id ? '…' : 'Borrar'}
                        </Btn>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={pendingStart !== null}
        title={`Crear ${pendingStart ?? ''} órdenes contra producción`}
        confirmLabel="Iniciar test"
        onCancel={() => setPendingStart(null)}
        onConfirm={() => pendingStart !== null && handleStart(pendingStart)}
      >
        Son órdenes reales con pago {paymentLabel(paymentMethod)}. Quedan marcadas{' '}
        <code className="font-admin-mono text-white/75">is_test=true</code> y las podés borrar después desde el historial.
      </ConfirmDialog>

      <ConfirmDialog
        open={pendingPurge !== null}
        title="Borrar órdenes de prueba"
        confirmLabel="Borrar órdenes"
        tone="danger"
        onCancel={() => setPendingPurge(null)}
        onConfirm={() => pendingPurge && handlePurge(pendingPurge)}
      >
        Se van a borrar las {pendingPurge?.created_count} órdenes creadas por esta corrida.
      </ConfirmDialog>
    </div>
  )
}
