'use client'

import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Anima del valor anterior al nuevo (no desde 0) con easing cubic-out,
 * así al filtrar o refrescar los números se deslizan en lugar de reiniciarse.
 */
export function useAnimatedNumber(to: number, duration = 600) {
  const [val, setVal] = useState(to)
  const valRef = useRef(to)

  useEffect(() => {
    valRef.current = val
  }, [val])

  useEffect(() => {
    const from = valRef.current
    if (from === to || prefersReducedMotion()) {
      setVal(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      setVal(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setVal(to)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])

  return val
}

const MONEY_FMT = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const INT_FMT = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

/** `$ 1.234` con los centavos más chicos y apagados (`,50`), como en los extractos bancarios. */
export function Money({
  value,
  hidden = false,
  className,
}: {
  value: number
  hidden?: boolean
  className?: string
}) {
  if (hidden) {
    return (
      <span className={className} aria-label="Monto oculto">
        $ ••••
      </span>
    )
  }
  const [int, dec] = MONEY_FMT.format(Math.abs(value)).split(',')
  const sign = value < 0 ? '−' : ''
  return (
    <span className={className}>
      {sign}${int}
      {dec !== '00' && <span className="text-[0.6em] align-[0.45em] text-current opacity-50">,{dec}</span>}
    </span>
  )
}

export function AnimatedMoney({ value, hidden, className }: { value: number; hidden?: boolean; className?: string }) {
  const v = useAnimatedNumber(value, 800)
  // Durante la animación se redondea para que no titilen los centavos.
  return <Money value={v === value ? value : Math.round(v)} hidden={hidden} className={className} />
}

export function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const v = useAnimatedNumber(value, 500)
  return <span className={className}>{INT_FMT.format(Math.round(v))}</span>
}

export function formatCount(n: number) {
  return INT_FMT.format(n)
}

/** Variación porcentual contra el período anterior; null si no hay base para comparar. */
export function deltaPct(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous === 0) return null
  return ((current - previous) / previous) * 100
}

export function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct == null) return null
  const rounded = Math.round(pct)
  const up = rounded > 0
  const flat = rounded === 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
        flat ? 'bg-gray-100 text-gray-500' : up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
      }`}
    >
      <span aria-hidden>{flat ? '→' : up ? '↗' : '↘'}</span>
      {flat ? '0%' : `${up ? '+' : ''}${rounded}%`}
    </span>
  )
}
