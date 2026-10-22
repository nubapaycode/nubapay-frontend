'use client'

import { useId } from 'react'

/*
 * iPhone 15 Pro en SVG con capturas reales del flujo comprador.
 * Geometría del marco adaptada de Magic UI (`registry/magicui/iphone.tsx`),
 * MIT © Magic UI — https://github.com/magicuidesign/magicui
 */

const W = 433
const H = 882
const SX = 21.25
const SY = 19.25
const SW = 389.5
const SH = 843.5
const SR = 55.75

const pct = (v: number, total: number) => `${(v / total) * 100}%`

/** Barra de estado de iOS: 54pt sobre 852pt de pantalla. */
const STATUS_PCT = (54 / 852) * 100

export const PHONE_SCREENS = [
  { src: '/images/landing-v2/screen-1-catalogo.webp', alt: 'Catálogo del evento en el celular, con productos y descuentos', dark: true },
  { src: '/images/landing-v2/screen-2-carrito.webp', alt: 'Carrito con una cerveza y una hamburguesa, listo para pagar', dark: false },
  { src: '/images/landing-v2/screen-3-checkout.webp', alt: 'Checkout con el resumen del pedido y pago con Mercado Pago', dark: false },
  { src: '/images/landing-v2/screen-4-qr.webp', alt: 'Código QR de retiro con el pedido listo para retirar', dark: false },
]

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div className={`lv2-ip-status${dark ? ' is-dark' : ''}`} style={{ height: `${STATUS_PCT}%` }} aria-hidden="true">
      <span>9:41</span>
      <span className="lv2-ip-status-icons">
        <svg viewBox="0 0 18 12" width="17" height="11"><rect x="0" y="8" width="3" height="4" rx="0.8" /><rect x="5" y="5.5" width="3" height="6.5" rx="0.8" /><rect x="10" y="3" width="3" height="9" rx="0.8" /><rect x="15" y="0" width="3" height="12" rx="0.8" /></svg>
        <svg viewBox="0 0 16 12" width="15" height="11"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .8C5.2.8 2.7 1.9.8 3.7L2 5c1.6-1.5 3.7-2.4 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4.4c-1.8 0-3.4.7-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.5 0-1 .2-1.3.5L8 11.6l1.3-1.3c-.3-.3-.8-.5-1.3-.5Z" /></svg>
        <span className="lv2-ip-batt"><i /></span>
      </span>
    </div>
  )
}

export default function RealPhone({ screen, eager = false }: { screen: number; eager?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const current = PHONE_SCREENS[screen] ?? PHONE_SCREENS[0]

  return (
    <div className="lv2-iphone" style={{ aspectRatio: `${W}/${H}` }} role="img" aria-label={current.alt}>
      <div
        className="lv2-ip-screen"
        style={{ left: pct(SX, W), top: pct(SY, H), width: pct(SW, W), height: pct(SH, H), borderRadius: `${(SR / SW) * 100}% / ${(SR / SH) * 100}%` }}
      >
        <StatusBar dark={current.dark} />
        <div className="lv2-ip-shots" style={{ top: `${STATUS_PCT}%` }}>
          {PHONE_SCREENS.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.src}
              src={s.src}
              alt=""
              width={1179}
              height={2394}
              decoding="async"
              loading={eager ? 'eager' : 'lazy'}
              className={i === screen ? 'is-on' : ''}
            />
          ))}
        </div>
        <div className="lv2-ip-glare" aria-hidden="true" />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} fill="none" className="lv2-ip-frame" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-ti`} x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5B5B60" />
            <stop offset="0.025" stopColor="#9C9CA1" />
            <stop offset="0.06" stopColor="#3A3A3E" />
            <stop offset="0.5" stopColor="#2C2C30" />
            <stop offset="0.94" stopColor="#3A3A3E" />
            <stop offset="0.975" stopColor="#9C9CA1" />
            <stop offset="1" stopColor="#5B5B60" />
          </linearGradient>
          <linearGradient id={`${uid}-btn`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2A2A2E" />
            <stop offset="0.5" stopColor="#8E8E93" />
            <stop offset="1" stopColor="#3A3A3E" />
          </linearGradient>
          <linearGradient id={`${uid}-edge`} x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id={`${uid}-lens`} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#2B3A55" />
            <stop offset="0.6" stopColor="#0B0F18" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id={`${uid}-punch`} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width={W} height={H} fill="white" />
            <rect x={SX} y={SY} width={SW} height={SH} rx={SR} ry={SR} fill="black" />
          </mask>
        </defs>

        {/* Botones laterales */}
        <path d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z" fill={`url(#${uid}-btn)`} />
        <path d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z" fill={`url(#${uid}-btn)`} />
        <path d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z" fill={`url(#${uid}-btn)`} />
        <path d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z" fill={`url(#${uid}-btn)`} />

        <g mask={`url(#${uid}-punch)`}>
          {/* Marco de titanio */}
          <path d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z" fill={`url(#${uid}-ti)`} />
          <path d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z" stroke={`url(#${uid}-edge)`} strokeWidth="1" />
          {/* Bisel negro del vidrio */}
          <path d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z" fill="#050506" />
        </g>

        {/* Dynamic Island */}
        <path d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z" fill="#000" />
        <circle cx="259.5" cy="48.5" r="7" fill={`url(#${uid}-lens)`} />
        <circle cx="257.6" cy="46.6" r="1.6" fill="#5C79A8" opacity="0.55" />
      </svg>
    </div>
  )
}
