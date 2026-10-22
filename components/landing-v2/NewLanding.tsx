'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Bell, Building2, Car, Check, ChevronLeft, ChevronRight, Clock, CreditCard, LayoutDashboard, ListChecks,
  MapPin, Music, Plus, ScanLine, ShieldCheck, ShoppingBag, Store, Ticket, TrendingUp, Truck, Wine, Zap,
} from 'lucide-react'

import { browserFetch } from '@/lib/browserFetch'
import { gsap, MOTION_OK, MOTION_REDUCED, ScrollTrigger, useGSAP } from './gsap'
import { CountUp, LoopVideo, prefersReducedMotion, Reveal, useCtaHover, usePointerEffects, useReveal, useScrollState, useSmoothScroll } from './hooks'
import FinalCta from './FinalCta'
import Footer from './Footer'
import Nav from './Nav'
import Phone3D, { type PhoneSpin } from './Phone3D'
import RealPhone from './RealPhone'
import Tickets from './Tickets'
import 'lenis/dist/lenis.css'
import './landing-v2.css'

/* ───────── Datos ───────── */

/** Breakpoint del recorrido: el CSS pasa a una sola columna con `max-width: 900px`. */
const DESKTOP = '(min-width: 901px)'

/** Teléfono: `false` usa el iPhone SVG con capturas (RealPhone, sin three.js); `true` vuelve al 3D de Phone3D. */
const USE_3D = false

/** Pantallas del iPhone del hero, en el orden del flujo de compra. */
const SCREENS = ['Catálogo', 'Carrito', 'Pago', 'Retiro con QR']

const TICKER = [
  'Sin cajas', 'Menú digital', 'Entradas y parking', 'QR antifraude', 'Pagos online',
  'IA integrada', 'Tiempo real', 'Eventos masivos',
]

const STEPS = [
  { title: 'Escaneá el QR', text: 'El público entra al menú digital del evento desde el celular. Sin descargar nada y sin crear cuenta.', tags: ['Sin app', 'Sin registro', 'Un QR por barra'] },
  { title: 'Elegí y pedí', text: 'Catálogo con fotos, precios y stock en vivo. Agregan al carrito y confirman en segundos, desde su lugar.', tags: ['Stock en vivo', 'Combos', 'Por punto de retiro'] },
  { title: 'Pagá online', text: 'MercadoPago, transferencia o efectivo. El cobro entra directo a tu cuenta y el pedido pasa a preparación.', tags: ['MercadoPago', 'Transferencia', 'Efectivo'] },
  { title: 'Retirá sin fila', text: 'Muestran su QR único en el punto de retiro y reciben el pedido al instante. Cada código se usa una sola vez.', tags: ['QR único', 'Validación antifraude', '< 2 min'] },
]

/** Material real de Landia (Córdoba) para la tira tipo reels del caso real. */
const REELS = [
  { type: 'img', src: '/images/landia1.jpeg', alt: 'Escenario principal de Landia antes de abrir puertas', title: 'El escenario, listo', sub: 'Landia · Córdoba' },
  { type: 'video', src: '/videos/landiavideo3.mp4', alt: 'Asistentes llegando a Landia al atardecer', title: 'La previa', sub: 'Puertas abiertas, cae el sol' },
  { type: 'video', src: '/videos/landiavideo2.mp4', alt: 'Un asistente mostrando el QR de retiro de Nubapay en su celular durante el evento', title: 'Retiro con QR', sub: 'Pagó desde el celular, retiró sin fila', featured: true },
  { type: 'img', src: '/images/landia2.jpeg', alt: 'Público frente al escenario de Landia al atardecer', title: 'El público, en el show', sub: 'Nadie haciendo fila' },
  { type: 'video', src: '/videos/landiavideo1.mp4', alt: 'Show nocturno en el escenario principal de Landia', title: 'El show', sub: 'Pedidos toda la noche' },
] as { type: 'img' | 'video'; src: string; alt: string; title: string; sub: string; featured?: boolean }[]

