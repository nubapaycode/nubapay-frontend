'use client'

import { useEffect, useRef } from 'react'

const DEFAULT_DURATION_MS = 2200

/**
 * Tarjeta verde de "cuenta conectada" con check animado (mismo lenguaje que el flash de pago aprobado del comprador).
 * Va dentro del contenido de la herramienta, sin tapar el sidebar.
 * Llama a `onDone` al terminar; quien la usa decide a dónde navegar.
 */
export function ConnectionApprovedOverlay({
  title,
  subtitle,
  onDone,
  durationMs = DEFAULT_DURATION_MS,
}: {
  title: string
  subtitle?: string
  onDone: () => void
  durationMs?: number
}) {
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  useEffect(() => {
    const id = window.setTimeout(() => onDoneRef.current(), durationMs)
    return () => window.clearTimeout(id)
  }, [durationMs])

  return (
    <div
      role="status"
      aria-live="polite"
      className="nb-approved flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-3xl px-6 py-12 text-center"
      style={{ background: '#16A34A' }}
    >
      <style>{`
        @keyframes nb-approved-in {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes nb-approved-pop {
          0%   { transform: scale(0.3); opacity: 0; }
          70%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes nb-approved-draw { from { stroke-dashoffset: 56; } to { stroke-dashoffset: 0; } }
        @keyframes nb-approved-ring {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes nb-approved-text {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nb-approved       { animation: nb-approved-in 240ms ease-out both; }
        .nb-approved-pop   { animation: nb-approved-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
        .nb-approved-ring  { animation: nb-approved-ring 1.2s ease-out 0.55s both; }
        .nb-approved-check { stroke-dasharray: 56; stroke-dashoffset: 56; animation: nb-approved-draw 0.9s ease-out 0.25s forwards; }
        .nb-approved-text  { animation: nb-approved-text 400ms ease-out 0.6s both; }
        @media (prefers-reduced-motion: reduce) {
          .nb-approved, .nb-approved-pop, .nb-approved-text { animation: none; }
          .nb-approved-ring  { display: none; }
          .nb-approved-check { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="nb-approved-pop relative">
        <span aria-hidden className="nb-approved-ring absolute inset-0 rounded-full border-2 border-white" />
        <svg width="64" height="64" viewBox="0 0 88 88" fill="none" aria-hidden>
          <circle cx="44" cy="44" r="38" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
          <path
            className="nb-approved-check"
            d="M24 44l13 13 27-27"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="nb-approved-text">
        <p className="text-base font-semibold text-white">{title}</p>
        {subtitle && <p className="mt-1 text-[13px] text-white/80">{subtitle}</p>}
      </div>
    </div>
  )
}
