'use client'

import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Btn, Toggle, useToast } from './ui'
import { fetchPlatformSettings, updatePlatformSettings } from '@/lib/platformAdmin'

/** Interruptor global de pagos. Muestra lo guardado y avisa si el servidor lo reporta distinto. */
export function PaymentsStrip({ onChanged }: { onChanged?: () => void }) {
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
      <div className="border-b border-white/[0.08] bg-[#0E0E15]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:px-6">
          <Toggle
            label="Pagos y compras"
            checked={!!enabled}
            disabled={enabled === null || saving}
            onChange={(v) => (v ? apply(true) : setConfirming(true))}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">
              Pagos y compras:{' '}
              <span className={enabled === null ? 'text-white/40' : enabled ? 'text-emerald-300' : 'text-red-300'}>
                {enabled === null ? 'cargando…' : enabled ? 'habilitados' : 'inhabilitados'}
              </span>
            </p>
            {error ? (
              <p className="text-xs text-red-300">{error}</p>
            ) : enabled && effective === false ? (
              <p className="flex items-center gap-1 text-xs text-amber-300">
                <AlertTriangle size={12} /> Guardado como habilitado, pero el servidor lo reporta inhabilitado (revisar Redis en la pestaña Salud).
              </p>
            ) : (
              <p className="truncate text-xs text-white/40">
                {enabled === false ? 'Nadie puede agregar al carrito ni crear órdenes.' : 'Los compradores pueden agregar al carrito y pagar.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirming(false)} aria-hidden />
          <div role="alertdialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#14141D] p-5 shadow-2xl">
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
      )}
    </>
  )
}
