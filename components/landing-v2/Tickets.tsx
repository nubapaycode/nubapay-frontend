'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowRight, Check, DoorOpen, ScanLine, Ticket } from 'lucide-react'

import { gsap, MOTION_OK, MOTION_REDUCED, useGSAP } from './gsap'
import { Reveal } from './hooks'

/* Sólo lo que hoy hace la plataforma: las entradas son productos del evento (también en combo),
   con precio de preventa por fecha, un QR por compra y validación desde el scanner del staff. */
const BLOCKS = [
  {
    icon: <Ticket size={22} />,
    title: 'Venta',
    items: [
      'Tus entradas en la página del evento, sin que el público descargue nada',
      'Cobro con Mercado Pago, tarjeta o efectivo',
      'Precio de preventa con fecha de inicio y de fin',
      'Combos de entrada + consumición en una sola compra',
    ],
  },
  {
    icon: <DoorOpen size={22} />,
    title: 'Acceso',
    items: [
      'Cada compra genera su propio QR',
      'Tu staff lo escanea desde el celular, sin hardware extra',
      'Un QR que ya se usó queda marcado al instante',
      'Las ventas se ven en el panel mientras pasan',
    ],
  },
]

/** Entrada digital de ejemplo: el escáner la recorre y queda "Acceso validado", en loop mientras se ve. */
function DigitalTicket() {
  return (
    <div className="lv2-tix-ticket" role="img" aria-label="Entrada digital de ejemplo para Demo Fest 2026, validada en la puerta con su QR">
      <div className="lv2-tix-top" aria-hidden="true">
        <div className="lv2-tix-head">
          <span className="lv2-tix-brand">nubapay</span>
          <span className="lv2-tix-tag">Entrada General</span>
        </div>
        <b className="lv2-tix-event">Demo Fest 2026</b>
        <dl className="lv2-tix-meta">
          <div><dt>Fecha</dt><dd>Sáb 14 · 20 h</dd></div>
          <div><dt>Ingreso</dt><dd>Puerta A</dd></div>
          <div><dt>Compra</dt><dd>#NB-01892</dd></div>
        </dl>
      </div>
      <div className="lv2-tix-bottom" aria-hidden="true">
        <div className="lv2-tix-qr">
          <QRCodeSVG value="NB-01892" size={150} level="M" bgColor="transparent" fgColor="#0A0A0F" />
          <i className="lv2-tix-scan" />
          <span className="lv2-tix-stamp"><Check size={26} strokeWidth={3} /></span>
        </div>
        <div className="lv2-tix-state">
          <span className="lv2-tix-state-wait"><ScanLine size={14} /> Lista para escanear</span>
          <span className="lv2-tix-state-ok"><Check size={14} strokeWidth={2.6} /> Acceso validado</span>
        </div>
      </div>
    </div>
  )
}

export default function Tickets() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(() => {
    const ticket = ref.current?.querySelector<HTMLElement>('.lv2-tix-ticket')
    if (!ticket) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      /* Loop: espera, el escáner baja y sube, se valida y queda un rato antes de reiniciar.
         Sólo corre mientras la sección está en pantalla. */
      gsap.timeline({
        repeat: -1,
        scrollTrigger: { trigger: ticket, start: 'top 80%', end: 'bottom top', toggleActions: 'play pause resume pause' },
      })
        .call(() => ticket.classList.remove('is-ok'))
        .fromTo('.lv2-tix-scan', { top: '8%', opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.6)
        .to('.lv2-tix-scan', { top: '88%', duration: 0.7, ease: 'power2.inOut' })
        .to('.lv2-tix-scan', { top: '8%', duration: 0.6, ease: 'power2.inOut' })
        .to('.lv2-tix-scan', { opacity: 0, duration: 0.2 })
        .call(() => ticket.classList.add('is-ok'))
        .to({}, { duration: 2.8 })
    })
    mm.add(MOTION_REDUCED, () => { ticket.classList.add('is-ok') })
  }, { scope: ref })

  return (
    <section ref={ref} id="venta-de-entradas" className="lv2-section" aria-labelledby="lv2-tix-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-tix-h" className="lv2-h2">Vendé entradas.<br />Validalas en la <span className="lv2-mark">puerta.</span></h2>
          </div>
          <p className="lv2-lead">Publicá tus entradas en la página del evento, cobralas online y controlá el ingreso escaneando el QR desde cualquier celular.</p>
        </Reveal>

        <div className="lv2-tix">
          <Reveal className="lv2-tix-stage">
            <div className="lv2-tix-glow" aria-hidden="true" />
            <DigitalTicket />
          </Reveal>

          <div className="lv2-tix-side">
            {BLOCKS.map((b, i) => (
              <Reveal key={b.title} d={i * 0.08} className="lv2-card lv2-spot lv2-tix-block">
                <div className="lv2-tix-block-head">
                  <div className="lv2-card-ico">{b.icon}</div>
                  <h3>{b.title}</h3>
                </div>
                <ul>
                  {b.items.map(it => <li key={it}><Check size={14} strokeWidth={2.4} aria-hidden="true" />{it}</li>)}
                </ul>
              </Reveal>
            ))}
            <Reveal d={0.16} className="lv2-tix-cta">
              {/* Ancla interna como <a> para que Lenis haga el scroll suave */}
              <a href="#entradas-y-parking" className="lv2-btn lv2-btn--ghost">Ver parking y extras</a>
              <a href="#contacto" className="lv2-btn">
                Quiero vender entradas
                <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
