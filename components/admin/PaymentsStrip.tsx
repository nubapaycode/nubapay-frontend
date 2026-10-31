'use client'

import { useEffect, useState } from 'react'

import { AdminPortal, Btn, Toggle, useToast } from './ui'
import { fetchPlatformSettings, updatePlatformSettings } from '@/lib/platformAdmin'

export type PaymentsState = { enabled: boolean | null; effective: boolean | null }

/**
 * Interruptor global de pagos. Muestra lo guardado y avisa si el servidor lo reporta distinto.
 * `onState` deja que el layout muestre un aviso global aunque el menú lateral esté cerrado.
 */
export function PaymentsStrip({ onChanged, onState }: { onChanged?: () => void; onState?: (s: PaymentsState) => void }) {
  const toast = useToast()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [effective, setEffective] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      const r = await fetchPlatformSettings()
      if (r.ok) {
        setEnabled(r.data.payments_enabled)
        setEffective(r.data.effective ?? r.data.payments_enabled)
      } else {
        setError(r.error)
      }
    })()
  }, [])

  useEffect(() => {
    onState?.({ enabled, effective })
  }, [enabled, effective, onState])

  async function apply(next: boolean) {
    setSaving(true)
    setError('')
    const r = await updatePlatformSettings(next)
    setSaving(false)
    setConfirming(false)
    if (r.ok) {
      setEnabled(r.data.payments_enabled)
      setEffective(null)
      toast('success', r.data.payments_enabled ? 'Pagos habilitados' : 'Pagos inhabilitados en toda la plataforma')
      onChanged?.()
    } else {
      setError(r.error)
      toast('error', r.error)
    }
  }

  return (
    <>
      <div className="rounded-md border border-white/[0.07] bg-white/[0.02] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-white/85">Pagos y compras</p>
          <Toggle
            label="Pagos y compras"
            checked={!!enabled}
            disabled={enabled === null || saving}
            onChange={(v) => (v ? apply(true) : setConfirming(true))}
          />
        </div>
        {error ? (
          <p className="mt-1 text-[11px] text-red-300">{error}</p>
        ) : (
          <p className="mt-1 text-[11px] text-white/50">
            {enabled === null ? 'Cargando…' : enabled === false ? 'Nadie puede comprar.' : 'Los compradores pueden pagar.'}
          </p>
        )}
      </div>

      {confirming && (
        <AdminPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="admin-fade absolute inset-0 bg-black/70" onClick={() => setConfirming(false)} aria-hidden />
          <div role="alertdialog" aria-modal="true" className="admin-pop relative w-full max-w-md rounded-lg border border-white/10 bg-admin-raised p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Inhabilitar pagos en toda la plataforma</h3>
            <p className="mt-2 text-sm text-white/60">
              Ningún comprador va a poder agregar al carrito ni crear órdenes en <b className="text-white/80">ningún evento</b> hasta que lo
              vuelvas a habilitar. Las órdenes ya creadas no se tocan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Btn onClick={() => setConfirming(false)} disabled={saving}>
                Volver
              </Btn>
              <Btn variant="danger" onClick={() => apply(false)} disabled={saving}>
                {saving ? 'Guardando…' : 'Inhabilitar pagos'}
              </Btn>
            </div>
          </div>
        </div>
        </AdminPortal>
      )}
    </>
  )
}
