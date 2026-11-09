'use client'

import { Check, Copy, Download, X } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { Order } from '@/types'

type Stage = 'idle' | 'confirm' | 'running' | 'done'

/**
 * Barra flotante con acciones sobre los pedidos marcados (patrón de Mercury / Linear).
 * "Marcar como entregado" en lote no está a propósito: saltearía el escaneo del QR.
 */
export function BulkActionsBar({
  orders,
  exporting,
  onExport,
  onClear,
  onCancel,
}: {
  orders: Order[]
  exporting: boolean
  onExport: () => void
  onClear: () => void
  /** Cancela los pedidos y devuelve los errores (vacío si salió todo bien). */
  onCancel: (orders: Order[]) => Promise<string[]>
}) {
  const [stage, setStage] = useState<Stage>('idle')
  const [result, setResult] = useState<{ ok: number; failed: string[] } | null>(null)
  const [copied, setCopied] = useState(false)

  const cancellable = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered')
  const emails = [...new Set(orders.map(o => o.customerEmail).filter((e): e is string => Boolean(e)))]
  const n = orders.length

  const copyEmails = () => {
    void navigator.clipboard?.writeText(emails.join(', ')).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  const runCancel = async () => {
    setStage('running')
    const failed = await onCancel(cancellable)
    setResult({ ok: cancellable.length - failed.length, failed })
    setStage('done')
  }

  return (
    <div
      role="region"
      aria-label="Acciones sobre los pedidos seleccionados"
      // Misma barra que la del catálogo: píldora blanca flotante, centrada sobre el contenido (sin contar la barra lateral, abierta o plegada).
      className={cn(
        'nb-pop fixed inset-x-3 bottom-20 z-[60] mx-auto w-fit max-w-[calc(100vw-1.5rem)] border border-black/[0.08] bg-white text-gray-900 shadow-[0_12px_40px_rgba(0,0,0,0.12)] md:inset-x-auto md:bottom-[54px] md:left-[calc(50%+var(--nb-sidebar-w,0px)/2)] md:-translate-x-1/2 md:transition-[left] md:duration-200',
        stage === 'idle' ? 'rounded-full py-2 pl-[22px] pr-2' : 'max-w-[560px] rounded-2xl p-2',
      )}
    >
      {stage === 'idle' && (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          <span className="text-[13px] font-semibold tabular-nums tracking-[-0.01em]">
            {n} {n === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
          <span className="hidden h-5 w-px bg-black/[0.08] sm:block" aria-hidden />
          <BarButton onClick={onExport} disabled={exporting}>
            <Download size={14} strokeWidth={1.75} aria-hidden />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </BarButton>
          <BarButton onClick={copyEmails} disabled={emails.length === 0} title={emails.length ? undefined : 'Ningún pedido tiene email'}>
            {copied ? <Check size={14} strokeWidth={2} className="text-emerald-600" aria-hidden /> : <Copy size={14} strokeWidth={1.75} aria-hidden />}
            {copied ? 'Copiados' : `Copiar ${emails.length} ${emails.length === 1 ? 'email' : 'emails'}`}
          </BarButton>
          {cancellable.length > 0 && (
            <button
              type="button"
              onClick={() => setStage('confirm')}
              className="rounded-full border border-red-500/20 bg-red-500/[0.08] px-3.5 py-1.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-500/[0.12]"
            >
              Cancelar…
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            aria-label="Quitar selección"
            title="Quitar selección"
            className="flex size-8 items-center justify-center rounded-full bg-[#F5F5F7] text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
          >
            <X size={13} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}

      {(stage === 'confirm' || stage === 'running') && (
        <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">
              ¿Cancelar {cancellable.length} {cancellable.length === 1 ? 'pedido' : 'pedidos'}?
            </p>
            <p className="text-[12px] text-gray-500">
              Los QR dejan de valer y a cada comprador le llega un email.
              {cancellable.length < n && ` ${n - cancellable.length} ya estaban entregados o cancelados y no se tocan.`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setStage('idle')}
              disabled={stage === 'running'}
              className="rounded-full px-3.5 py-2 text-[13px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => void runCancel()}
              disabled={stage === 'running'}
              className="rounded-full bg-red-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-70"
            >
              {stage === 'running' ? 'Cancelando…' : `Sí, cancelar ${cancellable.length}`}
            </button>
          </div>
        </div>
      )}

      {stage === 'done' && result && (
        <div className="flex items-start gap-3 p-2">
          <div className="min-w-0 flex-1 text-[13px]">
            {result.ok > 0 && (
              <p className="font-semibold">
                {result.ok === 1 ? 'Se canceló 1 pedido.' : `Se cancelaron ${result.ok} pedidos.`}
              </p>
            )}
            {result.failed.length > 0 && (
              <div className="mt-0.5 text-[12px] text-red-600">
                <p>No se pudieron cancelar {result.failed.length}:</p>
                <ul className="mt-0.5 list-inside list-disc">
                  {result.failed.slice(0, 4).map(f => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full bg-[#F5F5F7] px-3.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900"
          >
            Listo
          </button>
        </div>
      )}
    </div>
  )
}

function BarButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex items-center gap-1.5 px-1 py-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-500',
        className,
      )}
    >
      {children}
    </button>
  )
}
