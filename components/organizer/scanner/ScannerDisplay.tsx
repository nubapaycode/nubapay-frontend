'use client'

import { Maximize, QrCode } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { type ScanDisplayMessage, subscribeScans } from '@/lib/scanner/displayChannel'
import { cn } from '@/lib/utils'

/** Tiempo que queda el resultado en pantalla antes de volver a "Mostrá tu QR". */
const SHOW_MS = 6000
/** Lecturas que se ven en la tira de abajo. */
const HISTORY_SIZE = 6

const INK = '#0A0A0F'
const ACCENT = 'var(--organizer-accent, #C6FF00)'
const ACCENT_INK = 'var(--organizer-accent-ink, #0A0F00)'
const DANGER = '#E5484D'
const WARNING = '#F76B15'

/** Color de fondo de cada resultado (y del punto en la tira de últimas). */
const RESULT_BG: Record<ScanDisplayMessage['result'], string> = { ok: ACCENT, pending: WARNING, error: DANGER }

function useClock(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(t)
  }, [])
  return now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Pantalla para el público, conectada al escáner de la misma compu (ver `lib/scanner/displayChannel.ts`).
 * En espera, negra con "Mostrá tu QR"; con cada lectura, todo el fondo verde (acento de la marca) si pasa o
 * naranja si falta algo que se resuelve ahí (cobrar el efectivo) o rojo si no, con la patente (o el nº de pedido) bien grande. Pensada para un segundo monitor.
 */
export function ScannerDisplay() {
  const [msg, setMsg] = useState<ScanDisplayMessage | null>(null)
  const [history, setHistory] = useState<ScanDisplayMessage[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const clock = useClock()

  const show = useCallback((m: ScanDisplayMessage) => {
    setMsg(m)
    setHistory(h => [m, ...h].slice(0, HISTORY_SIZE))
  }, [])

  useEffect(() => subscribeScans(show), [show])

  // Vuelve a la espera un rato después de la última lectura (una nueva reinicia el tiempo).
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
  const background = msg ? RESULT_BG[msg.result] : INK
  const color = !msg ? '#FFFFFF' : ok ? ACCENT_INK : '#FFFFFF'

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden transition-colors duration-200"
      style={{ background, color, fontFamily: 'var(--font-geist-sans), sans-serif' }}
      role="status"
      aria-live="assertive"
      data-result={msg ? msg.result : 'idle'}
    >
      <header className="flex items-center justify-between px-[3vw] pt-[2.4vw]">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático del logo */}
        <img
          src="/logo-nubapay.svg"
          alt="nubapay"
          className="h-[2.2vw] min-h-[20px] w-auto"
          style={{ filter: !msg || !ok ? 'invert(1)' : undefined }}
        />
        <span className="text-[1.6vw] font-semibold tabular-nums opacity-60">{clock}</span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-[4vw] text-center">
        {!msg ? (
          <div className="nb-display-in flex flex-col items-center">
            <QrCode className="mb-[2.4vw] size-[8vw]" strokeWidth={1.5} style={{ color: ACCENT }} aria-hidden />
            <p className="text-[6vw] font-semibold leading-none tracking-tight">Mostrá tu QR</p>
            <p className="mt-[1.6vw] text-[2.2vw] text-white/50">Acercalo al lector para ingresar</p>
          </div>
        ) : (
          <div key={msg.at} className="nb-display-in flex max-w-full flex-col items-center">
            <p className="max-w-full truncate text-[14vw] font-black uppercase leading-none tracking-wide tabular-nums">
              {msg.headline}
            </p>
            {!ok && msg.reason && <p className="mt-[2.4vw] text-[3.4vw] font-semibold leading-tight">{msg.reason}</p>}
            {(msg.detail || msg.name) && (
              <p className={cn('max-w-full truncate text-[2.4vw] font-medium opacity-75', ok ? 'mt-[2.4vw]' : 'mt-[1vw]')}>
                {[msg.detail, msg.name].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        )}
      </main>

      <footer className="flex items-center gap-[2vw] overflow-hidden px-[3vw] pb-[2.4vw]">
        {history.length > 0 && (
          <ol aria-label="Últimas lecturas" className="flex min-w-0 gap-[2vw] opacity-60">
            {history.map(h => (
              <li key={h.at} className="flex shrink-0 items-center gap-[0.6vw] text-[1.5vw] font-semibold uppercase tabular-nums">
                <span
                  className="size-[0.9vw] min-h-2 min-w-2 rounded-full"
                  style={{ background: msg?.result === h.result ? 'currentColor' : RESULT_BG[h.result] }}
                  aria-hidden
                />
                {h.headline}
              </li>
            ))}
          </ol>
        )}
        {!isFullscreen && (
          <button
            type="button"
            onClick={goFullscreen}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/25"
          >
            <Maximize size={16} aria-hidden />
            Pantalla completa
          </button>
        )}
      </footer>

      <style>{`
        @keyframes nb-display-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }
        .nb-display-in { animation: nb-display-in 200ms cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .nb-display-in { animation: none; } }
      `}</style>
    </div>
  )
}
