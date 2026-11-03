'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import type { DocImage, DocStep } from '@/lib/docs/organizerDocs'
import { cn } from '@/lib/utils'

const ACCENT = 'var(--organizer-accent, #C6FF00)'

/** Las capturas de pantalla completa miden 1470 px; las primeras 264 son la barra lateral del panel. */
const FULL_WIDTH = 1470
const SIDEBAR_PX = 264

/** Punto que señala dónde se toca, sobre la captura. */
function Spot({ x, y }: { x: number; y: number }) {
  return (
    <span
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden
    >
      <span
        className="doc-spot-ping absolute inset-0 rounded-full"
        style={{ backgroundColor: ACCENT }}
      />
      <span
        className="relative block size-4 rounded-full border-2 border-gray-900 shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_6px_16px_rgba(0,0,0,0.25)] sm:size-6 sm:border-[3px] sm:shadow-[0_0_0_4px_rgba(255,255,255,0.9),0_6px_16px_rgba(0,0,0,0.25)]"
        style={{ backgroundColor: ACCENT }}
      />
    </span>
  )
}

function Shot({ image, spot, priority, large }: { image: DocImage; spot?: DocStep['spot']; priority?: boolean; large?: boolean }) {
  if (image.phone) {
    return (
      <div
        className={cn(
          'relative mx-auto overflow-hidden rounded-[26px] border-[6px] border-gray-900 bg-gray-900 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)]',
          large ? 'h-[min(86vh,820px)]' : 'h-[300px] sm:h-[440px]',
        )}
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={large ? '420px' : '220px'}
          className="object-cover"
          priority={priority}
        />
        {spot ? <Spot {...spot} /> : null}
      </div>
    )
  }
  const crop = image.width === FULL_WIDTH
  const visible = crop ? image.width - SIDEBAR_PX : image.width
  const cropSpot = spot && crop ? { x: ((spot.x / 100) * image.width - SIDEBAR_PX) / visible * 100, y: spot.y } : spot
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_12px_32px_-16px_rgba(15,23,42,0.28)]"
      style={{ aspectRatio: `${visible} / ${image.height}` }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={large ? '100vw' : '(min-width: 1280px) 900px, (min-width: 768px) 75vw, 120vw'}
        className="absolute top-0 block h-full max-w-none"
        style={{ width: `${(image.width / visible) * 100}%`, left: `-${((image.width - visible) / visible) * 100}%` }}
        priority={priority}
      />
      {cropSpot ? <Spot {...cropSpot} /> : null}
    </div>
  )
}

/** Visor a pantalla completa. Se monta en `body` para que ningún `transform` del panel lo recorte. */
function Lightbox({
  step,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  step: DocStep
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, onPrev, onNext])

  return createPortal(
    <div
      className="doc-fade-in fixed inset-0 z-[80] flex flex-col bg-gray-950/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Paso ${index + 1}: ${step.title}`}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white sm:px-6" onClick={e => e.stopPropagation()}>
        <p className="min-w-0 truncate text-[13px]">
          <span className="text-white/50">Paso {index + 1} de {total} · </span>
          <span className="font-medium">{step.title}</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Cerrar"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16" onClick={e => e.stopPropagation()}>
        <div className={cn('w-full', step.image.phone ? 'max-w-none' : 'max-w-[1400px]')}>
          <Shot image={step.image} spot={step.spot} large />
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-2 pb-5" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={onPrev}
          disabled={index === 0}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Paso anterior"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={index === total - 1}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Paso siguiente"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Recorrido de una herramienta: la captura del paso activo, con el punto donde se toca,
 * y al lado (debajo en pantallas chicas) la explicación y la lista de pasos.
 * Se navega con clic, con los botones o con ← →.
 */
export function DocWalkthrough({ steps }: { steps: DocStep[] }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const step = steps[active]
  const total = steps.length

  const prev = useCallback(() => setActive(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setActive(i => Math.min(total - 1, i + 1)), [total])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
  }

  if (!step) return null

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white xl:grid-cols-[minmax(0,1fr)_300px]"
      onKeyDown={onKeyDown}
    >
      <div className={cn('relative flex items-center bg-gray-50 p-3 sm:p-5', step.image.phone && 'justify-center py-6')}>
        <button
          type="button"
          onClick={() => setZoom(true)}
          className={cn(
            'group relative block cursor-zoom-in rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900',
            step.image.phone ? 'w-auto' : 'w-full',
          )}
          aria-label={`Ampliar captura: ${step.image.alt}`}
        >
          <div key={step.image.src + active} className="doc-fade-in">
            <Shot image={step.image} spot={step.spot} priority={active === 0} />
          </div>
          <span className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-gray-900/80 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 size={12} aria-hidden />
            Ampliar
          </span>
        </button>
      </div>

      <div className="flex min-w-0 flex-col border-t border-gray-100 xl:border-l xl:border-t-0">
        <div className="px-4 pb-4 pt-4 sm:px-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden>
              {steps.map((s, i) => (
                <span
                  key={s.title}
                  className={cn('h-1 flex-1 rounded-full transition-colors duration-200', i <= active ? 'bg-gray-900' : 'bg-gray-200')}
                />
              ))}
            </div>
            <span className="shrink-0 text-[12px] tabular-nums text-gray-400">
              {active + 1} de {total}
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={prev}
                disabled={active === 0}
                className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-35"
                aria-label="Paso anterior"
              >
                <ChevronLeft size={15} aria-hidden />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={active === total - 1}
                className="flex size-7 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-35"
                aria-label="Paso siguiente"
              >
                <ChevronRight size={15} aria-hidden />
              </button>
            </div>
          </div>
          <div key={active} className="doc-fade-in" aria-live="polite">
            <span
              className="mb-2 inline-flex size-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums text-gray-900"
              style={{ backgroundColor: ACCENT }}
            >
              {active + 1}
            </span>
            <p className="text-[15px] font-semibold leading-6 tracking-[-0.01em] text-gray-900">{step.title}</p>
            <p className="mt-1 max-w-[66ch] text-[13.5px] leading-relaxed text-gray-600">{step.body}</p>
          </div>
        </div>

        <ol className="mt-auto border-t border-gray-100 py-1.5" aria-label="Todos los pasos">
          {steps.map((s, i) => {
            const isActive = i === active
            return (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-4 py-1.5 text-left text-[12.5px] transition-colors sm:px-5',
                    isActive ? 'font-medium text-gray-900' : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold tabular-nums',
                      isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 truncate">{s.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {zoom ? (
        <Lightbox step={step} index={active} total={total} onClose={() => setZoom(false)} onPrev={prev} onNext={next} />
      ) : null}
    </div>
  )
}
