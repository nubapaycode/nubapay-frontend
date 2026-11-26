'use client'

import { Check, Maximize, QrCode, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PlateBadge } from '@/components/organizer/scanner/PlateBadge'
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

/** Patente si la hay; si no, el número de pedido u OK/ERROR (lo que viene en `headline`). */
function isPlate(headline: string): boolean {
  return /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{5,8}$/.test(headline)
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(t)
  }, [])
  return now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Pantalla para el público, conectada al escáner de la misma compu (ver `lib/scanner/displayChannel.ts`).
 * Con el estilo de nubapay: en espera, negro con el acento; con cada lectura, verde (acento de la marca) si
 * pasa o rojo si no, con la patente como una chapa bien grande. Pensada para un segundo monitor.
 */
export function ScannerDisplay() {
  const [msg, setMsg] = useState<ScanDisplayMessage | null>(null)
  const [history, setHistory] = useState<ScanDisplayMessage[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const clock = useClock()

  useEffect(
    () =>
      subscribeScans(m => {
        setMsg(m)
        setHistory(h => [m, ...h].slice(0, HISTORY_SIZE))
      }),
    [],
  )

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
  const background = !msg ? INK : ok ? ACCENT : DANGER
  const color = !msg ? '#FFFFFF' : ok ? ACCENT_INK : '#FFFFFF'

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden transition-colors duration-200"
      style={{ background, color, fontFamily: 'var(--font-geist-sans), sans-serif' }}
      role="status"
      aria-live="assertive"
      data-result={msg ? msg.result : 'idle'}
    >
      {/* Marca + en vivo */}
      <header className="flex items-center justify-between px-[3vw] pt-[2.4vw]">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático del logo */}
        <img
          src="/logo-nubapay.svg"
          alt="nubapay"
          className="h-[2.4vw] min-h-[20px] w-auto"
          style={{ filter: !msg || !ok ? 'invert(1)' : undefined }}
        />
        <span className="flex items-center gap-[1vw] text-[1.4vw] font-semibold tabular-nums opacity-80">
          <span className="flex items-center gap-[0.6vw] rounded-full bg-current/10 px-[1vw] py-[0.4vw]">
            <span className="size-[0.8vw] min-h-2 min-w-2 animate-pulse rounded-full" style={{ background: msg ? 'currentColor' : ACCENT }} aria-hidden />
            En vivo
          </span>
          {clock}
        </span>
      </header>

      {/* Resultado */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-[4vw] text-center">
        {!msg ? (
          <div className="nb-display-in flex flex-col items-center">
            <span className="relative mb-[3vw] flex size-[14vw] items-center justify-center" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full opacity-20" style={{ background: ACCENT }} />
              <span className="relative flex size-full items-center justify-center rounded-full" style={{ background: ACCENT, color: ACCENT_INK }}>
                <QrCode className="size-[6.5vw]" strokeWidth={1.75} />
              </span>
            </span>
            <p className="text-[6vw] font-semibold leading-none tracking-tight">Mostrá tu QR</p>
            <p className="mt-[1.4vw] text-[2vw] text-white/50">Acercalo al lector para ingresar · Esperando lectura…</p>
          </div>
        ) : (
          <div key={msg.at} className="nb-display-in flex max-w-full flex-col items-center">
            <span
              className="mb-[2.4vw] inline-flex items-center gap-[1vw] rounded-full px-[2.2vw] py-[0.8vw] text-[3vw] font-bold uppercase tracking-wide"
              style={{ background: ok ? ACCENT_INK : '#FFFFFF', color: ok ? ACCENT : DANGER }}
            >
              {ok ? <Check className="size-[3vw]" strokeWidth={3} aria-hidden /> : <X className="size-[3vw]" strokeWidth={3} aria-hidden />}
              {ok ? 'Puede pasar' : 'No pasa'}
            </span>

            {isPlate(msg.headline) ? (
              <PlateBadge plate={msg.headline} size="xl" />
            ) : (
              <p className="max-w-full truncate text-[13vw] font-black leading-none tracking-tight">{msg.headline}</p>
            )}

            {!ok && msg.reason && <p className="mt-[2.4vw] text-[3.6vw] font-semibold leading-tight">{msg.reason}</p>}
            {(msg.detail || msg.name) && (
              <p className={cn('max-w-full truncate text-[2.4vw] font-medium opacity-80', ok ? 'mt-[2.4vw]' : 'mt-[1vw]')}>
                {[msg.detail, msg.name].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        )}
      </main>

      {/* Últimas lecturas */}
      <footer className="flex items-center gap-[1vw] overflow-hidden px-[3vw] pb-[2.4vw]">
        {history.length > 0 && (
          <>
            <span className="shrink-0 text-[1.2vw] font-semibold uppercase tracking-wider opacity-50">Últimas</span>
            <ol aria-label="Últimas lecturas" className="flex min-w-0 gap-[0.8vw]">
              {history.map(h => (
                <li
                  key={h.at}
                  className="flex shrink-0 items-center gap-[0.5vw] rounded-full px-[1.2vw] py-[0.5vw] text-[1.3vw] font-semibold tabular-nums"
                  style={{
                    background: msg ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <span
                    className="flex size-[1.4vw] min-h-3 min-w-3 items-center justify-center rounded-full"
                    style={{ background: h.result === 'ok' ? ACCENT : DANGER, color: h.result === 'ok' ? ACCENT_INK : '#FFFFFF' }}
                    aria-hidden
                  >
                    {h.result === 'ok' ? <Check className="size-[1vw]" strokeWidth={3.5} /> : <X className="size-[1vw]" strokeWidth={3.5} />}
                  </span>
                  {h.headline}
                </li>
              ))}
            </ol>
          </>
        )}
        {!isFullscreen && (
          <button
            type="button"
            onClick={goFullscreen}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/25"
          >
            <Maximize size={16} aria-hidden />
            Pantalla completa
          </button>
        )}
      </footer>

      <style>{`
        @keyframes nb-display-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
        .nb-display-in { animation: nb-display-in 220ms cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .nb-display-in { animation: none; } .animate-ping { animation: none; } }
      `}</style>
    </div>
  )
}
