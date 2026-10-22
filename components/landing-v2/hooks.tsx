'use client'

import { useEffect, useRef, useState } from 'react'

import Lenis from 'lenis'

import { gsap, MOTION_OK, MOTION_REDUCED, ScrollTrigger, useGSAP } from './gsap'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Entrada de cada `.lv2-reveal` con `ScrollTrigger.batch`: los que entran juntos aparecen
 * escalonados. También les agrega `is-in`, que dispara los detalles en CSS (marcador lima,
 * cadena de verificación). Al terminar limpia los estilos inline para no pisar los hovers.
 */
export function useReveal(root: React.RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const els = gsap.utils.toArray<HTMLElement>('.lv2-reveal', root.current)
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: batch => {
          batch.forEach(el => el.classList.add('is-in'))
          gsap.fromTo(batch, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, clearProps: 'opacity,transform',
          })
        },
      })
    })
    mm.add(MOTION_REDUCED, () => { els.forEach(el => el.classList.add('is-in')) })
  }, { scope: root })
}

/**
 * Spotlight (`.lv2-spot`) y tilt del panel (`.lv2-tilt`) por delegación:
 * un solo listener en la raíz en vez de uno por tarjeta.
 */
export function usePointerEffects(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current
    if (!host) return
    if (prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return

    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      const spot = target?.closest<HTMLElement>('.lv2-spot')
      if (spot) {
        const r = spot.getBoundingClientRect()
        spot.style.setProperty('--mx', `${e.clientX - r.left}px`)
        spot.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
      const tilt = target?.closest<HTMLElement>('.lv2-tilt')
      if (tilt) {
        const inner = tilt.querySelector<HTMLElement>('.lv2-tilt-inner')
        if (inner) {
          const r = tilt.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - 0.5
          const y = (e.clientY - r.top) / r.height - 0.5
          inner.style.setProperty('--ry', `${x * 7}deg`)
          inner.style.setProperty('--rx', `${3 - y * 5}deg`)
        }
      }
    }
    const onLeave = (e: PointerEvent) => {
      const tilt = (e.target as HTMLElement | null)?.closest<HTMLElement>('.lv2-tilt')
      const inner = tilt?.querySelector<HTMLElement>('.lv2-tilt-inner')
      if (inner) {
        inner.style.removeProperty('--ry')
        inner.style.removeProperty('--rx')
      }
    }
    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerout', onLeave, { passive: true })
    return () => {
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerout', onLeave)
    }
  }, [root])
}

/**
 * Scroll suave con Lenis, movido por el ticker de GSAP para que ScrollTrigger (y el giro
 * del teléfono) lean exactamente la misma posición en cada frame. A diferencia de
 * ScrollSmoother, Lenis usa el scroll nativo, así que `position: sticky` sigue funcionando.
 */
let activeLenis: Lenis | null = null

/* El despeje para que el título no quede debajo del navbar fijo lo da `scroll-margin-top` en el CSS:
   Lenis lo respeta al scrollear a un elemento, así que no se le pasa `offset` (si no, se suma dos veces). */

/** Frena / reanuda el scroll de la página (p. ej. mientras hay un modal abierto). */
export function lockScroll(locked: boolean) {
  if (activeLenis) {
    if (locked) activeLenis.stop()
    else activeLenis.start()
  }
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

/** Scroll a un ancla de la página: con Lenis si está activo, nativo si no (movimiento reducido). */
export function scrollToHash(hash: string) {
  const el = document.querySelector<HTMLElement>(hash)
  if (!el) return
  if (activeLenis) activeLenis.scrollTo(el)
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.95, anchors: true })
    activeLenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      activeLenis = null
    }
  }, [])
}

/**
 * Hover de los CTA con flecha (`.lv2-btn` y el CTA del navbar): la flecha se achica y desaparece
 * y el botón se angosta de forma suave, quedando con el mismo padding a los dos lados.
 * La flecha no cambia de ancho (si no, el círculo se aplasta en una cápsula): un margen negativo
 * le quita su lugar en el layout mientras ella sólo escala y se desvanece.
 * Al angostarse el botón el puntero puede quedar afuera sin haberse ido; para no entrar en un
 * bucle de salir/entrar (el "rebote"), la salida se confirma contra el área original del botón.
 * Un solo listener delegado en la raíz cubre los botones de la página y del menú.
 */
const CTA = '.lv2-btn, .lv2-nav-cta'
const CTA_ARROW = '.lv2-btn-arrow, .lv2-nav-cta > i'

