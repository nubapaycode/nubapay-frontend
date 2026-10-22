'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Activity, ArrowRight, Boxes, Check, CircleCheck, CreditCard, KeyRound, Lock, QrCode, ScanLine, Server, ShieldAlert,
  ShieldCheck, ShoppingCart,
} from 'lucide-react'

import { gsap, MOTION_OK, useGSAP } from './gsap'
import { CountUp, Reveal } from './hooks'
import PageHero, { DocTabs } from './PageHero'
import SiteShell from './SiteShell'

/* ───────── Datos ───────── */

const SECURITY_EMAIL = 'seguridad@nubapay.app'

const STATS = [
  { icon: <ShieldCheck size={20} />, prefix: '', to: 0, suffix: '%', label: 'QRs duplicados procesados', sub: 'cada código se usa una sola vez' },
  { icon: <Lock size={20} />, prefix: '', to: 256, suffix: '', label: 'bits de cifrado en tránsito', sub: 'TLS en todas las conexiones' },
  { icon: <Boxes size={20} />, prefix: '', to: 100, suffix: '%', label: 'retiros certificados en blockchain', sub: 'unickeys · Solana' },
  { icon: <Activity size={20} />, text: '24/7', label: 'monitoreo del sistema', sub: 'alertas en tiempo real' },
] as ({ icon: React.ReactNode; label: string; sub: string } & ({ prefix: string; to: number; suffix: string } | { text: string }))[]

const QR_CHECKS = [
  'QR de un solo uso: se invalida al escanearse',
  'Vinculado al pedido, el evento y el punto de retiro',
  'Verificación en tiempo real contra la base de datos',
  'Intento de escaneo duplicado registrado y alertado',
]

const LAYERS = [
  {
    icon: <Boxes size={22} />, title: 'Certificación blockchain',
    text: 'Cada QR de retiro se certifica con unickeys, dejando una constancia inmutable en blockchain. Si alguien intenta falsificar un código, la verificación falla al instante.',
    items: ['Registro en blockchain de cada retiro', 'Hash único por transacción', 'Imposible de falsificar o clonar'],
  },
  {
    icon: <CreditCard size={22} />, title: 'Pagos seguros',
    text: 'Nubapay no almacena datos de tarjetas. Los pagos se procesan a través de PSPs certificados (como Mercado Pago) que cumplen estándares PCI DSS.',
    items: ['Sin almacenamiento de datos de tarjeta', 'Tokenización por el PSP', 'TLS 256-bit en todas las conexiones'],
  },
  {
    icon: <KeyRound size={22} />, title: 'Control de accesos',
    text: 'Cada usuario del panel tiene acceso únicamente a lo que necesita. El organizador define roles y permisos granulares para su staff.',
    items: ['Roles por usuario (admin, cajero, scanner)', 'Acceso limitado por evento', 'Log de actividad por sesión'],
  },
  {
    icon: <ShieldAlert size={22} />, title: 'Detección de fraude en tiempo real',
    text: 'El sistema monitorea cada intento de escaneo, detecta patrones anómalos y bloquea QRs comprometidos antes de que se concrete el retiro.',
    items: ['Bloqueo de QR duplicados', 'Alertas al organizador', 'Registro de intentos fallidos', 'Detección de actividad inusual'],
    wide: true,
  },
  {
    icon: <Server size={22} />, title: 'Infraestructura confiable',
    text: 'Nubapay corre sobre infraestructura cloud de alta disponibilidad, con backups automáticos, monitoreo 24/7 y capacidad de escalar en eventos con miles de asistentes simultáneos.',
    items: ['Alta disponibilidad', 'Backups automáticos', 'Escalado automático', 'Monitoreo 24/7'],
    wide: true,
  },
]

const FLOW = [
  { icon: <ShoppingCart size={20} />, title: 'Pedido', text: 'El asistente elige y confirma su pedido desde el celular.' },
  { icon: <CreditCard size={20} />, title: 'Pago', text: 'El pago se procesa con cifrado TLS 256-bit.' },
  { icon: <QrCode size={20} />, title: 'QR generado', text: 'Se crea un QR único certificado con blockchain.' },
  { icon: <ScanLine size={20} />, title: 'Escaneo', text: 'El staff escanea y la app verifica en tiempo real.' },
  { icon: <CircleCheck size={20} />, title: 'Retiro', text: 'El QR se invalida y el pedido queda como entregado.' },
]

/* ───────── Secciones ───────── */

