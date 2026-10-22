'use client'

import Link from 'next/link'
import { useRef, useSyncExternalStore } from 'react'
import { ArrowUp, ArrowUpRight } from 'lucide-react'

import { gsap, MOTION_OK, useGSAP } from './gsap'

const CONTACT_EMAIL = 'contacto@nubapay.app'

const COLUMNS = [
  {
    title: 'Producto',
    links: [
      { label: 'Cómo funciona', href: '#como-funciona' },
      { label: 'Panel', href: '#panel' },
      { label: 'Caso real', href: '#caso-landia' },
      { label: 'Entradas y parking', href: '#entradas-y-parking' },
      { label: 'Tipos de evento', href: '#eventos' },
      { label: 'Preguntas frecuentes', href: '#faq' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre Nubapay', href: '/nosotros' },
      { label: 'Agendá una demo', href: '#contacto' },
      { label: 'Probá una demo', href: '/register' },
      { label: 'Iniciar sesión', href: '/login' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos de uso', href: '/terminos' },
      { label: 'Privacidad', href: '/privacidad' },
      { label: 'Seguridad', href: '/seguridad' },
    ],
  },
]

/* Hora local de Argentina: se lee sólo en el cliente (en el servidor queda vacía) */
const AR_TIME = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires',
})
const subscribeClock = (cb: () => void) => {
  const id = window.setInterval(cb, 15000)
  return () => window.clearInterval(id)
}
const readClock = () => AR_TIME.format(new Date())

/** Link con efecto "roll": el texto sube y entra su copia desde abajo. */
function RollLink({ href, children }: { href: string; children: string }) {
  const inner = (
    <span className="lv2-f-roll" aria-hidden="true">
      <span>{children}</span>
      <span>{children}</span>
    </span>
  )
  const internal = href.startsWith('#')
  return internal
    ? <a href={href} className="lv2-f-link" aria-label={children}>{inner}</a>
    : <Link href={href} className="lv2-f-link" aria-label={children}>{inner}</Link>
}

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null)
  const time = useSyncExternalStore(subscribeClock, readClock, () => '')

  /* Entrada del wordmark: letras que suben escalonadas, verificado que gira y check que se dibuja */
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.timeline({ scrollTrigger: { trigger: '.lv2-f-mark', start: 'top 92%', once: true } })
        .from('.lv2-f-char', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.06 })
        .from('.lv2-f-badge', { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(1.8)' }, '-=0.6')
        .fromTo('.lv2-f-badge-check', { strokeDashoffset: 12 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
    })
  }, { scope: rootRef })

  return (
    <footer ref={rootRef} className="lv2-f" aria-labelledby="lv2-f-title">
      <h2 id="lv2-f-title" className="sr-only">Pie de página de Nubapay</h2>
      <div className="lv2-f-inner">
        <div className="lv2-f-top">
          <div className="lv2-f-contact">
            <p className="lv2-f-kicker">¿Tenés un evento en camino?</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="lv2-f-mail" aria-label={`Escribinos a ${CONTACT_EMAIL}`}>
              <span className="lv2-f-mail-text" aria-hidden="true">
                <span className="lv2-f-roll"><span>{CONTACT_EMAIL}</span><span>{CONTACT_EMAIL}</span></span>
              </span>
              <span className="lv2-f-mail-arrow" aria-hidden="true"><ArrowUpRight size={26} strokeWidth={1.6} /></span>
            </a>
            <div className="lv2-f-meta">
              <span className="lv2-f-time">
                Argentina{time && <> · <b>{time}</b> GMT-3</>}
              </span>
              <a href="https://www.instagram.com/nubapay.app" target="_blank" rel="noopener noreferrer" className="lv2-f-social" aria-label="Instagram de Nubapay (@nubapay.app)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
                </svg>
                @nubapay.app
              </a>
              <a href="#lv2-top" className="lv2-f-totop">
                Volver arriba <span aria-hidden="true"><ArrowUp size={14} strokeWidth={1.8} /></span>
              </a>
            </div>
          </div>

          <nav className="lv2-f-cols" aria-label="Enlaces del pie de página">
            {COLUMNS.map(col => (
              <div key={col.title}>
                <p className="lv2-f-coltitle">{col.title}</p>
                <ul>
                  {col.links.map(l => <li key={l.label}><RollLink href={l.href}>{l.label}</RollLink></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </div>

      </div>

      {/* Wordmark gigante con el verificado; se corta en el borde inferior */}
      <div className="lv2-f-mark" aria-hidden="true">
        <span className="lv2-f-word">
          {'nubapay'.split('').map((c, i) => (
            <span key={i} className="lv2-f-char-wrap"><span className="lv2-f-char">{c}</span></span>
          ))}
        </span>
        <svg className="lv2-f-badge" viewBox="0 0 24 24">
          <path
            d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
            fill="#C6FF00"
          />
          <path className="lv2-f-badge-check" d="m9 12 2 2 4-4" fill="none" stroke="#0A0F00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12" />
        </svg>
      </div>
    </footer>
  )
}
