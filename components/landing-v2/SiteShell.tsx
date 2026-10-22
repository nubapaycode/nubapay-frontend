'use client'

import { useRef } from 'react'

import { useCtaHover, usePointerEffects, useReveal, useScrollState, useSmoothScroll } from './hooks'
import Footer from './Footer'
import Nav from './Nav'
import 'lenis/dist/lenis.css'
import './landing-v2.css'

/**
 * Marco de las páginas fuera de la home (nosotros, legales, seguridad): navbar y footer de la landing
 * con las anclas apuntando a la home, scroll suave, barra de progreso y las entradas `.lv2-reveal`.
 */
export default function SiteShell({ children, navCenter }: { children: React.ReactNode; navCenter?: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrolled = useScrollState(rootRef)
  useSmoothScroll()
  useReveal(rootRef)
  usePointerEffects(rootRef)
  useCtaHover(rootRef)

  return (
    <div ref={rootRef} className="lv2-root">
      <span id="lv2-top" aria-hidden="true" />
      <div className="lv2-progress" aria-hidden="true" />
      <Nav scrolled={scrolled} base="/" center={navCenter} />
      {children}
      <Footer base="/" />
    </div>
  )
}
