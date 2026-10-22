'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import { gsap, useGSAP } from './gsap'
import { lockScroll, prefersReducedMotion, scrollToHash, useActiveSection } from './hooks'
import MenuArt, { type MenuArtKind } from './MenuArt'

/* ───────── Datos ───────── */

/** Secciones destacadas del menú: tarjetas con una ilustración lineal en blanco y negro. */
const FEATURED = [
  { id: 'como-funciona', title: 'Cómo funciona', text: 'Del escaneo al retiro, en cuatro pasos.', art: 'flow' },
  { id: 'panel', title: 'Panel', text: 'Pedidos, cobros y stock en tiempo real.', art: 'panel' },
  { id: 'caso-landia', title: 'Caso real', text: 'Landia, Córdoba: la barra sin filas.', art: 'crowd' },
] satisfies { id: string; title: string; text: string; art: MenuArtKind }[]

const MORE = [
  { id: 'entradas-y-parking', label: 'Entradas y parking' },
  { id: 'eventos', label: 'Tipos de evento' },
  { id: 'faq', label: 'Preguntas frecuentes' },
  { id: 'contacto', label: 'Contacto' },
]

const SECTION_IDS = [...FEATURED.map(f => f.id), ...MORE.map(m => m.id)]

/** Superficies oscuras de la página: cuando pasan por debajo de la barra, la barra se invierte (`.lv2-dark` para las de otras páginas). */
const DARK_SURFACES = '.lv2-cta, .lv2-f, .lv2-dark'
const BAR_Y = 44

const CONTACT_EMAIL = 'contacto@nubapay.app'

/* Borde de las tarjetas de vidrio del menú (mismo formato que el CSS para que GSAP interpole) */
const CARD_RING_OFF = 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.12), inset 0px 0px 0px 1px rgba(255, 255, 255, 0.05)'
const CARD_RING_ON = 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.18), inset 0px 0px 0px 1px rgba(198, 255, 0, 0.45)'

const LOGO = 'nubapay'.split('')

/** Alto (en unidades del SVG) de las barras del Panel en reposo: todas parejas; en hover crecen a su alto real. */
const SLAB_REST = 22
const slabRest = (_: number, el: SVGElement) => SLAB_REST / Number(el.dataset.h)

/** Paleta de la barra como variables CSS: GSAP las interpola al cambiar de tema. */
function palette(dark: boolean, solid: boolean, open: boolean) {
  return dark
    ? {
      '--nv-glass': `rgba(30, 30, 38, ${solid ? 0.78 : 0.58})`,
      '--nv-highlight': 'rgba(255, 255, 255, 0.14)',
      '--nv-lowlight': 'rgba(0, 0, 0, 0.25)',
      '--nv-fg': 'rgba(255, 255, 255, 1)',
      '--nv-burger-bg': 'rgba(255, 255, 255, 0.82)',
      '--nv-burger-fg': 'rgba(10, 10, 15, 1)',
      '--nv-burger-hl': 'rgba(255, 255, 255, 1)',
      '--nv-badge-bg': 'rgba(255, 255, 255, 1)',
      '--nv-badge-fg': 'rgba(0, 0, 0, 1)',
      '--nv-shadow': `rgba(0, 0, 0, ${open ? 0 : 0.35})`,
    }
    : {
      '--nv-glass': `rgba(255, 255, 255, ${solid ? 0.82 : 0.6})`,
      '--nv-highlight': 'rgba(255, 255, 255, 0.95)',
      '--nv-lowlight': 'rgba(10, 10, 15, 0.05)',
      '--nv-fg': 'rgba(10, 10, 15, 1)',
      '--nv-burger-bg': 'rgba(10, 10, 15, 0.78)',
      '--nv-burger-fg': 'rgba(255, 255, 255, 1)',
      '--nv-burger-hl': 'rgba(255, 255, 255, 0.22)',
      '--nv-badge-bg': 'rgba(0, 0, 0, 1)',
      '--nv-badge-fg': 'rgba(255, 255, 255, 1)',
      '--nv-shadow': 'rgba(10, 10, 15, 0.22)',
    }
}

