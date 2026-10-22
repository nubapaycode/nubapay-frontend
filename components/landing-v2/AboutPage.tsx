'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import {
  ArrowRight, ArrowUpRight, CalendarCheck, Clock, LayoutDashboard, Mail, MapPin, ScanLine, ShoppingBag, Smartphone,
} from 'lucide-react'

import { gsap, MOTION_OK, MOTION_REDUCED, ScrollTrigger, useGSAP } from './gsap'
import { CountUp, Reveal } from './hooks'
import FinalCta from './FinalCta'
import SiteShell from './SiteShell'
import './about.css'

/* ───────── Datos ───────── */

const CONTACT_EMAIL = 'contacto@nubapay.app'

const PLACES = [
  'Boliches', 'Festivales', 'Fiestas', 'Recitales', 'Eventos privados', 'Ferias', 'Estadios',
  'Eventos corporativos', 'Barras móviles', 'Food trucks',
]

/** Manifiesto: cada palabra se enciende con el scroll; "las filas" se tacha al llegar. */
const STATEMENT: { text: string; strike?: boolean }[] = [
  { text: 'Nubapay nace para resolver uno de los mayores problemas de los eventos masivos:' },
  { text: 'las filas.', strike: true },
  { text: 'Creamos una plataforma simple y escalable para pedir, pagar y retirar desde el celular, conectando asistentes, barras y organizadores en un mismo sistema.' },
]

const STATS = [
  { icon: <CalendarCheck size={20} />, prefix: '+', to: 20, suffix: '', label: 'eventos gestionados', sub: 'boliches, festivales y fiestas' },
  { icon: <ShoppingBag size={20} />, prefix: '+', to: 15, suffix: 'K', label: 'ventas realizadas', sub: 'pedidas desde el celular' },
  { icon: <Clock size={20} />, prefix: '<', to: 2, suffix: ' min', label: 'de espera en el retiro', sub: 'vs. 23 min promedio' },
]

const AUDIENCES = [
  { icon: <Smartphone size={22} />, title: 'Para asistentes', text: 'Pedí, pagá y retirá desde el celular. Sin app, sin fila, sin efectivo.', stat: 'Sin descargar nada' },
  { icon: <LayoutDashboard size={22} />, title: 'Para organizadores', text: 'Panel de control con ventas, pedidos y rendimiento en tiempo real.', stat: 'Todo el evento en un panel' },
  { icon: <ScanLine size={22} />, title: 'Para el staff', text: 'Escáner de QR, validación de retiro y gestión de pedidos desde cualquier dispositivo.', stat: 'Sin hardware extra' },
]

const FOUNDERS = [
  {
    name: 'Ángel Vaquero',
    role: 'Chief Executive Officer',
    short: 'CEO',
    bio: 'Lidera la estrategia, la visión comercial y el crecimiento de Nubapay. Con foco en construir relaciones con organizadores, partners y el ecosistema de eventos masivos en Latinoamérica.',
    photo: '/images/angelito.jpeg',
    linkedin: 'https://linkedin.com/in/angel-vaquero-7592a8194',
  },
  {
    name: 'Facundo Girardi',
    role: 'Chief Technology Officer',
    short: 'CTO',
    bio: 'Lidera el desarrollo tecnológico, la arquitectura del sistema y la escalabilidad de la plataforma. Responsable de las decisiones técnicas que sostienen cada pedido, pago y retiro en tiempo real.',
    photo: '/images/facu.png',
    linkedin: 'https://linkedin.com/in/facugirardi',
  },
  {
    name: 'Alejo Vaquero',
    role: 'Chief Product Officer',
    short: 'CPO',
    bio: 'Lidera el producto, la experiencia de usuario, la definición funcional y la evolución de la plataforma. Traduce los problemas reales de asistentes y organizadores en decisiones de diseño y producto.',
    photo: '/images/alejo.jpeg',
    linkedin: 'https://linkedin.com/in/alejovaquero',
  },
]

const PRINCIPLES = [
  { title: 'Simplicidad ante todo', text: 'Cada decisión parte de la misma pregunta: ¿es más fácil para quien lo usa? Si no lo es, volvemos a empezar.' },
  { title: 'Tecnología con propósito', text: 'Registramos cada ticket en blockchain porque vuelve imposible falsificarlo, no porque suene bien. Si no resuelve un problema real, no lo usamos.' },
  { title: 'Operación sin fricción', text: 'El tiempo perdido en una fila es tiempo que el asistente no disfruta y el organizador no vende. Eso es lo que eliminamos.' },
  { title: 'Confianza en cada retiro', text: 'Cada QR de retiro es único y de un solo uso. El asistente sabe que lo suyo es suyo.' },
]