const STATS = [
  { icon: <TrendingUp size={20} />, prefix: '+', to: 40, suffix: '%', label: 'aumento en ventas promedio por evento', sub: 'vs. sin plataforma' },
  { icon: <Clock size={20} />, prefix: '<', to: 2, suffix: ' min', label: 'tiempo de espera en retiro', sub: 'vs. 23 min promedio' },
  { icon: <ShieldCheck size={20} />, prefix: '', to: 100, suffix: '%', label: 'transacciones verificadas en blockchain', sub: 'unickeys · Solana' },
  { icon: <Zap size={20} />, prefix: '+', to: 3, suffix: 'x', label: 'velocidad de atención por punto de retiro', sub: 'vs. caja tradicional' },
]

const PANEL_CARDS = [
  { icon: <Bell size={20} />, title: 'Pedidos en tiempo real', text: 'Kanban de pedidos por estado: pagado, en preparación, listo y entregado.', stat: 'Actualización instantánea' },
  { icon: <MapPin size={20} />, title: 'Puntos de retiro', text: 'Barra Principal, VIP, Patio. Cada punto con su propio catálogo y su equipo.', stat: 'Ilimitados' },
  { icon: <CreditCard size={20} />, title: 'Cobros y comisiones', text: 'Conectá MercadoPago y mirá cada cobro y cada comisión sin planillas.', stat: 'Liquidación clara' },
  { icon: <ListChecks size={20} />, title: 'Catálogo y stock', text: 'Productos, categorías y combos. Pausá lo que se agota con un toque.', stat: 'Listo en 20 min' },
  { icon: <ScanLine size={20} />, title: 'Scanner de retiro', text: 'Tu staff valida cada QR desde su celular y entrega el pedido al instante.', stat: 'Sin hardware extra' },
]

const PASSES = [
  { kind: 'Acceso', title: 'Entrada General', text: 'Venta anticipada con QR de ingreso y control de aforo.', price: 'Ingreso con QR', icon: <Ticket size={22} />, cls: 'lv2-pass--soft', r: '-3deg' },
  { kind: 'Premium', title: 'Entrada VIP', text: 'Sectores diferenciados, barra exclusiva y acceso prioritario.', price: 'Sectores VIP', icon: <Zap size={22} />, cls: 'lv2-pass--lime', r: '-1deg' },
  { kind: 'Extras', title: 'Parking', text: 'Estacionamiento reservado con su propio QR de validación.', price: 'Reserva de lugar', icon: <Car size={22} />, cls: '', r: '1deg' },
  { kind: 'Merch', title: 'Combo + Merch', text: 'Remeras, vasos y combos de consumo en la misma compra.', price: 'Todo en una compra', icon: <ShoppingBag size={22} />, cls: 'lv2-pass--ink', r: '3deg' },
]

const EVENTS = [
  { icon: <Music size={22} />, title: 'Festivales y recitales', text: 'Control total de barras de bebidas, comidas y merchandising durante el show, sin colapsar el punto de venta.', stat: 'Miles de pedidos simultáneos' },
  { icon: <Wine size={22} />, title: 'Boliches y discotecas', text: 'Tragos y botellas sin interrumpir la fiesta. Pedís desde tu lugar con tu QR único.', stat: 'Retiro en segundos' },
  { icon: <Building2 size={22} />, title: 'Fiestas privadas y corporativas', text: 'Menú personalizado y visibilidad en tiempo real de cada venta y retiro.', stat: 'Control por sectores' },
  { icon: <Store size={22} />, title: 'Ferias y mercados gastronómicos', text: 'Cada stand con su catálogo y su punto de retiro independiente, en un solo panel.', stat: 'Un panel, todos los puestos' },
  { icon: <Truck size={22} />, title: 'Food trucks y barras móviles', text: 'El staff opera desde cualquier dispositivo y el asistente retira sin esperar turno.', stat: 'Sin hardware adicional' },
]