/* ───────── Hooks ───────── */

function useOverDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const els = document.querySelectorAll<HTMLElement>(DARK_SURFACES)
      setDark([...els].some(el => {
        const r = el.getBoundingClientRect()
        return r.top <= BAR_Y && r.bottom >= BAR_Y
      }))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return dark
}

/* ───────── Navbar ───────── */

type Hover = React.SyntheticEvent<HTMLElement>

/**
 * `base` antepone una ruta a las anclas de secciones: en la landing va vacío (scroll suave en la misma
 * página); en otras páginas se pasa '/' para que naveguen a la sección de la home.
 * `center` es contenido opcional centrado en la barra (p. ej. el selector de las páginas legales).
 */
export default function Nav({ scrolled, base = '', center }: { scrolled: boolean; base?: string; center?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const overDark = useOverDark()
  const active = useActiveSection(SECTION_IDS)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  /* Estado inicial de lo que sólo existe para animarse */
  const { contextSafe } = useGSAP(() => {
    gsap.set('.lv2-menu-card-arrow', { scale: 0.6, rotate: -45, autoAlpha: 0 })
    /* Orígenes de los SVG fijados una vez y sin smoothOrigin: si no, GSAP compensa con una traslación que queda pegada */
    gsap.set('.lv2-art-slab', { transformOrigin: '50% 100%', smoothOrigin: false, scaleY: slabRest })
    gsap.set('.lv2-art-qr, .lv2-art-dot, .lv2-logo-badge', { transformOrigin: '50% 50%', smoothOrigin: false })
  }, { scope: headerRef })

  /* Tema de la barra: claro, oscuro (sobre superficies negras o con el menú abierto) y más opaco al scrollear */
  useGSAP(() => {
    gsap.to(headerRef.current, { ...palette(overDark || open, scrolled, open), duration: 0.6, ease: 'power2.out', overwrite: 'auto' })
  }, { dependencies: [overDark, open, scrolled], scope: headerRef })

  /**
   * Timeline de apertura. Se arma en cada apertura porque el círculo nace del centro del ☰
   * y su radio llega justo a la esquina más lejana: así toda la curva se ve en pantalla.
   */
  const buildTimeline = () => {
    const menu = menuRef.current!
    const btn = toggleRef.current!
    const q = gsap.utils.selector(menu)
    const [top, bottom] = btn.querySelectorAll('span')
    const tl = gsap.timeline({ paused: true })

    if (prefersReducedMotion()) {
      return tl
        .set(menu, { clipPath: 'none' })
        .fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
        .set(top, { y: 3, rotate: 45 }, 0)
        .set(bottom, { y: -3, rotate: -45 }, 0)
    }

    const r = btn.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8

    return tl
      .set(menu, { autoAlpha: 1 })
      .fromTo(menu,
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${radius}px at ${x}px ${y}px)`, duration: 1.25, ease: 'expo.inOut' }, 0)
      .to(top, { y: 3, rotate: 45, duration: 0.8, ease: 'expo.inOut' }, 0)
      .to(bottom, { y: -3, rotate: -45, duration: 0.8, ease: 'expo.inOut' }, 0)
      .fromTo(q('.lv2-menu-card'),
        { y: 110, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out', stagger: 0.09 }, 0.55)
      .fromTo(q('.lv2-menu-art'),
        { scale: 1.35 },
        { scale: 1, duration: 1.9, ease: 'expo.out', stagger: 0.09 }, 0.55)
      .fromTo(q('.lv2-menu-line'),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.055 }, 0.7)
      .fromTo(q('.lv2-menu-ctas > *, .lv2-menu-meta'),
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, 0.9)
  }

  /* Abrir reproduce el timeline; cerrar lo rebobina más rápido (y retoma si se reabre a mitad) */
  useGSAP(() => {
    const tl = tlRef.current
    if (open) {
      if (tl && tl.reversed() && tl.progress() > 0) {
        tl.timeScale(1).play()
        return
      }
      tl?.kill()
      tlRef.current = buildTimeline().play()
      /* Si se abrió con el hover activo, la línea corta vuelve a su largo para formar la ✕ */
      gsap.to(toggleRef.current!.querySelectorAll('span')[1], { right: 16, duration: 0.5, ease: 'expo.out', overwrite: 'auto' })
    } else if (tl) {
      tl.timeScale(2.2).reverse()
    }
  }, { dependencies: [open], scope: headerRef })

  /* ── Hovers ── (overwrite: un hover que sale corta al que todavía está entrando) */

  const tween = (target: gsap.TweenTarget, vars: gsap.TweenVars) => gsap.to(target, { overwrite: 'auto', ...vars })

  /* Logo: las letras ruedan en cascada y el badge gira y redibuja el check */
  const logoIn = contextSafe((e: Hover) => {
    if (prefersReducedMotion()) return
    const q = gsap.utils.selector(e.currentTarget)
    const rolls = q('.lv2-logo-roll')
    /* Al terminar vuelve a 0 sin que se note (las dos copias son iguales), así el efecto se repite en cada hover */
    gsap.fromTo(rolls, { yPercent: 0 }, {
      yPercent: -50, duration: 0.65, ease: 'expo.out', stagger: 0.035, overwrite: 'auto', onComplete: () => { gsap.set(rolls, { yPercent: 0 }) },
    })
    gsap.fromTo(q('.lv2-logo-badge'), { rotation: 0 }, { rotation: 360, duration: 0.9, ease: 'expo.inOut', overwrite: 'auto' })
    gsap.fromTo(q('.lv2-logo-check'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out', delay: 0.4, overwrite: 'auto' })
  })

  const press = contextSafe((e: Hover) => { tween(e.currentTarget, { scale: 0.95, duration: 0.2, ease: 'power2.out' }) })
  const release = contextSafe((e: Hover) => { tween(e.currentTarget, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' }) })

  const fadeIn = contextSafe((e: Hover) => { tween(e.currentTarget.querySelector('span'), { opacity: 1, duration: 0.3, ease: 'power2.out' }) })
  const fadeOut = contextSafe((e: Hover) => { tween(e.currentTarget.querySelector('span'), { opacity: 0.66, duration: 0.4, ease: 'power2.out' }) })

  /* La flecha y el ancho los maneja `useCtaHover` (igual que en los demás CTA); acá sólo el vidrio lima se vuelve más opaco */
  const ctaIn = contextSafe((e: Hover) => {
    tween(e.currentTarget, { backgroundColor: 'rgba(212, 255, 61, 0.92)', duration: 0.4, ease: 'power2.out' })
  })
  const ctaOut = contextSafe((e: Hover) => {
    tween(e.currentTarget, { backgroundColor: 'rgba(198, 255, 0, 0.72)', duration: 0.5, ease: 'power2.out' })
  })

  const burgerIn = contextSafe((e: Hover) => {
    /* Acorta la línea de abajo con `right` para no pisar la rotación del ✕ */
    if (!open) tween(e.currentTarget.querySelectorAll('span')[1], { right: '48%', duration: 0.5, ease: 'expo.out' })
  })
  const burgerOut = contextSafe((e: Hover) => {
    tween(e.currentTarget.querySelectorAll('span')[1], { right: 16, duration: 0.5, ease: 'expo.out' })
  })

  /* Detalle de cada composición: el QR se arma, las barras crecen, el público late */
  const artIn = (card: HTMLElement) => {
    const q = gsap.utils.selector(card)
    gsap.fromTo(q('.lv2-art-qr'), { scale: 0 }, {
      scale: 1, duration: 0.5, ease: 'back.out(2.5)', stagger: { each: 0.02, from: 'random' }, overwrite: 'auto',
    })
    tween(q('.lv2-art-slab'), { scaleY: 1, duration: 1.1, ease: 'expo.out', stagger: 0.05 })
    gsap.fromTo(q('.lv2-art-dot'), { scale: 0.3 }, {
      scale: 1, duration: 0.9, ease: 'back.out(2)', stagger: { each: 0.012, from: 'center' }, overwrite: 'auto',
    })
    tween(q('.lv2-art-waves'), { x: -6, duration: 1.2, ease: 'expo.out' })
  }
  const artOut = (card: HTMLElement) => {
    const q = gsap.utils.selector(card)
    tween(q('.lv2-art-waves'), { x: 0, duration: 0.9, ease: 'expo.out' })
    tween(q('.lv2-art-slab'), { scaleY: slabRest, duration: 0.8, ease: 'expo.out', stagger: { each: 0.03, from: 'end' } })
  }

  const cardIn = contextSafe((e: Hover) => {
    const card = e.currentTarget
    tween(card, { boxShadow: CARD_RING_ON, backgroundColor: 'rgba(255, 255, 255, 0.09)', duration: 0.4, ease: 'power2.out' })
    tween(card.querySelector('.lv2-menu-art'), { scale: 1.06, duration: 1.1, ease: 'expo.out' })
    artIn(card)
    tween(card.querySelector('.lv2-menu-card-arrow'), { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.7, ease: 'back.out(1.8)' })
  })
  const cardOut = contextSafe((e: Hover) => {
    const card = e.currentTarget
    tween(card, { boxShadow: CARD_RING_OFF, backgroundColor: 'rgba(255, 255, 255, 0.05)', duration: 0.5, ease: 'power2.out' })
    tween(card.querySelector('.lv2-menu-art'), { scale: 1, duration: 1.1, ease: 'expo.out' })
    artOut(card)
    tween(card.querySelector('.lv2-menu-card-arrow'), { scale: 0.6, rotate: -45, autoAlpha: 0, duration: 0.35, ease: 'power2.in' })
  })

  /* "Roll": el texto sube y entra su copia en lima desde abajo */
  const rollIn = contextSafe((e: Hover) => {
    tween(e.currentTarget.querySelector('.lv2-menu-roll'), { yPercent: -50, duration: 0.6, ease: 'expo.out' })
  })
  const rollOut = contextSafe((e: Hover) => {
    tween(e.currentTarget.querySelector('.lv2-menu-roll'), { yPercent: 0, duration: 0.6, ease: 'expo.out' })
  })

  const metaIn = contextSafe((e: Hover) => { tween(e.currentTarget, { color: 'rgba(255, 255, 255, 1)', duration: 0.3, ease: 'power2.out' }) })
  const metaOut = contextSafe((e: Hover) => { tween(e.currentTarget, { color: 'rgba(255, 255, 255, 0.5)', duration: 0.4, ease: 'power2.out' }) })

  /* Anclas: cerramos el menú, liberamos Lenis y recién ahí scrolleamos */
  const go = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const hash = e.currentTarget.getAttribute('href')
    if (!hash?.startsWith('#')) return
    e.preventDefault()
    lockScroll(false)
    setOpen(false)
    scrollToHash(hash)
  }, [])

  useEffect(() => {
    if (!open) return
    lockScroll(true)
    menuRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !headerRef.current) return
      /* Foco atrapado entre la barra y el menú mientras está abierto */
      const items = [...headerRef.current.querySelectorAll<HTMLElement>('a[href], button')]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lockScroll(false)
    }
  }, [open])

  const tab = open ? 0 : -1
  const A = base ? Link : 'a'

  return (
    <header ref={headerRef} className={`lv2-nav${open ? ' is-open' : ''}`}>
      <div className="lv2-nav-bar">
        <Link
          href="/"
          className="lv2-nav-chip lv2-logo"
          aria-label="Nubapay, ir al inicio"
          onMouseEnter={logoIn}
        >
          {/* Cada letra es una máscara con su copia abajo: en hover ruedan en cascada */}
          <span className="lv2-logo-word" aria-hidden="true">
            {LOGO.map((c, i) => (
              <span key={i} className="lv2-logo-char"><span className="lv2-logo-roll"><span>{c}</span><span>{c}</span></span></span>
            ))}
          </span>
          {/* Verificado del footer, en blanco y negro (se invierte sobre fondos oscuros) */}
          <svg className="lv2-logo-badge" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
              fill="var(--nv-badge-bg)"
            />
            <path className="lv2-logo-check" d="m9 12 2 2 4-4" pathLength={1} strokeDasharray="1" fill="none" stroke="var(--nv-badge-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {center && <div className="lv2-nav-center">{center}</div>}
        <div className="lv2-nav-actions">
          <Link href="/login" className="lv2-nav-chip lv2-nav-login" onMouseEnter={fadeIn} onMouseLeave={fadeOut}>
            <span>Iniciar sesión</span>
          </Link>
          <A
            href={`${base}#contacto`}
            className="lv2-nav-cta"
            onClick={go}
            onMouseEnter={ctaIn}
            onMouseLeave={e => { ctaOut(e); release(e) }}
            onPointerDown={press}
            onPointerUp={release}
          >
            Agendá una demo <i><ArrowRight size={15} strokeWidth={1.8} /></i>
          </A>
          <button
            ref={toggleRef}
            type="button"
            className="lv2-nav-burger"
            aria-expanded={open}
            aria-controls="lv2-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen(o => !o)}
            onMouseEnter={burgerIn}
            onMouseLeave={e => { burgerOut(e); release(e) }}
            onPointerDown={press}
            onPointerUp={release}
          >
            <span /><span />
          </button>
        </div>
      </div>

      <div ref={menuRef} id="lv2-menu" className="lv2-menu" role="dialog" aria-label="Menú" aria-hidden={!open} tabIndex={-1} data-lenis-prevent>
        <div className="lv2-wrap lv2-menu-inner">
          <nav className="lv2-menu-cards" aria-label="Secciones destacadas">
            {FEATURED.map((f, i) => (
              <A
                key={f.id}
                href={`${base}#${f.id}`}
                onClick={go}
                onMouseEnter={cardIn}
                onMouseLeave={cardOut}
                onFocus={cardIn}
                onBlur={cardOut}
                tabIndex={tab}
                className={`lv2-menu-card${active === f.id ? ' is-here' : ''}`}
              >
                <span className="lv2-menu-media"><MenuArt kind={f.art} /></span>
                <span className="lv2-menu-card-body">
                  <small>0{i + 1}{active === f.id && <em>Estás acá</em>}</small>
                  <b>{f.title}</b>
                  <span>{f.text}</span>
                </span>
                <span className="lv2-menu-card-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
              </A>
            ))}
          </nav>

          <div className="lv2-menu-side">
            <ul className="lv2-menu-more" aria-label="Más secciones">
              {MORE.map(m => (
                <li key={m.id}>
                  <A
                    href={`${base}#${m.id}`}
                    onClick={go}
                    onMouseEnter={rollIn}
                    onMouseLeave={rollOut}
                    onFocus={rollIn}
                    onBlur={rollOut}
                    tabIndex={tab}
                    className={`lv2-menu-link${active === m.id ? ' is-here' : ''}`}
                  >
                    <span className="lv2-menu-line">
                      <span className="lv2-menu-roll" aria-hidden="true"><span>{m.label}</span><span>{m.label}</span></span>
                    </span>
                    <span className="sr-only">{m.label}</span>
                  </A>
                </li>
              ))}
            </ul>
            <div className="lv2-menu-ctas">
              <A href={`${base}#contacto`} onClick={go} tabIndex={tab} className="lv2-btn">
                Agendá una demo
                <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
              </A>
              <Link href="/login" tabIndex={tab} className="lv2-btn lv2-btn--ghost lv2-btn--ghost-dark">Iniciar sesión</Link>
            </div>
            <div className="lv2-menu-meta">
              <a href={`mailto:${CONTACT_EMAIL}`} tabIndex={tab} onMouseEnter={metaIn} onMouseLeave={metaOut}>{CONTACT_EMAIL}</a>
              <a href="https://www.instagram.com/nubapay.app" target="_blank" rel="noopener noreferrer" tabIndex={tab} onMouseEnter={metaIn} onMouseLeave={metaOut}>@nubapay.app</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