/* ───────── Hero ───────── */

function Hero() {
  return (
    <section className="lv2-hero lv2-ab-hero" aria-labelledby="lv2-ab-h1">
      <div className="lv2-hero-glow lv2-hero-glow--a" aria-hidden="true" />
      <div className="lv2-hero-glow lv2-hero-glow--b" aria-hidden="true" />
      <div className="lv2-wrap lv2-ab-hero-inner">
        <h1 id="lv2-ab-h1" className="lv2-h1">
          <span className="lv2-line"><span>Hacemos que</span></span>
          <span className="lv2-line"><span>los eventos <span className="lv2-mark lv2-mark--now">fluyan.</span></span></span>
          <span className="sr-only"> Conocé al equipo detrás de Nubapay.</span>
        </h1>

        <div className="lv2-ab-hero-row lv2-fade-up">
          <p>
            Somos el equipo detrás de <strong>Nubapay</strong>: construimos la plataforma que conecta asistentes, barras y
            organizadores para que <strong>nadie se pierda el show haciendo fila</strong>.
          </p>
          <div className="lv2-hero-cta">
            <a href="#equipo" className="lv2-btn">
              Conocé al equipo
              <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
            </a>
            <Link href="/#como-funciona" className="lv2-btn lv2-btn--ghost">Ver cómo funciona</Link>
          </div>
        </div>

        <figure className="lv2-ab-band lv2-fade-up">
          <div className="lv2-ab-band-par">
            <Image
              src="/images/landia2.jpeg"
              alt="Público frente al escenario de Landia al atardecer, un evento que operó con Nubapay"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
          </div>
          <figcaption className="lv2-ab-band-cap">
            <span className="lv2-ab-chip"><MapPin size={14} aria-hidden="true" /> Landia · Córdoba</span>
            <span className="lv2-ab-chip">Material real de un evento con Nubapay</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

/* ───────── Dónde operamos ───────── */

function Places() {
  return (
    <div className="lv2-ticker">
      <span className="sr-only">Dónde operamos: {PLACES.join(', ')}.</span>
      <div className="lv2-ticker-mask" aria-hidden="true">
        <div className="lv2-ticker-track">
          {[...PLACES, ...PLACES, ...PLACES].map((t, i) => (
            <div key={i} className="lv2-ticker-item">{t}<i /></div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────── Manifiesto ───────── */

function Manifesto() {
  /* Sin espacio después de la última palabra: lo agrega quien arma la frase */
  const words = (text: string) => text.split(' ').map((w, i, all) => <span key={i} className="lv2-ab-w">{w}{i < all.length - 1 ? ' ' : ''}</span>)
  return (
    <section id="historia" className="lv2-section" aria-labelledby="lv2-ab-why">
      <div className="lv2-wrap lv2-ab-manifesto">
        <h2 id="lv2-ab-why" className="lv2-ab-eyebrow">Por qué existimos</h2>
        <p className="lv2-ab-statement">
          {STATEMENT.map((s, i) => s.strike
            ? <span key={i}><span className="lv2-ab-strike">{words(s.text)}</span> </span>
            : <span key={i}>{words(s.text)}{i < STATEMENT.length - 1 ? ' ' : ''}</span>)}
        </p>
      </div>
    </section>
  )
}

/* ───────── Números ───────── */

function Stats() {
  return (
    <section className="lv2-section" aria-label="Nubapay en números">
      <div className="lv2-wrap">
        <Reveal className="lv2-stats lv2-ab-stats">
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

/* ───────── Qué hacemos ───────── */

function WhatWeDo() {
  return (
    <section id="que-hacemos" className="lv2-section" aria-labelledby="lv2-ab-what">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-ab-what" className="lv2-h2">Un sistema,<br />tres <span className="lv2-mark">protagonistas.</span></h2>
          </div>
          <p className="lv2-lead">Desde que el asistente escanea el QR hasta que retira su pedido sin hacer fila, Nubapay conecta cada parte de la operación.</p>
        </Reveal>
        <div className="lv2-events">
          {AUDIENCES.map((a, i) => (
            <Reveal key={a.title} d={i * 0.07} className="lv2-card lv2-event lv2-spot">
              <div className="lv2-card-ico">{a.icon}</div>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
              <span className="lv2-card-stat">{a.stat}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────── Equipo ───────── */

function LinkedinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 5.5h2.5v8H2.5v-8ZM3.75 4.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5ZM6.5 5.5H9v1.1c.4-.7 1.3-1.3 2.5-1.3 2.2 0 3 1.5 3 3.5v4.7H12V9.2c0-1-.4-1.7-1.3-1.7-1 0-1.7.7-1.7 1.9v4.1H6.5v-8Z" fill="currentColor" />
    </svg>
  )
}

function Team() {
  return (
    <section id="equipo" className="lv2-section" aria-labelledby="lv2-ab-team">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-ab-team" className="lv2-h2">Las personas<br />detrás de <span className="lv2-mark">Nubapay.</span></h2>
          </div>
          <p className="lv2-lead">Tres fundadores con una misma obsesión: que en los eventos se disfrute más y se espere menos.</p>
        </Reveal>
        <div className="lv2-ab-team">
          {FOUNDERS.map((f, i) => (
            <Reveal key={f.name} as="article" d={i * 0.08} className="lv2-ab-founder">
              <div className="lv2-ab-photo">
                <Image src={f.photo} alt={`${f.name}, ${f.role} de Nubapay`} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" />
                <span className="lv2-ab-role">{f.short}</span>
              </div>
              <div className="lv2-ab-founder-body">
                <h3>{f.name}</h3>
                <p className="lv2-ab-title">{f.role}</p>
                <p className="lv2-ab-bio">{f.bio}</p>
                <div className="lv2-ab-links">
                  <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="lv2-ab-link" aria-label={`LinkedIn de ${f.name}`}>
                    <LinkedinIcon /> LinkedIn <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="lv2-ab-link lv2-ab-link--icon" aria-label={`Escribir a ${CONTACT_EMAIL}`}>
                    <Mail size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────── Principios ───────── */

function Principles() {
  return (
    <section id="principios" className="lv2-section" aria-labelledby="lv2-ab-pr">
      <div className="lv2-wrap lv2-ab-principles">
        <Reveal className="lv2-ab-principles-side">
          <h2 id="lv2-ab-pr" className="lv2-h2">Lo que<br />nos <span className="lv2-mark">guía.</span></h2>
          <p className="lv2-lead">Cuatro ideas que usamos para decidir qué construir, y sobre todo qué no.</p>
        </Reveal>
        <ol className="lv2-ab-pr-list">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} as="li" d={i * 0.06} className="lv2-ab-pr">
              <span className="lv2-ab-pr-num" aria-hidden="true">0{i + 1}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────── Página ───────── */

export default function AboutPage() {
  const mainRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      /* Entrada: titular línea por línea, marcador, texto y la foto que se abre desde abajo */
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
        .to('.lv2-ab-hero .lv2-line > span', { y: 0, duration: 1.2, stagger: 0.12 })
        .to('.lv2-ab-hero .lv2-mark--now', { '--mk': 1, duration: 0.9, ease: 'power3.inOut' }, '-=0.55')
        .to('.lv2-ab-hero-row', { opacity: 1, y: 0, duration: 1 }, '-=0.7')
        .fromTo('.lv2-ab-band',
          { opacity: 0, clipPath: 'inset(14% 5% 0% 5% round 36px)' },
          { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 36px)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.45)

      /* Parallax de la foto dentro de su marco */
      gsap.fromTo('.lv2-ab-band-par', { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: '.lv2-ab-band', start: 'top bottom', end: 'bottom top', scrub: true },
      })

      /* Manifiesto: las palabras se encienden siguiendo el scroll y "las filas" se tacha */
      gsap.fromTo('.lv2-ab-w', { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: '.lv2-ab-statement', start: 'top 82%', end: 'bottom 50%', scrub: 0.6 },
      })
      ScrollTrigger.create({
        trigger: '.lv2-ab-strike', start: 'top 58%', once: true,
        onEnter: () => document.querySelector('.lv2-ab-strike')?.classList.add('is-on'),
      })
    })
    mm.add(MOTION_REDUCED, () => {
      document.querySelector('.lv2-ab-strike')?.classList.add('is-on')
    })
  }, { scope: mainRef })

  return (
    <SiteShell>
      <main ref={mainRef}>
        <Hero />
        <Places />
        <Manifesto />
        <Stats />
        <WhatWeDo />
        <Team />
        <Principles />
        <FinalCta base="/" />
      </main>
    </SiteShell>
  )
}