export function useCtaHover(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current
    if (!host || !window.matchMedia('(hover: hover)').matches) return

    /* Área del botón antes de angostarse y el seguimiento pendiente de cada uno */
    const areas = new WeakMap<HTMLElement, DOMRect>()
    const watchers = new Map<HTMLElement, (e: PointerEvent) => void>()

    const parts = (btn: HTMLElement) => {
      const arrow = btn.querySelector<HTMLElement>(CTA_ARROW)
      return arrow && getComputedStyle(arrow).display !== 'none' ? arrow : null
    }
    const duration = () => (prefersReducedMotion() ? 0 : 0.5)
    const stopWatching = (btn: HTMLElement) => {
      const w = watchers.get(btn)
      if (w) window.removeEventListener('pointermove', w)
      watchers.delete(btn)
    }

    const shrink = (btn: HTMLElement, arrow: HTMLElement) => {
      const cs = getComputedStyle(btn)
      if (!btn.style.paddingRight) btn.dataset.pr = cs.paddingRight
      areas.set(btn, btn.getBoundingClientRect())
      const gap = parseFloat(cs.columnGap) || 0
      gsap.killTweensOf(arrow, 'scale,opacity,visibility')
      gsap.to(arrow, { scale: 0, autoAlpha: 0, duration: duration() * 0.6, ease: 'power2.out' })
      gsap.to(arrow, { marginLeft: -(arrow.offsetWidth + gap), duration: duration(), ease: 'power3.inOut', overwrite: 'auto' })
      gsap.to(btn, { paddingRight: cs.paddingLeft, duration: duration(), ease: 'power3.inOut', overwrite: 'auto' })
    }
    const restore = (btn: HTMLElement, arrow: HTMLElement) => {
      stopWatching(btn)
      areas.delete(btn)
      gsap.to(arrow, { marginLeft: 0, duration: duration(), ease: 'power3.inOut', overwrite: 'auto' })
      gsap.killTweensOf(arrow, 'scale,opacity,visibility')
      gsap.to(arrow, {
        scale: 1, autoAlpha: 1, duration: duration() * 0.7, delay: duration() * 0.3, ease: 'back.out(2)',
        clearProps: 'opacity,visibility,transform',
      })
      gsap.to(btn, { paddingRight: btn.dataset.pr, duration: duration(), ease: 'power3.inOut', overwrite: 'auto', clearProps: 'paddingRight' })
    }

    const onOver = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>(CTA)
      if (!btn || btn.contains(e.relatedTarget as Node | null)) return
      const arrow = parts(btn)
      if (!arrow) return
      if (watchers.has(btn)) { stopWatching(btn); return } /* volvió antes de irse: ya está angosto */
      shrink(btn, arrow)
    }
    const onOut = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>(CTA)
      if (!btn || btn.contains(e.relatedTarget as Node | null)) return
      const arrow = parts(btn)
      if (!arrow) return
      const inside = (x: number, y: number) => {
        const r = areas.get(btn)
        return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
      }
      if (!inside(e.clientX, e.clientY)) { restore(btn, arrow); return }
      /* Quedó afuera porque el botón se angostó: espera a que el puntero deje el área original */
      stopWatching(btn)
      const watch = (ev: PointerEvent) => { if (!inside(ev.clientX, ev.clientY)) restore(btn, arrow) }
      watchers.set(btn, watch)
      window.addEventListener('pointermove', watch, { passive: true })
    }

    host.addEventListener('mouseover', onOver)
    host.addEventListener('mouseout', onOut)
    return () => {
      host.removeEventListener('mouseover', onOver)
      host.removeEventListener('mouseout', onOut)
      watchers.forEach(w => window.removeEventListener('pointermove', w))
    }
  }, [root])
}

/** Barra de progreso de scroll + estado `scrolled` del navbar. */
export function useScrollState(root: React.RefObject<HTMLElement | null>) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const host = root.current
    if (!host) return
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      host.style.setProperty('--lv-progress', String(max > 0 ? Math.min(window.scrollY / max, 1) : 0))
      setScrolled(window.scrollY > 24)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [root])
  return scrolled
}

/** Sección activa (scroll-spy) para el navbar. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')
  useEffect(() => {
    const els = key.split('|').map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (!els.length || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [key])
  return active
}

/**
 * Número que cuenta desde 0 recién al entrar en viewport. El HTML del servidor trae el valor
 * final (SEO / sin JS); GSAP escribe el texto directo para no re-renderizar en cada frame.
 */
export function CountUp({ to, prefix = '', suffix = '', duration = 1.7 }: {
  to: number; prefix?: string; suffix?: string; duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const el = ref.current
    if (!el) return
    const write = (v: number) => { el.textContent = `${prefix}${Math.round(v)}${suffix}` }
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const counter = { v: 0 }
      write(0)
      gsap.to(counter, {
        v: to, duration, ease: 'power4.out', onUpdate: () => write(counter.v),
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    })
    mm.add(MOTION_REDUCED, () => write(to))
  }, { scope: ref, dependencies: [to, prefix, suffix, duration] })

  return <span ref={ref}>{prefix}{to}{suffix}</span>
}

/** Video que sólo reproduce mientras está en pantalla. */
export function LoopVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) v.play().catch(() => {})
      else v.pause()
    }, { threshold: 0.25 })
    obs.observe(v)
    return () => obs.disconnect()
  }, [])
  return (
    <video ref={ref} src={src} muted loop playsInline preload="metadata" aria-label={label} />
  )
}

/** Bloque que entra con `useReveal` (`d` queda como variable CSS para retrasos manuales). */
export function Reveal({ children, d = 0, className = '', as: Tag = 'div' }: {
  children: React.ReactNode; d?: number; className?: string; as?: 'div' | 'section' | 'header' | 'article' | 'li'
}) {
  return (
    <Tag className={`lv2-reveal ${className}`} style={{ '--d': `${d}s` } as React.CSSProperties}>
      {children}
    </Tag>
  )
}
