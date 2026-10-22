'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleHelp, ScanLine, ShieldCheck, Users, X } from 'lucide-react'

import { gsap, MOTION_OK, useGSAP } from './gsap'
import { prefersReducedMotion, Reveal } from './hooks'
import SiteShell from './SiteShell'
import './notfound.css'

/* ───────── QR "roto" del 0 ───────── */

/**
 * QR de 21×21 dibujado a mano: los tres buscadores en las esquinas y el resto con un patrón
 * pseudoaleatorio de semilla fija (servidor y cliente generan exactamente lo mismo).
 */
const QR_SIZE = 21
const FINDERS = [[0, 0], [14, 0], [0, 14]]
const inFinder = (c: number, r: number) => FINDERS.some(([fc, fr]) => c >= fc - 1 && c <= fc + 7 && r >= fr - 1 && r <= fr + 7)

const QR_CELLS = (() => {
  let seed = 404
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const cells: [number, number][] = []
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      if (!inFinder(c, r) && rand() < 0.48) cells.push([c, r])
    }
  }
  return cells
})()

function BrokenQr() {
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} aria-hidden="true">
      {FINDERS.map(([c, r]) => (
        <g key={`${c}-${r}`}>
          <rect x={c} y={r} width="7" height="7" rx="1.4" fill="currentColor" />
          <rect x={c + 1} y={r + 1} width="5" height="5" rx="0.9" fill="var(--lv-lime)" />
          <rect x={c + 2} y={r + 2} width="3" height="3" rx="0.6" fill="currentColor" />
        </g>
      ))}
      {QR_CELLS.map(([c, r]) => (
        <rect key={`${c}-${r}`} className="lv2-nf-cell" x={c + 0.08} y={r + 0.08} width="0.84" height="0.84" rx="0.22" fill="currentColor" />
      ))}
    </svg>
  )
}

/* ───────── Datos ───────── */

/** Intentos de escaneo hasta que el QR "se arregla" (el easter egg). */
const MAX_TRIES = 3

type ScanState = 'idle' | 'scanning' | 'fail' | 'ok'

const SHORTCUTS = [
  { href: '/#como-funciona', icon: <ScanLine size={22} />, title: 'Cómo funciona', text: 'Del escaneo al retiro, en cuatro pasos.' },
  { href: '/#faq', icon: <CircleHelp size={22} />, title: 'Preguntas frecuentes', text: 'Las dudas más comunes, respondidas.' },
  { href: '/nosotros', icon: <Users size={22} />, title: 'Nosotros', text: 'El equipo detrás de Nubapay.' },
  { href: '/seguridad', icon: <ShieldCheck size={22} />, title: 'Seguridad', text: 'Cómo protegemos cada pedido y pago.' },
]

function statusText(scan: ScanState, tries: number) {
  if (scan === 'scanning') return 'Escaneando…'
  if (scan === 'ok') return '¡Listo! Encontramos el camino de vuelta'
  if (scan === 'fail') return `Código no válido · intento ${tries} de ${MAX_TRIES}`
  return 'Código no válido · Error 404'
}

/* ───────── Página ───────── */