function Stats() {
  return (
    <section className="lv2-section" aria-label="Seguridad en números">
      <div className="lv2-wrap">
        <Reveal className="lv2-stats lv2-sec-stats">
          {STATS.map(s => (
            <div key={s.label} className="lv2-stat">
              <div className="lv2-stat-ico" aria-hidden="true">{s.icon}</div>
              <div className="lv2-stat-num">{'text' in s ? s.text : <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />}</div>
              <p>{s.label}</p>
              <small>{s.sub}</small>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function QrFeature() {
  return (
    <section id="qr-antifraude" className="lv2-section" aria-labelledby="lv2-sec-qr-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-dark lv2-sec-qr">
          <div className="lv2-sec-qr-glow" aria-hidden="true" />
          <div className="lv2-sec-qr-copy">
            <span className="lv2-sec-kicker">QR antifraude</span>
            <h2 id="lv2-sec-qr-h">Cada retiro tiene<br />su <em>QR único.</em></h2>
            <p>Al confirmar un pago, Nubapay genera un código QR irrepetible vinculado a ese pedido. No puede copiarse, reutilizarse ni transferirse.</p>
            <ul className="lv2-sec-checks">
              {QR_CHECKS.map(c => <li key={c}><i><Check size={13} strokeWidth={2.6} aria-hidden="true" /></i>{c}</li>)}
            </ul>
          </div>

          <div className="lv2-sec-ticket" role="img" aria-label="Ejemplo de QR de retiro del pedido NB-00492, listo para retirar">
            <div className="lv2-sec-code" aria-hidden="true">
              <QRCodeSVG value="NB-00492" size={180} level="M" bgColor="transparent" fgColor="#0A0A0F" />
              <i className="lv2-sec-corner lv2-sec-corner--tl" />
              <i className="lv2-sec-corner lv2-sec-corner--tr" />
              <i className="lv2-sec-corner lv2-sec-corner--bl" />
              <i className="lv2-sec-corner lv2-sec-corner--br" />
              <i className="lv2-sec-scan" />
            </div>
            <div className="lv2-sec-ticket-foot" aria-hidden="true">
              <b>Pedido #NB-00492</b>
              <span className="lv2-sec-ready">Listo para retirar</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Layers() {
  return (
    <section id="capas" className="lv2-section" aria-labelledby="lv2-sec-layers-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-sec-layers-h" className="lv2-h2">Cinco capas<br />de <span className="lv2-mark">protección.</span></h2>
          </div>
          <p className="lv2-lead">Cada pedido, pago y retiro pasa por múltiples capas de verificación. Sin atajos, sin trucos.</p>
        </Reveal>
        <div className="lv2-sec-layers">
          {LAYERS.map((l, i) => (
            <Reveal key={l.title} d={i * 0.07} className={`lv2-card lv2-spot lv2-sec-layer${l.wide ? ' lv2-sec-layer--wide' : ''}`}>
              <div className="lv2-card-ico">{l.icon}</div>
              <h3>{l.title}</h3>
              <p>{l.text}</p>
              <ul className="lv2-sec-list">
                {l.items.map(it => <li key={it}><Check size={14} strokeWidth={2.4} aria-hidden="true" />{it}</li>)}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Flow() {
  const ref = useRef<HTMLElement>(null)

  /* La línea que une los pasos se llena de lima siguiendo el scroll */
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      /* `--p` lo usa el CSS como scaleX (desktop) o scaleY (mobile, línea vertical) */
      gsap.fromTo('.lv2-sec-track i', { '--p': 0 }, {
        '--p': 1, ease: 'none',
        scrollTrigger: { trigger: '.lv2-sec-flow', start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
      })
    })
  }, { scope: ref })

  return (
    <section ref={ref} id="camino" className="lv2-section" aria-labelledby="lv2-sec-flow-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-head">
          <div>
            <h2 id="lv2-sec-flow-h" className="lv2-h2">El camino de<br />un pedido <span className="lv2-mark">seguro.</span></h2>
          </div>
          <p className="lv2-lead">De la compra al retiro, cada paso está verificado.</p>
        </Reveal>
        <div className="lv2-sec-flow">
          <span className="lv2-sec-track" aria-hidden="true"><i /></span>
          <ol className="lv2-sec-steps">
          {FLOW.map((f, i) => (
            <Reveal key={f.title} as="li" d={i * 0.08} className="lv2-sec-step">
              <span className="lv2-sec-step-ico" aria-hidden="true">{f.icon}</span>
              <small>0{i + 1}</small>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Reveal>
          ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="lv2-section" aria-labelledby="lv2-sec-cta-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-dark lv2-sec-cta">
          <div>
            <h2 id="lv2-sec-cta-h">¿Tenés preguntas<br />sobre <em>seguridad?</em></h2>
            <p>Nuestro equipo puede explicarte en detalle cómo protegemos tu evento.</p>
          </div>
          <div className="lv2-sec-cta-btns">
            <a href={`mailto:${SECURITY_EMAIL}`} className="lv2-btn">
              Hablar con el equipo
              <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
            </a>
            <Link href="/terminos" className="lv2-btn lv2-btn--ghost lv2-btn--ghost-dark">Ver términos legales</Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Página ───────── */

export default function SecurityPage() {
  return (
    <SiteShell navCenter={<DocTabs current="seguridad" inNav />}>
      <main>
        <PageHero
          id="lv2-sec-h1"
          top={<DocTabs current="seguridad" />}
          lines={['Tu evento,', 'protegido de', <span key="m" className="lv2-mark lv2-mark--now">punta a punta.</span>]}
          intro={<>Cada pedido, pago y retiro en Nubapay pasa por <strong>múltiples capas de verificación</strong>. Sin atajos, sin trucos. Así funciona.</>}
        >
          <div className="lv2-hero-cta">
            <a href={`mailto:${SECURITY_EMAIL}`} className="lv2-btn">
              Hablar con el equipo
              <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
            </a>
            <a href="#camino" className="lv2-btn lv2-btn--ghost">Ver el recorrido</a>
          </div>
        </PageHero>
        <Stats />
        <QrFeature />
        <Layers />
        <Flow />
        <Cta />
      </main>
    </SiteShell>
  )
}
