'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, Check } from 'lucide-react'

import { gsap, MOTION_OK, useGSAP } from './gsap'
import { prefersReducedMotion } from './hooks'

const BIG = 'sin filas'
const RING = 'Agendá una demo · Agendá una demo · '
const NOTES = ['Sin tarjeta', 'Setup en 20 min', 'Cancelás cuando quieras']

/**
 * CTA final editorial: "sin filas." gigante a ancho completo cuyas letras suben ligadas al
 * scroll, y un botón circular lima con el texto girando en un anillo (acelera en hover).
 */
export default function FinalCta() {
  const rootRef = useRef<HTMLElement>(null)

  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      /* Las letras suben y se enderezan siguiendo el scroll */
      gsap.from('.lv2-cta3-char', {
        yPercent: 115, rotation: 10, ease: 'power3.out', stagger: 0.05,
        scrollTrigger: { trigger: '.lv2-cta3-big', start: 'top 92%', end: 'top 45%', scrub: 1 },
      })
      gsap.timeline({ defaults: { ease: 'expo.out' }, scrollTrigger: { trigger: '.lv2-cta3', start: 'top 70%', once: true } })
        .from('.lv2-cta3-fade', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 })
        .from('.lv2-cta3-circle', { scale: 0, rotation: -90, duration: 1.3, ease: 'back.out(1.6)' }, 0.3)
      gsap.to('.lv2-cta3-ring', { rotation: 360, transformOrigin: '50% 50%', duration: 16, ease: 'none', repeat: -1 })
    })
  }, { scope: rootRef })

  /* Hover del botón circular: el anillo acelera, el botón crece y la flecha apunta arriba */
  const spin = (el: HTMLElement, timeScale: number) => {
    const tween = gsap.getTweensOf(el.querySelector('.lv2-cta3-ring'))[0]
    if (tween) gsap.to(tween, { timeScale, duration: timeScale > 1 ? 0.6 : 1, ease: 'power2.out', overwrite: 'auto' })
  }
  const circleIn = contextSafe((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion()) return
    spin(e.currentTarget, 4)
    gsap.to(e.currentTarget, { scale: 1.07, duration: 0.6, ease: 'expo.out', overwrite: 'auto' })
    gsap.to(e.currentTarget.querySelector('.lv2-cta3-arrow'), { rotation: -45, scale: 1.15, duration: 0.6, ease: 'back.out(2)', overwrite: 'auto' })
  })
  const circleOut = contextSafe((e: React.MouseEvent<HTMLAnchorElement>) => {
    spin(e.currentTarget, 1)
    gsap.to(e.currentTarget, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' })
    gsap.to(e.currentTarget.querySelector('.lv2-cta3-arrow'), { rotation: 0, scale: 1, duration: 0.6, ease: 'expo.out', overwrite: 'auto' })
  })

  return (
    <section ref={rootRef} aria-labelledby="lv2-cta-h">
      <div className="lv2-wrap">
        <div className="lv2-cta lv2-cta3">
          <div className="lv2-cta-glow" aria-hidden="true" />

          <h2 id="lv2-cta-h" className="lv2-cta3-title">
            <span className="lv2-cta3-eyebrow lv2-cta3-fade">Tu próximo evento</span>
            <span className="lv2-cta3-big" aria-label="sin filas.">
              {BIG.split('').map((c, i) => (
                <span key={i} className="lv2-cta3-mask" aria-hidden="true">
                  <span className="lv2-cta3-char">{c === ' ' ? ' ' : c}</span>
                </span>
              ))}
              <span className="lv2-cta3-mask" aria-hidden="true"><span className="lv2-cta3-char lv2-cta3-dot">.</span></span>
            </span>
            <span className="lv2-cta3-sub lv2-cta3-fade">Mejor experiencia, <em>más ganancia.</em></span>
          </h2>

          <a href="#contacto" className="lv2-cta3-circle" aria-label="Agendá una demo" onMouseEnter={circleIn} onMouseLeave={circleOut}>
            <svg className="lv2-cta3-ring" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="lv2-cta3-ring-path" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
              </defs>
              <text><textPath href="#lv2-cta3-ring-path">{RING.toUpperCase()}</textPath></text>
            </svg>
            <span className="lv2-cta3-arrow" aria-hidden="true"><ArrowRight size={30} strokeWidth={1.6} /></span>
          </a>

          <div className="lv2-cta3-foot lv2-cta3-fade">
            <p>Te mostramos cómo funciona en tu evento, o probala por tu cuenta. Sin costos fijos: solo pagás cuando vendés.</p>
            <div className="lv2-cta3-side">
              <Link href="/register" className="lv2-btn lv2-btn--ghost lv2-btn--ghost-dark">Probá una demo</Link>
              <ul className="lv2-cta3-notes">
                {NOTES.map(n => <li key={n}><Check size={14} strokeWidth={2.4} aria-hidden="true" /> {n}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