export default function NotFoundPage() {
  const ref = useRef<HTMLElement>(null)
  const [scan, setScan] = useState<ScanState>('idle')
  const [tries, setTries] = useState(0)
  const router = useRouter()

  /* Si se llegó directo (sin historial en la pestaña), "Página anterior" lleva al inicio */
  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      /* Entrada: los 4 suben, el QR aparece girando y después el resto */
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
        .to('.lv2-nf-digit', { y: 0, rotation: 0, duration: 1.3, stagger: 0.14 })
        .to('.lv2-nf-qr', { scale: 1, rotation: -4, duration: 1.2, ease: 'back.out(1.6)' }, 0.2)
        .to('.lv2-nf-fade', { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.6)
        .to('.lv2-nf .lv2-mark--now', { '--mk': 1, duration: 0.9, ease: 'power3.inOut' }, 0.9)

      /* El QR "falla": algunos módulos parpadean como si el escáner no pudiera leerlos */
      const cells = gsap.utils.shuffle(gsap.utils.toArray<SVGRectElement>('.lv2-nf-cell')).slice(0, 40)
      gsap.to(cells, {
        opacity: 0.12, duration: 0.5, ease: 'sine.inOut', delay: 1.4,
        stagger: { each: 0.09, repeat: -1, yoyo: true, repeatDelay: 1.6 },
      })
    })
  }, { scope: ref })

  /* Easter egg: cada toque re-escanea el QR; falla con un temblor y al tercer intento se arregla */
  const rescan = contextSafe((e: React.MouseEvent<HTMLButtonElement>) => {
    const tile = e.currentTarget
    if (scan === 'scanning' || scan === 'ok') return
    const next = tries + 1
    const fixed = next >= MAX_TRIES
    setTries(next)
    setScan('scanning')

    const done = () => setScan(fixed ? 'ok' : 'fail')
    const heal = () => {
      gsap.killTweensOf('.lv2-nf-cell')
      gsap.to('.lv2-nf-cell', { opacity: 1, duration: 0.3 })
    }
    if (prefersReducedMotion()) {
      if (fixed) heal()
      done()
      return
    }

    const line = tile.querySelector<HTMLElement>('.lv2-nf-scan')
    /* El barrido en loop es una animación CSS: se apaga inline mientras GSAP mueve la línea */
    if (line) line.style.animation = 'none'
    const tl = gsap.timeline({
      onComplete: () => {
        if (line) { line.style.animation = ''; gsap.set(line, { clearProps: 'top' }) }
        done()
      },
    })
    tl.fromTo(line, { top: '14%' }, { top: '84%', duration: 0.42, ease: 'power2.inOut', yoyo: true, repeat: 1 })
    if (fixed) {
      tl.add(heal).to(tile, { scale: 1.08, rotation: 0, duration: 0.3, ease: 'power2.out' })
        .to(tile, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.45)' })
    } else {
      tl.to(tile, { keyframes: { x: [0, -16, 13, -9, 5, 0] }, duration: 0.55, ease: 'power2.out' })
    }
  })

  const ok = scan === 'ok'

  return (
    <SiteShell>
      <main ref={ref}>
        <section className="lv2-hero lv2-nf" aria-labelledby="lv2-nf-h1">
          <div className="lv2-hero-glow lv2-hero-glow--a" aria-hidden="true" />
          <div className="lv2-hero-glow lv2-hero-glow--b" aria-hidden="true" />
          <div className="lv2-wrap lv2-nf-inner">
            <div className="lv2-nf-code">
              <span className="lv2-nf-mask" aria-hidden="true"><span className="lv2-nf-digit">4</span></span>
              <button
                type="button"
                className={`lv2-nf-qr is-${scan}`}
                onClick={rescan}
                disabled={ok}
                aria-label={ok ? 'Código escaneado' : 'Escanear el código de nuevo'}
              >
                <BrokenQr />
                <i className="lv2-nf-corner lv2-nf-corner--tl" />
                <i className="lv2-nf-corner lv2-nf-corner--tr" />
                <i className="lv2-nf-corner lv2-nf-corner--bl" />
                <i className="lv2-nf-corner lv2-nf-corner--br" />
                <i className="lv2-nf-scan" />
                <span className="lv2-nf-ok" aria-hidden="true"><Check strokeWidth={3} /></span>
              </button>
              <span className="lv2-nf-mask" aria-hidden="true"><span className="lv2-nf-digit">4</span></span>
            </div>
            <p className={`lv2-nf-hint lv2-nf-fade${ok ? ' is-hidden' : ''}`} aria-hidden={ok}>
              Tocá el QR para escanearlo de nuevo
            </p>

            <p className={`lv2-nf-status lv2-nf-fade is-${scan}`} role="status">
              <i>{ok ? <Check size={13} strokeWidth={2.8} aria-hidden="true" /> : <X size={13} strokeWidth={2.8} aria-hidden="true" />}</i>
              {statusText(scan, tries)}
            </p>
            <h1 id="lv2-nf-h1" className="lv2-nf-title lv2-nf-fade">
              ¿Perdiste el <span className="lv2-mark lv2-mark--now">QR?</span>
            </h1>
            <p className="lv2-nf-text lv2-nf-fade">
              Esta página no existe o fue movida. Pasa hasta en las mejores fiestas: volvé al inicio y seguí desde ahí.
            </p>
            <div className="lv2-hero-cta lv2-nf-cta lv2-nf-fade">
              <button type="button" className="lv2-btn lv2-btn--ghost lv2-nf-back" onClick={goBack}>
                <ArrowLeft size={18} strokeWidth={1.6} aria-hidden="true" /> Página anterior
              </button>
              <Link href="/" className={`lv2-btn${ok ? ' is-ready' : ''}`}>
                Volver al inicio
                <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
              </Link>
            </div>
          </div>
        </section>

        <section className="lv2-section" aria-labelledby="lv2-nf-more">
          <div className="lv2-wrap">
            <Reveal className="lv2-head">
              <div>
                <h2 id="lv2-nf-more" className="lv2-h2">¿Buscabas<br />algo de <span className="lv2-mark">esto?</span></h2>
              </div>
              <p className="lv2-lead">Algunos atajos para que sigas desde donde querías llegar.</p>
            </Reveal>
            <div className="lv2-nf-links">
              {SHORTCUTS.map((s, i) => (
                <Reveal key={s.href} d={i * 0.07} className="lv2-card lv2-spot lv2-nf-link">
                  <div className="lv2-card-ico">{s.icon}</div>
                  <h3><Link href={s.href}>{s.title}</Link></h3>
                  <p>{s.text}</p>
                  <span className="lv2-nf-link-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
