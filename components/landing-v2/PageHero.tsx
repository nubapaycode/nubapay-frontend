'use client'

import Link from 'next/link'
import { useRef } from 'react'

import { gsap, MOTION_OK, useGSAP } from './gsap'
import './pages.css'

const DOCS = [
  { id: 'terminos', label: 'Términos', href: '/terminos' },
  { id: 'privacidad', label: 'Privacidad', href: '/privacidad' },
  { id: 'seguridad', label: 'Seguridad', href: '/seguridad' },
] as const

export type DocId = (typeof DOCS)[number]['id']

/**
 * Selector entre los documentos legales y la página de seguridad. Va centrado en el navbar
 * (`inNav`, toma los colores de la barra) y, en pantallas angostas donde no entra, arriba del titular.
 */
export function DocTabs({ current, inNav = false }: { current: DocId; inNav?: boolean }) {
  return (
    <nav className={`lv2-pg-tabs${inNav ? ' lv2-pg-tabs--nav' : ''}`} aria-label="Documentos">
      {DOCS.map(d => (
        <Link key={d.id} href={d.href} className={d.id === current ? 'is-on' : ''} aria-current={d.id === current ? 'page' : undefined}>
          {d.label}
        </Link>
      ))}
    </nav>
  )
}

/**
 * Hero de las páginas internas: titular línea por línea (la última suele llevar el marcador
 * `lv2-mark lv2-mark--now`), y abajo el texto y lo que venga en `children`.
 */
export default function PageHero({ id, top, lines, intro, children }: {
  id: string; top?: React.ReactNode; lines: React.ReactNode[]; intro: React.ReactNode; children?: React.ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
        .to('.lv2-pg-top', { opacity: 1, y: 0, duration: 1 })
        .to('.lv2-line > span', { y: 0, duration: 1.2, stagger: 0.12 }, 0.05)
        .to('.lv2-mark--now', { '--mk': 1, duration: 0.9, ease: 'power3.inOut' }, '-=0.55')
        .to('.lv2-pg-hero-row', { opacity: 1, y: 0, duration: 1 }, '-=0.7')
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="lv2-hero lv2-pg-hero" aria-labelledby={id}>
      <div className="lv2-hero-glow lv2-hero-glow--a" aria-hidden="true" />
      <div className="lv2-hero-glow lv2-hero-glow--b" aria-hidden="true" />
      <div className="lv2-wrap lv2-pg-hero-inner">
        {top && <div className="lv2-pg-top lv2-fade-up">{top}</div>}
        <h1 id={id} className="lv2-h1">
          {lines.map((l, i) => <span key={i} className="lv2-line"><span>{l}</span></span>)}
        </h1>
        <div className="lv2-pg-hero-row lv2-fade-up">
          <p>{intro}</p>
          {children}
        </div>
      </div>
    </section>
  )
}
