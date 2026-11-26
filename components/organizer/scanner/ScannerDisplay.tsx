'use client'

import { Check, Maximize, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type ScanDisplayMessage, subscribeScans } from '@/lib/scanner/displayChannel'

/** Tiempo que queda el resultado en pantalla antes de volver a "Esperando…". */
const SHOW_MS = 6000

/**
 * Pantalla para el público, conectada al escáner de la misma compu: con cada lectura se pone verde (ingresó) o
 * roja (no pasó) a pantalla completa, con la patente bien grande. Pensada para un segundo monitor.
 */
export function ScannerDisplay() {
  const [msg, setMsg] = useState<ScanDisplayMessage | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => subscribeScans(setMsg), [])

  // Vuelve a "Esperando…" un rato después de la última lectura (una nueva reinicia el tiempo).
  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => setMsg(null), SHOW_MS)
    return () => window.clearTimeout(t)
  }, [msg])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const goFullscreen = () => {
    void document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const ok = msg?.result === 'ok'
  const bg = !msg ? '#111827' : ok ? '#16a34a' : '#dc2626'

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-[4vw] text-center text-white transition-colors duration-150"
      style={{ background: bg }}
      role="status"
      aria-live="assertive"
    >
      {!msg ? (
        <>
          <p className="text-[4vw] font-semibold tracking-tight text-white/80">Esperando lectura…</p>
          <p className="mt-[1vw] text-[1.6vw] text-white/40">Mostrá el QR en el lector</p>
        </>
      ) : (
        <>
          <span className="mb-[2vw] flex size-[9vw] items-center justify-center rounded-full bg-white/20" aria-hidden>
            {ok ? <Check className="size-[6vw]" strokeWidth={3} /> : <X className="size-[6vw]" strokeWidth={3} />}
          </span>
          <p className="text-[3.2vw] font-bold uppercase tracking-wide">{ok ? 'Puede pasar' : 'No pasa'}</p>
          <p className="mt-[1vw] max-w-full truncate font-mono text-[15vw] font-black leading-none tracking-wider">
            {msg.headline}
          </p>
          {!ok && msg.reason && <p className="mt-[2vw] text-[3.4vw] font-semibold">{msg.reason}</p>}
          {(msg.detail || msg.name) && (
            <p className="mt-[1.5vw] max-w-full truncate text-[2.4vw] text-white/85">
              {[msg.detail, msg.name].filter(Boolean).join(' · ')}
            </p>
          )}
        </>
      )}

      {!isFullscreen && (
        <button
          type="button"
          onClick={goFullscreen}
          className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
        >
          <Maximize size={16} aria-hidden />
          Pantalla completa
        </button>
      )}
    </div>
  )
}
