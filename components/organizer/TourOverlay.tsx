'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import { useOrganizerPublicTheme } from '@/components/organizer/OrganizerThemeBridge'
import { organizerAccentColorsFromTheme } from '@/lib/organizerAccentCss'
import { useTour } from '@/lib/tour/tourContext'
import { tourSteps } from '@/lib/tour/tourSteps'

const PAD = 10
const TOOLTIP_W = 268

function findVisible(selector: string): Element | null {
  const els = document.querySelectorAll(selector)
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

type Rect = { x: number; y: number; w: number; h: number }

function measureRect(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

function tooltipStyle(rect: Rect, placement: string): React.CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (placement === 'right') {
    let left = rect.x + rect.w + PAD + 8
    if (left + TOOLTIP_W > vw - 8) left = rect.x - TOOLTIP_W - PAD - 8
    const top = Math.max(8, Math.min(rect.y + rect.h / 2 - 80, vh - 200))
    return { left, top }
  }
  if (placement === 'left') {
    const left = rect.x - TOOLTIP_W - PAD - 8
    const top = Math.max(8, Math.min(rect.y + rect.h / 2 - 80, vh - 200))
    return { left, top }
  }
  if (placement === 'bottom') {
    let left = rect.x + rect.w / 2 - TOOLTIP_W / 2
    left = Math.max(8, Math.min(left, vw - TOOLTIP_W - 8))
    const top = rect.y + rect.h + PAD + 8
    return { left, top }
  }
  // top
  let left = rect.x + rect.w / 2 - TOOLTIP_W / 2
  left = Math.max(8, Math.min(left, vw - TOOLTIP_W - 8))
  const top = rect.y - PAD - 8 - 160
  return { left, top }
}

function arrow(placement: string): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    border: '8px solid transparent',
  }
  if (placement === 'right') return { ...base, left: -16, top: '50%', marginTop: -8, borderRightColor: '#111827', borderLeftWidth: 0 }
  if (placement === 'left') return { ...base, right: -16, top: '50%', marginTop: -8, borderLeftColor: '#111827', borderRightWidth: 0 }
  if (placement === 'bottom') return { ...base, top: -16, left: '50%', marginLeft: -8, borderBottomColor: '#111827', borderTopWidth: 0 }
  return { ...base, bottom: -16, left: '50%', marginLeft: -8, borderTopColor: '#111827', borderBottomWidth: 0 }
}

export function TourOverlay() {
  const { step, active, advance, jumpTo, skip } = useTour()
  const pathname = usePathname()
  const pubTheme = useOrganizerPublicTheme()
  const { bg: ACC, fg: INK } = useMemo(() => organizerAccentColorsFromTheme(pubTheme), [pubTheme])
  const [rect, setRect] = useState<Rect | null>(null)
  const [wh, setWh] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const rafRef = useRef<number | null>(null)
  const currentStep = active ? tourSteps[step] : null

  // Auto-jump when navigating to a page that belongs to a later step
  useEffect(() => {
    if (!active) return
    const current = tourSteps[step]
    if (current.matchPath(pathname)) return
    // Find the first upcoming step that matches the current page
    for (let i = step + 1; i < tourSteps.length; i++) {
      if (tourSteps[i].matchPath(pathname)) {
        jumpTo(i)
        return
      }
    }
  }, [pathname, step, active, jumpTo])

  const measure = useCallback(() => {
    if (!currentStep) { setRect(null); return }
    const el = findVisible(currentStep.target)
    if (!el) { setRect(null); return }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    setRect(measureRect(el))
    setWh({ w: window.innerWidth, h: window.innerHeight })
  }, [currentStep])

  useLayoutEffect(() => {
    if (!active) { setRect(null); return }
    // Measure after DOM settles
    const id = requestAnimationFrame(() => {
      measure()
      // Keep re-measuring while tour is active
      function loop() {
        measure()
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    })
    return () => {
      cancelAnimationFrame(id)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [active, measure, pathname])

  useEffect(() => {
    if (!active) return
    const onResize = () => setWh({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active])

  if (!active || !currentStep) return null

  const isLast = step === tourSteps.length - 1
  const onCurrentPage = currentStep.matchPath(pathname)

  // When target is on a different page → show a floating hint nudging navigation
  if (!onCurrentPage || !rect) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#111827',
          color: '#fff',
          borderRadius: 100,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            background: ACC,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 5h8M5 1l4 4-4 4" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentStep.hint}</span>
        <button
          type="button"
          onClick={skip}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}
          aria-label="Omitir tour"
        >
          ×
        </button>
      </div>
    )
  }

  const { x, y, w, h } = rect
  const W = wh.w
  const H = wh.h

  // SVG mask: full screen dark with a rounded-rect hole
  const holeX = x - PAD
  const holeY = y - PAD
  const holeW = w + PAD * 2
  const holeH = h + PAD * 2
  const r = 10

  const tipPos = tooltipStyle(rect, currentStep.placement)
  const arrowStyle = arrow(currentStep.placement)

  return (
    <>
      {/* Backdrop with spotlight hole */}
      <svg
        style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none' }}
        width={W}
        height={H}
      >
        <defs>
          <mask id="nb-tour-mask">
            <rect x={0} y={0} width={W} height={H} fill="white" />
            <rect x={holeX} y={holeY} width={holeW} height={holeH} rx={r} fill="black" />
          </mask>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.62)" mask="url(#nb-tour-mask)" />
        {/* Spotlight ring */}
        <rect
          x={holeX}
          y={holeY}
          width={holeW}
          height={holeH}
          rx={r}
          fill="none"
          stroke={ACC}
          strokeWidth={2}
          strokeOpacity={0.6}
        />
      </svg>

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          zIndex: 9995,
          width: TOOLTIP_W,
          background: '#111827',
          color: '#fff',
          borderRadius: 16,
          padding: '16px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
          ...tipPos,
        }}
      >
        {/* Arrow */}
        <div style={arrowStyle} />

        {/* Step counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {tourSteps.map((_, i) => (
              <span
                key={i}
                style={{
                  display: 'block',
                  width: i === step ? 14 : 5,
                  height: 5,
                  borderRadius: 100,
                  background: i === step ? ACC : 'rgba(255,255,255,0.25)',
                  transition: 'width 0.2s, background 0.2s',
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={skip}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Omitir tour"
          >
            ×
          </button>
        </div>

        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {currentStep.title}
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
          {currentStep.content}
        </p>

        <button
          type="button"
          onClick={advance}
          style={{
            width: '100%',
            background: ACC,
            color: INK,
            border: 'none',
            borderRadius: 100,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
        >
          {isLast ? 'Listo ✓' : 'Siguiente →'}
        </button>
      </div>
    </>
  )
}