const FAQS = [
  { q: '¿Qué es Nubapay?', a: 'Nubapay es una plataforma para eventos que permite a los asistentes comprar desde el celular, pagar online y retirar su pedido con un QR, reduciendo filas y agilizando la atención en barras o puntos de entrega.' },
  { q: '¿Necesito descargar una app?', a: 'No. Nubapay funciona desde una web app responsive, por lo que los asistentes pueden acceder escaneando un QR o entrando desde un link, sin descargar nada.' },
  { q: '¿Qué tipo de eventos pueden usar Nubapay?', a: 'Puede usarse en boliches, festivales, fiestas, recitales, eventos privados, ferias, estadios o cualquier evento con venta de productos y puntos de retiro.' },
  { q: '¿El QR se puede usar más de una vez?', a: 'No. Cada QR es único y cuenta con validación antifraude para evitar que un mismo pedido sea retirado más de una vez.' },
  { q: '¿Puedo tener varios puntos de retiro?', a: 'Sí. Podés configurar diferentes barras o sectores —por ejemplo Barra Principal, Barra VIP, Patio o Sector Norte— y asignar productos específicos a cada punto.' },
  { q: '¿Puedo vender entradas y parking con Nubapay?', a: 'Sí. Además de consumos, podés vender entradas, estacionamiento, merchandising y otros extras desde la misma página del evento. Cada compra genera su propio QR para validar el acceso o el retiro.' },
  { q: '¿Cuánto tarda en configurarse Nubapay para un evento?', a: 'Muy poco. Podés tener el menú, los puntos de retiro y los pagos listos en menos de 20 minutos. No necesitás hardware especial ni conocimientos técnicos.' },
]

const CONTACT_EMAIL = 'contacto@nubapay.app'
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Consulta desde nubapay')}`
const CONTACT_FORMSPREE_ID =
  process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_FORM_ID || process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || 'mdeoggby'
const CONTACT_ENDPOINT = `https://formspree.io/f/${CONTACT_FORMSPREE_ID}`
const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONTACT_TOPICS = [
  { title: 'Eventos grandes', desc: 'Festivales, estadios o varios puntos de retiro.' },
  { title: 'Alianzas y prensa', desc: 'Productoras, sponsors y medios.' },
  { title: 'Soporte', desc: 'Dudas sobre tu cuenta o un evento en curso.' },
]

/* ───────── Piezas chicas ───────── */

function ArrowBtn({ href, children, ghost = false, dark = false }: {
  href: string; children: React.ReactNode; ghost?: boolean; dark?: boolean
}) {
  /* Las anclas internas (#contacto) van como <a> para que Lenis haga el scroll suave */
  const Tag = href.startsWith('#') ? 'a' : Link
  if (ghost) {
    return <Tag href={href} className={`lv2-btn lv2-btn--ghost${dark ? ' lv2-btn--ghost-dark' : ''}`}>{children}</Tag>
  }
  return (
    <Tag href={href} className="lv2-btn">
      {children}
      <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
    </Tag>
  )
}

/* ───────── Fondo detrás del teléfono ───────── */

/** Fondo detrás del teléfono: grilla de puntos y anillos tenues con una luz lima difusa (estilo Raycast). */
function StageBg() {
  return (
    <div className="lv2-bg" aria-hidden="true">
      <i className="lv2-bg-grid" />
      <i className="lv2-bg-rings" />
      <i className="lv2-bg-blob lv2-bg-blob--a" />
      <i className="lv2-bg-blob lv2-bg-blob--b" />
    </div>
  )
}

/* ───────── Hero ───────── */

function Hero() {
  const [screen, setScreen] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const paused = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const id = setInterval(() => {
      if (!paused.current && !document.hidden) setScreen(s => (s + 1) % SCREENS.length)
    }, 3400)
    return () => clearInterval(id)
  }, [])


  /* Entrada del hero: titular línea por línea, marcador y textos (el iPhone 3D anima su propia entrada) */
  const heroRef = useRef<HTMLElement>(null)
  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
        .to('.lv2-line > span', { y: 0, duration: 1.2, stagger: 0.12 })
        .to('.lv2-mark--now', { '--mk': 1, duration: 0.9, ease: 'power3.inOut' }, '-=0.55')
        .to('.lv2-hero-sub', { opacity: 1, y: 0, duration: 1 }, '-=0.7')
        .to('.lv2-hero-cta', { opacity: 1, y: 0, duration: 1 }, '-=0.8')
        .to('.lv2-stage', { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.3)
        .from('.lv2-bg', { scale: 0.82, opacity: 0, duration: 1.8, clearProps: 'transform,opacity' }, 0.3)
        .from('.lv2-dots', { opacity: 0, y: 12, duration: 0.8 }, 1.3)
        .from('.lv2-hero-arrow', { opacity: 0, scale: 0.6, duration: 0.9, ease: 'back.out(1.8)', stagger: 0.08 }, 1.2)
      /* El iPhone SVG sube desde abajo con un leve giro, en paralelo al titular (el 3D anima su propia entrada) */
      if (!USE_3D) {
        gsap.from('.lv2-stage .lv2-iphone', { y: 150, scale: 0.88, rotate: -5, opacity: 0, duration: 1.9, delay: 0.3, ease: 'expo.out', clearProps: 'transform,opacity' })
      }
    })
  }, { scope: heroRef })

  /* Flechas: cambian de pantalla y el ícono empuja hacia su lado */
  const step = contextSafe((dir: 1 | -1, e: React.MouseEvent<HTMLButtonElement>) => {
    setScreen(s => (s + dir + SCREENS.length) % SCREENS.length)
    gsap.timeline()
      .to(e.currentTarget, { scale: 0.9, duration: 0.12, ease: 'power2.out', overwrite: 'auto' })
      .to(e.currentTarget, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
  })
  const nudge = contextSafe((dir: 1 | -1 | 0, e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget.querySelector('svg'), { x: dir * 3, duration: 0.5, ease: 'expo.out', overwrite: 'auto' })
  })

  return (
    <section ref={heroRef} className="lv2-hero" aria-labelledby="lv2-h1">
      <div className="lv2-hero-glow lv2-hero-glow--a" aria-hidden="true" />
      <div className="lv2-hero-glow lv2-hero-glow--b" aria-hidden="true" />
      <div className="lv2-wrap lv2-hero-grid">
        <div>
          <h1 id="lv2-h1" className="lv2-h1">
            <span className="lv2-line"><span>Más ventas,</span></span>
            <span className="lv2-line"><span>menos filas,</span></span>
            <span className="lv2-line"><span><span className="lv2-mark lv2-mark--now">mejores eventos.</span></span></span>
            <span className="sr-only"> Nubapay: entradas, parking, menú digital, pagos móviles y retiro con QR para eventos y festivales.</span>
          </h1>
          <p className="lv2-hero-sub lv2-fade-up">
            <strong>Menú digital</strong>, pagos móviles y <strong>retiro con QR</strong> para eventos y festivales. Sin cajas. Sin caos.
          </p>
          <div className="lv2-hero-cta lv2-fade-up">
            <ArrowBtn href="#contacto">Agendá una demo</ArrowBtn>
            <a href="#como-funciona" className="lv2-btn lv2-btn--ghost">Ver cómo funciona</a>
          </div>
        </div>

        <div
          ref={stageRef}
          className="lv2-stage lv2-fade-up"
          onPointerLeave={() => { paused.current = false }}
          onPointerEnter={() => { paused.current = true }}
        >
          <StageBg />
          {USE_3D
            ? <Phone3D screen={screen} lift={20} />
            : <div className="lv2-phone-wrap"><RealPhone screen={screen} eager /></div>}

          <button type="button" className="lv2-hero-arrow lv2-hero-arrow--prev" aria-label="Pantalla anterior"
            onClick={e => step(-1, e)} onMouseEnter={e => nudge(-1, e)} onMouseLeave={e => nudge(0, e)}>
            <ChevronLeft size={22} strokeWidth={1.8} />
          </button>
          <button type="button" className="lv2-hero-arrow lv2-hero-arrow--next" aria-label="Pantalla siguiente"
            onClick={e => step(1, e)} onMouseEnter={e => nudge(1, e)} onMouseLeave={e => nudge(0, e)}>
            <ChevronRight size={22} strokeWidth={1.8} />
          </button>

          <div className="lv2-dots" role="tablist" aria-label="Pasos del flujo">
            {SCREENS.map((l, i) => (
              <button key={l} type="button" role="tab" aria-selected={screen === i} aria-label={l}
                className={screen === i ? 'is-on' : ''} onClick={() => setScreen(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Ticker() {
  return (
    <div className="lv2-ticker">
      <span className="sr-only">{TICKER.join(' · ')}</span>
      <div className="lv2-ticker-mask" aria-hidden="true">
        <div className="lv2-ticker-track">
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <div key={i} className="lv2-ticker-item">{t}<i /></div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────── Recorrido sticky ───────── */

function Journey() {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  const stickRef = useRef<HTMLDivElement>(null)

  const sectionRef = useRef<HTMLElement>(null)
  const spinRef = useRef<PhoneSpin>({ ry: 0, rx: 0, z: 0 })

  /* Desktop: teléfono 3D sticky que gira con el scroll. En mobile no se monta (ni three.js ni su WebGL):
     cada paso lleva su captura estática y listo. */
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const sync = () => setDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* El recorrido va del centro del primer paso al centro del último. Con movimiento:
     timeline con scrub, una vuelta de 360° por paso (con meseta de frente en cada uno) del iPhone 3D.
     La pantalla cambia a mitad de vuelta (180°), cuando se ve la espalda. */
  useGSAP(() => {
    const steps = refs.current.filter((el): el is HTMLDivElement => !!el)
    const host = stickRef.current?.parentElement
    const spin = spinRef.current
    if (steps.length < 2 || !host) return
    const last = steps.length - 1
    const range = {
      trigger: steps[0].parentElement,
      start: () => `top+=${steps[0].offsetHeight / 2} center`,
      end: () => `bottom-=${steps[last].offsetHeight / 2} center`,
      invalidateOnRefresh: true,
    }

    const mm = gsap.matchMedia()
    if (USE_3D) mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        /* scrub alto + Lenis: el giro "persigue" al scroll con inercia en vez de ir pegado */
        scrollTrigger: { ...range, scrub: 1.4 },
        onUpdate: () => {
          setActive(Math.min(Math.round(tl.time()), last))
          /* Las leen el halo del fondo y (en mobile) las tarjetas de texto */
          host.style.setProperty('--ryn', String(Math.sin(spin.ry) * 18))
          host.style.setProperty('--lift', String(spin.z))
        },
      })
      /* Vuelta en el 80% central de cada tramo, con curvas suaves de arranque y frenado */
      for (let i = 0; i < last; i++) {
        tl.to(spin, { ry: `+=${Math.PI * 2}`, duration: 0.8, ease: 'sine.inOut' }, i + 0.1)
          .to(spin, { z: 1, rx: 0.12, duration: 0.4, ease: 'sine.out' }, i + 0.1)
          .to(spin, { z: 0, rx: 0, duration: 0.4, ease: 'sine.in' }, i + 0.5)
      }
      tl.to({}, { duration: 0 }, last)
    })
    /* Sin 3D (o con movimiento reducido) el teléfono sólo cambia de pantalla según el paso visible */
    mm.add(USE_3D ? `${MOTION_REDUCED} and ${DESKTOP}` : DESKTOP, () => {
      ScrollTrigger.create({ ...range, onUpdate: self => setActive(Math.round(self.progress * last)) })
    })
  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} id="como-funciona" className="lv2-section" aria-labelledby="lv2-journey-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-journey-h" className="lv2-h2">Del escaneo<br />al <span className="lv2-mark">retiro.</span></h2>
          </div>
          <p className="lv2-lead">Tu público pide, paga y retira sin perderse el evento. Cuatro pasos, cero filas.</p>
        </Reveal>

        <div className="lv2-journey">
          <div className="lv2-journey-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} data-i={i} ref={el => { refs.current[i] = el }} className={`lv2-step${active === i ? ' is-on' : ''}`}>
                <div className="lv2-step-card">
                  <span className="lv2-step-num">0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <div className="lv2-step-tags">{s.tags.map(t => <span key={t}>{t}</span>)}</div>
                </div>
                {/* Sólo mobile (CSS): captura estática del paso, en lugar del teléfono 3D */}
                <div className="lv2-step-shot"><RealPhone screen={i} single /></div>
              </div>
            ))}
          </div>
          <div className="lv2-journey-stick" ref={stickRef}>
            <div className="lv2-journey-progress" aria-hidden="true">
              {STEPS.map((s, i) => <i key={s.title} className={active === i ? 'is-on' : ''} />)}
            </div>
            <StageBg />
            {desktop && (USE_3D
              ? <Phone3D screen={active} variant="journey" spin={spinRef} />
              : <div className="lv2-phone-wrap"><RealPhone screen={active} /></div>)}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────── Stats ───────── */

function Stats() {
  return (
    <section className="lv2-section lv2-stats-section" aria-label="Resultados">
      <div className="lv2-wrap">
        <Reveal className="lv2-stats">
          {STATS.map(s => (
            <div key={s.label} className="lv2-stat">
              <div className="lv2-stat-ico" aria-hidden="true">{s.icon}</div>
              <div className="lv2-stat-num"><CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} /></div>
              <p>{s.label}</p>
              <small>{s.sub}</small>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Panel ───────── */

function Panel() {
  return (
    <section id="panel" className="lv2-section" aria-labelledby="lv2-panel-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-panel-h" className="lv2-h2">Todo tu evento,<br />en <span className="lv2-mark">un panel.</span></h2>
          </div>
          <p className="lv2-lead">Mirá ventas, pedidos y retiros mientras pasan. Sin planillas, sin radios, sin sorpresas al cierre.</p>
        </Reveal>

        <div className="lv2-bento">
          <Reveal className="lv2-card lv2-bento-main lv2-spot">
            <div className="lv2-bento-main-top">
              <div className="lv2-card-ico"><LayoutDashboard size={22} /></div>
              <h3>Métricas en vivo del evento</h3>
              <p>Recaudación, pedidos activos, ventas por hora y ranking de productos. Todo actualizado en el momento.</p>
            </div>
            <div className="lv2-tilt">
              <div className="lv2-tilt-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/mock3.png" width={1697} height={927} loading="lazy"
                  alt="Panel del organizador de Nubapay: dashboard del evento con recaudación, pedidos y ventas por hora" />
              </div>
            </div>
          </Reveal>
          {PANEL_CARDS.map((c, i) => (
            <Reveal key={c.title} d={0.08 * (i + 1)} className="lv2-card lv2-bento-s lv2-spot">
              <div className="lv2-card-ico">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <span className="lv2-card-stat"><Check size={14} /> {c.stat}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────── Caso Landia ───────── */

function CaseStudy() {
  /* En responsive la tira de reels scrollea en horizontal: las flechas avanzan de a una tarjeta */
  const reelsRef = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })
  const onReelsScroll = () => {
    const el = reelsRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }
  const slide = (dir: 1 | -1, e: React.MouseEvent<HTMLButtonElement>) => {
    const el = reelsRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = (card?.offsetWidth ?? el.clientWidth * 0.8) + parseFloat(getComputedStyle(el).columnGap || '0')
    const to = gsap.utils.clamp(0, el.scrollWidth - el.clientWidth, el.scrollLeft + dir * step)
    /* Sin snap mientras GSAP mueve el scroll; si no, el snap pelea con el tween */
    el.style.scrollSnapType = 'none'
    gsap.to(el, {
      scrollLeft: to, duration: prefersReducedMotion() ? 0 : 0.7, ease: 'power3.out', overwrite: 'auto',
      onComplete: () => { el.style.scrollSnapType = '' },
    })
    gsap.timeline()
      .to(e.currentTarget, { scale: 0.9, duration: 0.12, ease: 'power2.out', overwrite: 'auto' })
      .to(e.currentTarget, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
  }

  return (
    <section id="caso-landia" className="lv2-section" aria-labelledby="lv2-case-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-case-h" className="lv2-h2">Menos filas,<br /><span className="lv2-mark">más ventas.</span></h2>
          </div>
          <p className="lv2-lead">Nubapay en un festival de Córdoba: la gente pidió desde el celular, pagó online y retiró su pedido mostrando el QR. Sin colas, sin efectivo.</p>
        </Reveal>

        {/* Tira tipo reels con material real del evento */}
        <div className="lv2-reels-wrap">
        <div ref={reelsRef} className="lv2-reels" onScroll={onReelsScroll}>
          {REELS.map((r, i) => (
            <Reveal key={r.src} d={i * 0.08} className={`lv2-reel${r.featured ? ' lv2-reel--feat' : ''}`}>
              {r.type === 'video'
                ? <LoopVideo src={r.src} label={r.alt} />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={r.src} alt={r.alt} loading="lazy" decoding="async" />}
              <div className="lv2-reel-cap" aria-hidden="true"><b>{r.title}</b><small>{r.sub}</small></div>
            </Reveal>
          ))}
        </div>

        <div className="lv2-reels-nav">
          <button type="button" className="lv2-reels-btn" aria-label="Ver anterior" disabled={edge.start} onClick={e => slide(-1, e)}>
            <ChevronLeft size={20} strokeWidth={1.8} />
          </button>
          <button type="button" className="lv2-reels-btn" aria-label="Ver siguiente" disabled={edge.end} onClick={e => slide(1, e)}>
            <ChevronRight size={20} strokeWidth={1.8} />
          </button>
        </div>
        </div>

        <Reveal className="lv2-quote">
          <q>Pidieron desde el celular, pagaron online y retiraron mostrando el QR.</q>
          <div className="lv2-quote-stats">
            <div><b>&lt;2 min</b>espera en retiro</div>
            <div><b>+40%</b>ventas promedio</div>
            <div><b>100%</b>pagos online</div>
          </div>
        </Reveal>

        <div className="lv2-case-credit">
          <MapPin size={14} aria-hidden="true" /> Material real del evento · Landia, Córdoba ·
          <a href="https://www.instagram.com/landia_ar/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Landia (@landia_ar)">@landia_ar</a>
        </div>
      </div>
    </section>
  )
}

/* ───────── Entradas / parking ───────── */

function Passes() {
  return (
    <section id="entradas-y-parking" className="lv2-section" aria-labelledby="lv2-pass-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-pass-h" className="lv2-h2">Entradas, parking<br />y <span className="lv2-mark">mucho más.</span></h2>
          </div>
          <p className="lv2-lead">Vendé todo tu evento desde la misma página: la entrada, el estacionamiento, los consumos y el merch. Cada compra con su propio QR antifraude.</p>
        </Reveal>
        <div className="lv2-passes">
          {PASSES.map((p, i) => (
            <Reveal key={p.title} d={i * 0.1} className="lv2-pass-slot">
              <article className={`lv2-pass ${p.cls}`} style={{ '--r': p.r } as React.CSSProperties}>
                <div className="lv2-pass-ico" aria-hidden="true">{p.icon}</div>
                <span className="lv2-pass-kind">{p.kind}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <div className="lv2-pass-foot"><b>{p.price}</b><span><ArrowUpRight size={14} aria-hidden="true" /> QR propio</span></div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────── Tipos de evento ───────── */

function EventTypes() {
  return (
    <section id="eventos" className="lv2-section" aria-labelledby="lv2-ev-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-ev-h" className="lv2-h2">Para cada<br />tipo de <span className="lv2-mark">evento.</span></h2>
          </div>
          <p className="lv2-lead">Todo lo que necesitás para vender en tu evento, listo en menos de 20 minutos. Sin hardware ni conocimientos técnicos.</p>
        </Reveal>
        <div className="lv2-events">
          {EVENTS.map((e, i) => (
            <Reveal key={e.title} d={i * 0.07} className="lv2-card lv2-event lv2-spot">
              <div className="lv2-card-ico">{e.icon}</div>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
              <span className="lv2-card-stat">{e.stat}</span>
            </Reveal>
          ))}
          {/* Toda la card es clickeable: el link se estira sobre la card */}
          <Reveal d={0.35} className="lv2-card lv2-event lv2-spot lv2-event--cta">
            <div className="lv2-card-ico"><Plus size={22} /></div>
            <h3>¿Tu evento es distinto?</h3>
            <p>Lo adaptamos a lo que necesites. Contanos cómo es y lo armamos juntos.</p>
            <a href="#contacto" className="lv2-card-stat lv2-event-link">Agendá una demo <ArrowRight size={14} /></a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ───────── FAQ ───────── */

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="lv2-section" aria-labelledby="lv2-faq-h">
      <div className="lv2-wrap lv2-faq">
        <Reveal className="lv2-faq-side">
          <h2 id="lv2-faq-h" className="lv2-h2">Preguntas<br />frecuentes.</h2>
          <p className="lv2-lead">¿Tenés dudas? Acá respondemos las más comunes. Si necesitás más info, <a href="#contacto">escribinos</a>.</p>
        </Reveal>
        <Reveal d={0.1}>
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open === i
            return (
              <div key={q} className={`lv2-faq-item${isOpen ? ' is-open' : ''}`}>
                <h3 style={{ margin: 0 }}>
                  <button type="button" className="lv2-faq-q" aria-expanded={isOpen} aria-controls={`lv2-faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}>
                    <span>{q}</span>
                    <span className="lv2-faq-plus" aria-hidden="true"><Plus size={16} /></span>
                  </button>
                </h3>
                <div id={`lv2-faq-a-${i}`} className="lv2-faq-a" role="region"><div><p>{a}</p></div></div>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Contacto ───────── */

function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [gotcha, setGotcha] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) { setError('Ingresá tu nombre.'); return }
    if (!CONTACT_EMAIL_RE.test(email.trim())) { setError('Revisá el email: falta el @ o el dominio.'); return }
    if (message.trim().length < 10) { setError('Contanos un poco más: al menos 10 caracteres.'); return }
    setStatus('sending')
    try {
      const res = await browserFetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nombre: name.trim(),
          email: email.trim(),
          mensaje: message.trim(),
          origen: 'Landing v2 - Contacto',
          _subject: `Contacto desde la web: ${name.trim()}`,
          _gotcha: gotcha,
        }),
      })
      if (res.ok) { setStatus('sent'); return }
      const body = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      setError(body?.errors?.[0]?.message ?? 'No pudimos enviar tu mensaje. Probá de nuevo.')
    } catch {
      setError('No se pudo contactar al servidor. Revisá tu conexión.')
    }
    setStatus('idle')
  }

  return (
    <section id="contacto" className="lv2-section" aria-labelledby="lv2-contact-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-contact">
          <div>
            <h2 id="lv2-contact-h" className="lv2-h2">¿Hablamos?</h2>
            <p className="lv2-lead">Contanos sobre tu evento y te ayudamos a armarlo. Respondemos en menos de 24 horas hábiles.</p>
            <ul className="lv2-topics">
              {CONTACT_TOPICS.map(t => <li key={t.title}><span><strong>{t.title}.</strong> {t.desc}</span></li>)}
            </ul>
            <p className="lv2-mail">¿Preferís el mail? <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a></p>
          </div>

          {status === 'sent' ? (
            <div className="lv2-sent" role="status">
              <i><Check size={30} /></i>
              <h3>¡Mensaje enviado!</h3>
              <p>Gracias por escribirnos. Te respondemos pronto.</p>
              <button type="button" onClick={() => { setName(''); setEmail(''); setMessage(''); setStatus('idle') }}>Enviar otro mensaje</button>
            </div>
          ) : (
            <form className="lv2-form" onSubmit={submit} noValidate>
              <div className="lv2-field">
                <label htmlFor="lv2-name">Nombre</label>
                <input id="lv2-name" className="lv2-input" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
              </div>
              <div className="lv2-field">
                <label htmlFor="lv2-email">Email</label>
                <input id="lv2-email" className="lv2-input" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vos@ejemplo.com" />
              </div>
              <div className="lv2-field">
                <label htmlFor="lv2-msg">Mensaje</label>
                <textarea id="lv2-msg" className="lv2-input" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Contanos sobre tu evento: tipo, fecha, cantidad de asistentes…" />
              </div>
              <input className="lv2-hp" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" value={gotcha} onChange={e => setGotcha(e.target.value)} />
              {error && <p className="lv2-form-err" role="alert">{error}</p>}
              <button type="submit" className="lv2-btn" disabled={status === 'sending'}>
                {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
                <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Página ───────── */

export default function NewLanding() {
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
      <Nav scrolled={scrolled} />
      <main>
        <Hero />
        <Ticker />
        <Journey />
        <Stats />
        <Panel />
        <CaseStudy />
        <Tickets />
        <Passes />
        <EventTypes />
        <Faq />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
