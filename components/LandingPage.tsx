'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import SiteNavbar from '@/components/SiteNavbar'
import SiteFooter from '@/components/SiteFooter'

const TICKER = [
  'Sin cajas', 'Menú digital', 'QR antifraude', 'Pagos online',
  'IA integrada', 'Tiempo real', 'Eventos masivos',
]

const CSS = `
  @keyframes nb-fade-up {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nb-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-33.3333%); }
  }
  .nb-ticker-track {
    display: flex;
    width: max-content;
    animation: nb-marquee 24s linear infinite;
  }
  .nb-ticker:hover .nb-ticker-track { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) {
    .nb-ticker-track { animation: none; transform: translateX(0); }
  }
  @keyframes nb-ring {
    0%   { transform: scale(1);   opacity: 0.5; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes nb-dot {
    0%, 100% { opacity: 1;    }
    50%      { opacity: 0.25; }
  }
  @keyframes nb-chat {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }

  /* Blockchain: timeline animado, hover features, CTA */
  .nb-cert-line { transform: scaleY(0); transform-origin: top; }
  .nb-in .nb-cert-line { animation: nb-grow 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes nb-grow { to { transform: scaleY(1); } }
  .nb-bc-feat { transition: background 0.25s, border-color 0.25s, transform 0.25s cubic-bezier(0.16,1,0.3,1); }
  .nb-bc-feat:hover { background: rgba(198,255,0,0.06) !important; border-color: rgba(198,255,0,0.25) !important; transform: translateX(4px); }
  .nb-bc-cta { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-bc-cta:hover { transform: scale(1.02); box-shadow: 0 10px 26px -10px rgba(198,255,0,0.4); }
  .nb-bc-cta-arrow { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-bc-cta:hover .nb-bc-cta-arrow { transform: translateX(4px); }
  @media (prefers-reduced-motion: reduce) {
    .nb-cert-line { transform: scaleY(1); animation: none; }
    .nb-bc-feat:hover, .nb-bc-cta:hover { transform: none; }
  }

  /* Eventos: hover de cards sin romper el reveal */
  .nb-evento-card {
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s;
  }
  @media (prefers-reduced-motion: reduce) {
    .nb-evento-card { transition: opacity 0.4s; }
  }

  /* CTA final: respiro del glow */
  .nb-cta-glow { animation: nb-cta-glow 6s ease-in-out infinite; }
  @keyframes nb-cta-glow { 0%, 100% { opacity: 0.65; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.08); } }
  @media (prefers-reduced-motion: reduce) { .nb-cta-glow { animation: none; } }

  /* Stats band: bordes y hover del número */
  /* El borde va entre items: el primero no lo lleva. No se puede usar :first-child
     porque el grid arranca con dos divs decorativos de gradiente. */
  .nb-stats-item + .nb-stats-item { border-left: 1px solid rgba(0,0,0,0.12); }
  .nb-stat-num { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); transform-origin: left center; display: inline-block; }
  .nb-stats-item:hover .nb-stat-num { transform: scale(1.06); }
  @media (prefers-reduced-motion: reduce) {
    .nb-stats-item:hover .nb-stat-num { transform: none; }
  }

  .nb-h1-in { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.05s both; }

  .nb-sub   { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
  .nb-cta   { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.60s both; }
  .nb-badge { animation: nb-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0s both; }

  @keyframes nb-hero-media-in {
    from { opacity: 0; transform: translateY(48px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .nb-hero-media { animation: nb-hero-media-in 1.2s cubic-bezier(0.16,1,0.3,1) 0.78s both; }

  /* Reveal del mock ligado al scroll: arranca reducido y disuelto, crece hasta completo */
  .nb-hero-mock {
    position: relative;
    border: 1px solid rgba(10,15,0,0.10);
    border-radius: 20px;
    overflow: hidden;
    transform: translateY(var(--nb-mock-lift, -36px)) scale(var(--nb-mock-scale, 0.9));
    transform-origin: top center;
    -webkit-mask-image: linear-gradient(to bottom, #000 var(--nb-mock-fade-a, 30%), transparent var(--nb-mock-fade-b, 74%));
    mask-image: linear-gradient(to bottom, #000 var(--nb-mock-fade-a, 30%), transparent var(--nb-mock-fade-b, 74%));
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .nb-hero-media { animation: none; }
    .nb-hero-mock { transform: none; -webkit-mask-image: none; mask-image: none; }
  }

  .nb-ring-1 { animation: nb-ring 2.4s cubic-bezier(0.3,0.6,0.9,1) infinite; }
  .nb-ring-2 { animation: nb-ring 2.4s cubic-bezier(0.3,0.6,0.9,1) 1.2s infinite; }

  .nb-live { animation: nb-dot 2s ease-in-out infinite; }

  .nb-chat-msg { animation: nb-chat 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .nb-chat-msg:nth-child(1) { animation-delay: 0.7s; }
  .nb-chat-msg:nth-child(2) { animation-delay: 1.6s; }
  .nb-chat-msg:nth-child(3) { animation-delay: 2.6s; }
  .nb-chat-msg:nth-child(4) { animation-delay: 3.5s; }
  .nb-chat-msg:nth-child(5) { animation-delay: 4.5s; }

  .nb-btn-fill {
    position: relative;
    overflow: hidden;
    z-index: 0;
    transition: color 0.3s ease;
  }
  .nb-btn-fill::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #0A0A0F;
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: -1;
    border-radius: inherit;
  }
  .nb-btn-fill:hover::before { transform: translateX(0); }
  .nb-btn-fill:hover { color: #F5F5F0 !important; border-color: #0A0A0F !important; }

  .nb-hero-cta-primary {
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1), background 0.35s ease;
  }
  .nb-hero-cta-primary:hover {
    transform: scale(1.02);
    background: #D4FF3D !important;
    box-shadow: 0 8px 20px -10px rgba(198,255,0,0.3);
  }
  .nb-hero-cta-primary .nb-cta-arrow {
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
  }
  .nb-hero-cta-primary:hover .nb-cta-arrow { transform: translateX(6px); }

  /* ── Resaltado tipo marcador (doble pasada + borde irregular) ── */
  .nb-marker {
    position: relative;
    display: inline-block;
    color: #0A0F00;
    padding: 0 12px 1px;
    margin-top: 6px;
    font-weight: 400;
    text-transform: uppercase;
    transform: rotate(-1.2deg);
    z-index: 0;
  }
  .nb-marker-line {
    position: relative;
    display: inline-block;
    color: #0A0F00;
    padding: 2px 10px 6px;
    margin-top: 6px;
    transform: rotate(-0.8deg);
    z-index: 0;
  }
  .nb-marker::before,
  .nb-marker-line::before {
    content: '';
    position: absolute;
    inset: -2px -4px;
    z-index: -1;
    /* doble pasada: dos trazos lime levemente desfasados */
    background-image:
      linear-gradient(101deg, rgba(198,255,0,0) 1%, rgba(198,255,0,0.95) 4%, rgba(198,255,0,0.95) 96%, rgba(198,255,0,0) 99%),
      linear-gradient(98deg, rgba(198,255,0,0) 2%, rgba(198,255,0,0.6) 6%, rgba(198,255,0,0.6) 94%, rgba(198,255,0,0) 98%);
    background-repeat: no-repeat, no-repeat;
    background-size: 100% 70%, 100% 86%;
    background-position: 0 92%, 0 55%;
    /* borde irregular real: máscara SVG con ruido (feTurbulence) */
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='44'%3E%3Cfilter%20id='r'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.014%200.15'%20numOctaves='2'%20seed='7'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='8'/%3E%3C/filter%3E%3Crect%20x='6'%20y='7'%20width='108'%20height='30'%20rx='9'%20fill='black'%20filter='url(%23r)'/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='44'%3E%3Cfilter%20id='r'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.014%200.15'%20numOctaves='2'%20seed='7'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='8'/%3E%3C/filter%3E%3Crect%20x='6'%20y='7'%20width='108'%20height='30'%20rx='9'%20fill='black'%20filter='url(%23r)'/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  /* Trazo del marcador pintado de derecha a izquierda al entrar */
  @keyframes nb-marker-draw {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  .nb-marker-draw::before {
    transform-origin: left center;
    animation: nb-marker-draw 0.72s cubic-bezier(0.22,1,0.36,1) 0.55s both;
  }
  @media (prefers-reduced-motion: reduce) {
    .nb-marker-draw::before { animation: none; }
  }

  /* ── Scroll reveal ── */
  .nb-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
  }
  .nb-reveal.nb-in { opacity: 1; transform: translateY(0); }

  /* Step cards (Cómo funciona) — hover sin romper el reveal */
  .nb-step-card {
    transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  @media (prefers-reduced-motion: reduce) {
    .nb-step-card { transition: opacity 0.4s; }
  }

  /* Bento layout (Cómo funciona) */
  .nb-steps-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1.15fr;
    grid-template-areas:
      "a b d"
      "c c d";
    gap: 12px;
  }

  /* Micro-interacciones on-reveal de los previews del bento */
  .nb-pop { opacity: 0; transform: translateY(10px); }
  .nb-in .nb-pop { animation: nb-pop 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes nb-pop { to { opacity: 1; transform: translateY(0); } }

  /* Scanline del QR (paso 01). Recorrido en px: el alto del box lo fija el QR (88px + padding). */
  .nb-scanbox { position: relative; overflow: hidden; --nb-scan-travel: 94px; }
  .nb-scanline {
    position: absolute; left: 10px; right: 10px; top: 8px; height: 2px; border-radius: 2px;
    background: linear-gradient(90deg, transparent, #C6FF00, transparent);
    box-shadow: 0 0 10px 1px rgba(198,255,0,0.7);
    opacity: 0;
  }
  /* Barre durante el primer cuarto del ciclo y descansa el resto */
  .nb-in .nb-scanline { animation: nb-scan 4s ease-in-out infinite; }
  @keyframes nb-scan {
    0%   { transform: translateY(0); opacity: 0; }
    5%   { opacity: 1; }
    22%  { transform: translateY(var(--nb-scan-travel)); opacity: 1; }
    30%  { transform: translateY(var(--nb-scan-travel)); opacity: 0; }
    100% { transform: translateY(0); opacity: 0; }
  }

  /* Check de pago dibujándose (paso 03) */
  .nb-check-draw { stroke-dasharray: 16; stroke-dashoffset: 16; }
  .nb-in .nb-check-draw { animation: nb-draw 0.55s cubic-bezier(0.65,0,0.35,1) 0.55s forwards; }
  @keyframes nb-draw { to { stroke-dashoffset: 0; } }

  /* Hover suave de los previews */
  .nb-prev { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-prev:hover { transform: scale(1.025); box-shadow: 0 10px 26px rgba(10,15,0,0.10); }

  @media (prefers-reduced-motion: reduce) {
    .nb-pop, .nb-in .nb-pop { opacity: 1; transform: none; animation: none; }
    .nb-scanline, .nb-in .nb-scanline { display: none; animation: none; }
    .nb-check-draw { stroke-dashoffset: 0; }
    .nb-prev:hover { transform: none; }
  }

  /* ── Eventos section ── */
  /* Bento: la destacada ocupa el doble de ancho, igual que la última de la fila 2 */
  .nb-eventos-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas:
      "a a b c"
      "d e f f";
    gap: 16px;
  }

  /* ── Landia (caso real) ── */
  .nb-landia-strip { display: flex; gap: 14px; align-items: stretch; }
  .nb-landia-card {
    position: relative; flex: 1; aspect-ratio: 9 / 15; border-radius: 18px; overflow: hidden;
    background: #0A0A0F; border: 1px solid rgba(0,0,0,0.08);
    transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  /* Film strip: las impares bajan levemente para romper la grilla */
  .nb-landia-card:nth-child(even) { margin-top: 26px; }
  .nb-landia-card:hover { transform: translateY(-6px); box-shadow: 0 20px 44px rgba(10,15,0,0.18); }
  .nb-landia-card--feat { flex: 1.4; box-shadow: 0 0 0 2px #C6FF00, 0 14px 36px rgba(10,15,0,0.14); }
  .nb-landia-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  @media (prefers-reduced-motion: reduce) {
    .nb-landia-card { transition: opacity 0.4s; }
    .nb-landia-card:hover { transform: none; box-shadow: none; }
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .nb-nav-inner { padding: 0 20px !important; }
    .nb-hero-section { padding-top: 60px !important; padding-left: 24px !important; padding-right: 24px !important; padding-bottom: 32px !important; }
    .nb-steps-header { flex-direction: column !important; align-items: flex-start !important; gap: 24px !important; }
    .nb-steps-sub { text-align: left !important; max-width: 100% !important; }
    .nb-steps-grid { grid-template-columns: 1fr 1fr !important; grid-template-areas: "a b" "c c" "d d" !important; }
    .nb-step-arrow { display: none !important; }
    .nb-howit-section,
    .nb-blockchain-section,
    .nb-stats-section,
    .nb-eventos-section,
    .nb-cta-section { padding-left: 24px !important; padding-right: 24px !important; }
    .nb-eventos-grid { grid-template-columns: 1fr 1fr !important; grid-template-areas: "a a" "b c" "d e" "f f" !important; }
    .nb-landia-section { padding-left: 24px !important; padding-right: 24px !important; }
    .nb-landia-strip { overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 10px; -webkit-overflow-scrolling: touch; }
    .nb-landia-card { flex: 0 0 218px; scroll-snap-align: start; margin-top: 0 !important; }
    .nb-landia-card--feat { flex: 0 0 252px; }
    .nb-blockchain-grid { grid-template-columns: 1fr !important; }
    .nb-blockchain-left { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; padding: 60px 48px !important; }
    .nb-blockchain-right { padding: 60px 48px !important; }
    .nb-stats-grid { grid-template-columns: repeat(2, 1fr) !important; padding: 48px 40px !important; }
    .nb-stats-item { padding: 24px 20px !important; }
    /* Los 2 divs decorativos corren el índice: los items son 3..6, así que el
       inicio de cada fila cae en impar. */
    .nb-stats-item:nth-child(odd)  { border-left: none; }
    .nb-stats-item:nth-child(even) { border-left: 1px solid rgba(0,0,0,0.12); }
    .nb-faq-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-faq-sticky { position: static !important; }
    .nb-cta-inner { padding: 80px 48px !important; }
    .nb-cta-buttons { flex-wrap: wrap !important; justify-content: center !important; }
  }

  @media (max-width: 640px) {
    .nb-nav-login { display: none !important; }
    .nb-hero-h1 { font-size: clamp(38px, 9.5vw, 64px) !important; }
    .nb-hero-section { padding-top: 50px !important; padding-left: 20px !important; padding-right: 20px !important; padding-bottom: 24px !important; }
    .nb-hero-media { display: none !important; }
    .nb-steps-grid { grid-template-columns: 1fr !important; grid-template-areas: "a" "b" "c" "d" !important; }
    .nb-howit-section,
    .nb-blockchain-section,
    .nb-stats-section,
    .nb-cta-section { padding-left: 20px !important; padding-right: 20px !important; }
    .nb-blockchain-left { padding: 48px 24px !important; }
    .nb-blockchain-right { padding: 48px 24px !important; }
    .nb-stats-grid { grid-template-columns: 1fr !important; padding: 36px 28px !important; }
    .nb-stats-item { border-left: none !important; padding-top: 20px !important; padding-bottom: 20px !important; border-top: 1px solid rgba(0,0,0,0.12) !important; }
    .nb-stats-item:first-child { border-top: none !important; }
    .nb-cta-inner { padding: 56px 24px !important; }
    .nb-cta-buttons { flex-direction: column !important; width: 100% !important; }
    .nb-cta-btn { width: 100% !important; justify-content: center !important; }
    .nb-hero-cta { flex-direction: column !important; width: 100% !important; }
    .nb-hero-cta-btn { width: 100% !important; justify-content: center !important; padding-left: 24px !important; padding-right: 24px !important; }
    .nb-faq-section,
    .nb-landia-section,
    .nb-eventos-section { padding-left: 20px !important; padding-right: 20px !important; padding-bottom: 80px !important; }
    .nb-eventos-grid { grid-template-columns: 1fr !important; grid-template-areas: "a" "b" "c" "d" "e" "f" !important; }
    .nb-faq-grid { gap: 32px !important; }
    .nb-faq-answer { padding-right: 0 !important; }
  }
`

const S = {
  root: {
    fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", "DM Sans", sans-serif)',
    background: '#FFFFFF',
    color: '#0A0A0F',
    minHeight: '100vh',
    overflowX: 'hidden' as const,
  },
  accent: '#C6FF00',
  accentFg: '#0A0F00',
  accentText: '#3D6B00',
  orange: '#FF5C1A',
  muted: '#6A6A78',
  faint: '#9A9AA8',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
}

/* ── CountUp component ── */
function CountUp({ to, duration = 1800, prefix = '', suffix = '' }: {
  to: number; duration?: number; prefix?: string; suffix?: string
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(eased * to))
          if (p < 1) requestAnimationFrame(tick)
          else setVal(to)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])

  return <span ref={ref}>{prefix}{val}{suffix}</span>
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const heroMockRef = useRef<HTMLDivElement>(null)

  /* ── Scroll listener ── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* ── Reveal del mock del hero ligado al scroll ── */
  useEffect(() => {
    const el = heroMockRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

    let raf = 0
    const update = () => {
      raf = 0
      const distance = Math.max(window.innerHeight * 0.55, 1)
      const p = clamp(window.scrollY / distance, 0, 1)
      const eased = p * p * (3 - 2 * p)

      const scale = 0.9 + 0.1 * eased
      const lift = -36 * (1 - eased)
      el.style.setProperty('--nb-mock-scale', String(scale))
      el.style.setProperty('--nb-mock-lift', `${lift}px`)

      /* El degradado se ancla al borde inferior del viewport: la imagen se disuelve
         justo antes del fold y se abre hasta quedar opaca a medida que se scrollea. */
      const rect = el.getBoundingClientRect()
      const height = rect.height || 1
      const endPx = (window.innerHeight - rect.top - lift + 70) / scale
      const baseB = clamp((endPx / height) * 100, 0, 100)
      const baseA = clamp(((endPx - 190 / scale) / height) * 100, 0, 100)
      el.style.setProperty('--nb-mock-fade-a', `${baseA + (100 - baseA) * eased}%`)
      el.style.setProperty('--nb-mock-fade-b', `${baseB + (100 - baseB) * eased}%`)
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
  }, [])


  /* ── Scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll('.nb-reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('nb-in') }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style>{CSS}</style>


      {/* Grain texture */}
      <svg aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.055, pointerEvents: 'none', zIndex: 9999 }}>
        <filter id="nb-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#nb-grain)" />
      </svg>

      <div style={S.root}>

        {/* ─── NAV ─── */}
        <SiteNavbar />

        {/* ─── HERO ─── */}
        <section className="nb-hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', padding: '64px 40px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '0', left: '-14%', width: '72%', height: '88%', background: 'radial-gradient(ellipse 58% 55% at 32% 42%, rgba(198,255,0,0.26) 0%, rgba(198,255,0,0) 70%)' }} />
          </div>

          <div className="nb-hero-grid" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto', textAlign: 'center' }}>
              <h1 className="nb-hero-h1 nb-h1-in" style={{ fontSize: 'clamp(52px, 6.5vw, 82px)', lineHeight: '1.1', letterSpacing: '-0.035em', margin: '0 auto 26px', textAlign: 'center', maxWidth: 'none' }}>
                <span style={{ fontWeight: 700, color: '#000000' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>Más ventas</span>,{' '}
                  <span style={{ whiteSpace: 'nowrap' }}>menos filas</span>,{' '}
                  <span style={{ whiteSpace: 'nowrap' }}><span className="nb-marker-line nb-marker-draw">mejores eventos.</span></span>
                </span>
                <span className="sr-only"> Nubapay: menú digital, pagos móviles y retiro con QR para eventos y festivales.</span>
              </h1>

              <p className="nb-sub" style={{ fontSize: '18px', fontWeight: 400, color: 'rgba(0,0,0,0.5)', lineHeight: '1.65', maxWidth: '560px', margin: '0 auto 30px' }}>
                <span style={{ fontWeight: 400, color: '#000000' }}>Menú digital</span>, pagos móviles y <span style={{ fontWeight: 400, color: '#000000' }}>retiro con QR</span> para eventos y festivales. Sin cajas. Sin caos.
              </p>

              <div className="nb-cta nb-hero-cta" style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" className="nb-hero-cta-btn nb-hero-cta-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '60px', boxSizing: 'border-box', background: '#C6FF00', color: '#0A0F00', padding: '0 20px 0 32px', borderRadius: '100px', textDecoration: 'none', fontSize: '18px', fontWeight: 400, letterSpacing: '-0.02em' }}>
                  Crear evento
                  <span className="nb-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '100px', background: '#0A0F00', marginLeft: '6px' }}>
                    <ArrowRight color="#C6FF00" size={18} strokeWidth={1} />
                  </span>
                </Link>
                <a href="#como-funciona" className="nb-btn-fill nb-hero-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', height: '60px', boxSizing: 'border-box', color: S.muted, padding: '0 32px', borderRadius: '100px', border: `1px solid rgba(0,0,0,0.14)`, textDecoration: 'none', fontSize: '17px', fontWeight: 400 }}>
                  Cómo funciona
                </a>
              </div>

            </div>

            <div ref={heroMockRef} className="nb-hero-media" style={{ position: 'relative', margin: '82px auto 0', maxWidth: '1080px', width: '100%' }}>
              <div aria-hidden="true" style={{ position: 'absolute', left: '-8%', right: '-8%', top: '-6%', bottom: '-14%', background: 'radial-gradient(ellipse 60% 62% at 50% 42%, rgba(198,255,0,0.22) 0%, rgba(198,255,0,0) 70%)', pointerEvents: 'none' }} />
              <div className="nb-hero-mock">
                <img
                  src="/images/mock3.png"
                  alt="Panel del organizador de Nubapay: dashboard del evento con recaudación, pedidos y ventas por hora"
                  width={1697}
                  height={927}
                  loading="eager"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            </div>

          </div>
        </section>

        {/* ─── TICKER ─── */}
        <div className="nb-ticker" style={{ borderTop: `1px solid rgba(0,0,0,0.08)`, borderBottom: `1px solid rgba(0,0,0,0.08)`, padding: '18px 0', background: '#FFFFFF' }}>
          <span className="sr-only">{TICKER.join(' · ')}</span>
          <div aria-hidden="true" style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
            <div className="nb-ticker-track">
              {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#000000', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item}</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8CC800' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <section id="como-funciona" className="nb-howit-section" style={{ padding: '120px 40px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-steps-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px' }}>
            <h2 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.92', margin: 0, color: '#0A0A0F' }}>
              Del escaneo<br />al retiro.
            </h2>
            <p className="nb-steps-sub" style={{ maxWidth: '360px', color: '#000000', fontSize: '20px', lineHeight: '1.7', textAlign: 'right', marginBottom: '4px' }}>
              Tu público pide, paga y retira sin perderse el evento.
            </p>
          </div>

          <div className="nb-steps-grid">

            {/* 01 — Escaneá (chica, arriba izq) */}
            <div className="nb-reveal nb-step-card nb-bento-a" style={{ gridArea: 'a', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '26px 24px', display: 'flex', flexDirection: 'column' }}>
              <StepNum n="01" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: '16px 0 8px 0', color: '#0A0A0F' }}>Escaneá el QR</h3>
              <p style={{ fontSize: '13px', lineHeight: '1.65', margin: 0, color: '#9A9AA8' }}>Entrás al menú digital del evento desde tu celular. Sin app, sin cuenta.</p>
              <div aria-hidden="true" style={{ flex: 1, paddingTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="nb-pop nb-scanbox nb-prev" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '14px', animationDelay: '0.2s' }}>
                  <QRPattern size={88} />
                  <div className="nb-scanline" />
                </div>
              </div>
            </div>

            {/* 02 — Pedí (chica, arriba der) */}
            <div className="nb-reveal nb-step-card nb-bento-b" style={{ gridArea: 'b', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '26px 24px', display: 'flex', flexDirection: 'column', transitionDelay: '0.12s' }}>
              <StepNum n="02" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: '16px 0 8px 0', color: '#0A0A0F' }}>Elegí y pedí</h3>
              <p style={{ fontSize: '13px', lineHeight: '1.65', margin: 0, color: '#9A9AA8' }}>Navegás el catálogo, agregás al carrito y confirmás en segundos.</p>
              <div aria-hidden="true" style={{ marginTop: 'auto', paddingTop: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[['Birra artesanal', '$3.500'], ['Hamburguesa', '$8.000']].map(([name, price], idx) => (
                  <div key={name} className="nb-pop nb-prev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '9px 11px', animationDelay: `${0.2 + idx * 0.1}s` }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0F' }}>{name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F' }}>{price}</span>
                  </div>
                ))}
                <div className="nb-pop" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0A0A0F', borderRadius: '10px', padding: '9px', marginTop: '2px', animationDelay: '0.4s' }}>
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none"><path d="M3 3h2l2.5 10h9l2-7H7" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="19" r="1.4" fill="#FFFFFF"/><circle cx="17" cy="19" r="1.4" fill="#FFFFFF"/></svg>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>Agregar al carrito</span>
                  <span className="nb-pop" style={{ position: 'absolute', top: '-7px', right: '-7px', width: '19px', height: '19px', borderRadius: '50%', background: '#C6FF00', color: '#0A0F00', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FAFAFA', animationDelay: '0.6s' }}>2</span>
                </div>
              </div>
            </div>

            {/* 03 — Pagá (ancha, abajo) */}
            <div className="nb-reveal nb-step-card nb-bento-c" style={{ gridArea: 'c', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '28px 26px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap', transitionDelay: '0.24s' }}>
              <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <StepNum n="03" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: '14px 0 8px 0', color: '#0A0A0F' }}>Pagá online</h3>
                <p style={{ fontSize: '13px', lineHeight: '1.65', margin: 0, color: '#9A9AA8' }}>MercadoPago, transferencia o efectivo. 100% desde el celular, sin billetera.</p>
              </div>
              <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', flex: '1', minWidth: '220px' }}>
                <div className="nb-pop nb-prev" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '12px 14px', animationDelay: '0.25s' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path className="nb-check-draw" d="M1 5l3 3 7-7" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0F' }}>Pago confirmado</div>
                    <div style={{ fontSize: '10px', color: '#9A9AA8' }}>$38.000 · MercadoPago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['MercadoPago', 'Transferencia', 'Efectivo'].map((m, idx) => (
                    <span key={m} className="nb-pop" style={{ flex: 1, textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#0A0A0F', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '9px 0', animationDelay: `${0.35 + idx * 0.07}s` }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 04 — Retirá (grande, lime, derecha) */}
            <div className="nb-reveal nb-step-card nb-step-card-hl nb-bento-d" style={{ gridArea: 'd', background: '#C6FF00', borderRadius: '20px', padding: '32px 30px', display: 'flex', flexDirection: 'column', transitionDelay: '0.36s' }}>
              <StepNum n="04" lime />
              <h3 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', margin: '16px 0 8px 0', color: '#0A0F00' }}>Retirá sin fila</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, color: 'rgba(10,15,0,0.62)' }}>Mostrás el QR en el punto de retiro y te entregan el pedido al instante.</p>
              <div aria-hidden="true" style={{ marginTop: 'auto', paddingTop: '28px' }}>
                <div className="nb-pop nb-prev" style={{ background: '#FFFFFF', borderRadius: '18px', padding: '22px', boxShadow: '0 12px 32px rgba(10,15,0,0.12)', animationDelay: '0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>Retiro QR</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#5A8A00', background: 'rgba(198,255,0,0.25)', border: '1px solid rgba(198,255,0,0.5)', padding: '3px 9px', borderRadius: '100px' }}>Listo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                    <QRPattern value="https://nubapay.com/r/NB-0049" size={118} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#9A9AA8', fontFamily: 'monospace' }}>#NB-0049</span>
                    <span style={{ color: '#5A8A00', fontWeight: 700 }}><CountdownPill /></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── STATS BAND ─── */}
        <section className="nb-stats-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-stats-grid" style={{ background: '#C6FF00', borderRadius: '32px', padding: '64px 72px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: '-30%', right: '-5%', width: '45%', height: '160%', background: 'radial-gradient(ellipse, rgba(10,15,0,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', bottom: '-40%', left: '-5%', width: '40%', height: '160%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 60%)', pointerEvents: 'none' }} />
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13l4-4 3 3 6-7" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5h3v3" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '+', to: 40, suffix: '%', label: 'aumento en ventas promedio por evento', sub: 'vs. sin plataforma' },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#0A0F00" strokeWidth="1.6"/><path d="M9 5v4l2.5 2" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '<', to: 2, suffix: ' min', label: 'tiempo de espera en retiro', sub: 'vs. 23 min promedio' },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l5.5 2.2v3.6c0 3.3-2.3 6-5.5 7.2-3.2-1.2-5.5-3.9-5.5-7.2V4.2L9 2z" stroke="#0A0F00" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 9l1.8 1.8 3.2-3.6" stroke="#0A0F00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '', to: 100, suffix: '%', label: 'transacciones verificadas en blockchain', sub: 'unickeys · Solana' },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 1.5L4 10h4l-1 6.5L14 8h-4l1-6.5z" stroke="#0A0F00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, prefix: '+', to: 3, suffix: 'x', label: 'velocidad de atención por punto de retiro', sub: 'vs. caja tradicional' },
            ].map(({ icon, prefix, to, suffix, label, sub }) => (
              <div key={label} className="nb-stats-item" style={{ padding: '0 40px', position: 'relative' }}>
                <div aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(10,15,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>{icon}</div>
                <div className="nb-stat-num" style={{ fontSize: 'clamp(40px, 3.5vw, 62px)', fontWeight: 900, color: '#0A0F00', letterSpacing: '-0.055em', lineHeight: '1', marginBottom: '12px' }}>
                  <CountUp to={to} prefix={prefix} suffix={suffix} duration={1800} />
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(10,15,0,0.7)', lineHeight: '1.5', fontWeight: 500, marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'rgba(10,15,0,0.5)', fontWeight: 500, letterSpacing: '0.02em' }}>{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── LANDIA (caso real) ─── */}
        <section id="caso-landia" className="nb-landia-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>

          <div className="nb-reveal nb-steps-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '64px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: S.faint, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px 0' }}>Caso real</p>
              <h2 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.92', margin: 0, color: '#0A0A0F' }}>
                Menos filas,<br /><span className="nb-marker-line">más ventas.</span>
              </h2>
            </div>
            <p className="nb-steps-sub" style={{ maxWidth: '380px', color: S.muted, fontSize: '16px', lineHeight: '1.75', textAlign: 'right', marginBottom: '4px' }}>
              Nubapay en vivo en un festival real en Córdoba: la gente pidió desde el celular,
              pagó online y retiró su pedido mostrando el QR. Sin filas, sin efectivo.
            </p>
          </div>

          <div className="nb-landia-strip">
            {([
              { type: 'img', src: '/images/landia1.jpeg', alt: 'Escenario principal de Landia antes de abrir puertas', title: 'El escenario, listo', sub: 'Landia · Córdoba' },
              { type: 'video', src: '/videos/landiavideo3.mp4', alt: 'Asistentes llegando a Landia al atardecer', title: 'La previa', sub: 'Puertas abiertas, cae el sol' },
              { type: 'video', src: '/videos/landiavideo2.mp4', alt: 'Un asistente mostrando el QR de retiro de Nubapay en su celular durante el evento', title: 'Retiro real con QR', sub: 'Pagó desde el celular, retiró sin fila', featured: true },
              { type: 'img', src: '/images/landia2.jpeg', alt: 'Público frente al escenario de Landia al atardecer', title: 'El público, en el show', sub: 'Nadie haciendo fila' },
              { type: 'video', src: '/videos/landiavideo1.mp4', alt: 'Show nocturno en el escenario principal de Landia', title: 'El show', sub: 'Pedidos toda la noche' },
            ] as { type: 'img' | 'video'; src: string; alt: string; title: string; sub: string; featured?: boolean }[]).map(({ type, src, alt, title, sub, featured }, i) => (
              <div key={src} className={`nb-reveal nb-landia-card${featured ? ' nb-landia-card--feat' : ''}`} style={{ transitionDelay: `${i * 0.09}s` }}>
                {type === 'video'
                  ? <LandiaVideo src={src} label={alt} />
                  : <img className="nb-landia-media" src={src} alt={alt} loading="lazy" />}
                <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1, padding: '44px 16px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em', marginBottom: '3px' }}>{title}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.4' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="nb-reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '48px', fontSize: '13px', color: S.faint, fontWeight: 500 }}>
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1.5a4.5 4.5 0 014.5 4.5c0 3.2-4.5 6.5-4.5 6.5S2.5 9.2 2.5 6A4.5 4.5 0 017 1.5z" stroke="#8CC800" strokeWidth="1.4"/><circle cx="7" cy="6" r="1.6" stroke="#8CC800" strokeWidth="1.4"/></svg>
            Material real del evento | Landia, Córdoba
          </div>

          <div className="nb-reveal" style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
            <a
              href="https://www.instagram.com/landia_ar/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Landia (@landia_ar)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: S.muted, textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = S.faint)}
              onMouseLeave={e => (e.currentTarget.style.color = S.muted)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
              </svg>
              @landia_ar
            </a>
          </div>

        </section>

        {/* ─── BLOCKCHAIN ─── */}
        <section id="qr-antifraude" className="nb-blockchain-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-blockchain-grid" style={{ background: '#0A0A0F', borderRadius: '36px', overflow: 'hidden', position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '20%', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div className="nb-blockchain-left" style={{ padding: '80px', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 'clamp(38px, 3.2vw, 54px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', margin: '0 0 24px 0', color: '#FFFFFF' }}>
                Cada QR,<br />certificado en<br />
                <span className="nb-marker-line">blockchain.</span>
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.75', margin: '0 0 48px 0' }}>
                Usamos unickeys sobre Solana Mainnet. Cada ticket se registra con SHA-256 y Merkle Trees: imposible de falsificar, verificable en segundos.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'SHA-256', sub: 'Hash criptográfico del ticket', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="#C6FF00" strokeWidth="1.4"/><path d="M4.5 7h5M7 4.5v5" stroke="#C6FF00" strokeWidth="1.4" strokeLinecap="round"/></svg> },
                  { label: 'Merkle Trees', sub: 'Hasta 10.000 tickets por tx', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1.5" stroke="#C6FF00" strokeWidth="1.4"/><circle cx="3" cy="11" r="1.5" stroke="#C6FF00" strokeWidth="1.4"/><circle cx="11" cy="11" r="1.5" stroke="#C6FF00" strokeWidth="1.4"/><path d="M7 4.5v2M7 6.5L3 9.5M7 6.5L11 9.5" stroke="#C6FF00" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                  { label: 'Solana Mainnet', sub: 'Registro público e inmutable', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#C6FF00" strokeWidth="1.4"/><path d="M4.5 7l1.5 1.5 3-3" stroke="#C6FF00" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                ].map(({ label, sub, icon }) => (
                  <div key={label} className="nb-bc-feat" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="nb-blockchain-right" style={{ padding: '80px 64px', position: 'relative' }}>
              <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { step: 'Pedido confirmado', detail: 'ORDER_ID: 9f2e1a…c4b' },
                  { step: 'Hash SHA-256', detail: '3d8f2c…b4e6f7' },
                  { step: 'Merkle Tree', detail: 'Root: a1b2c3d4…' },
                  { step: 'Registro en Solana', detail: 'TX: 4zMf8…Ve9p' },
                  { step: 'QR emitido', detail: 'Verificable públicamente' },
                ].map(({ step, detail }, i, arr) => (
                  <div key={step} className="nb-pop" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', animationDelay: `${0.15 + i * 0.28}s` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: 'rgba(198,255,0,0.15)', border: '1.5px solid rgba(198,255,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {i < arr.length - 1 && <div className="nb-cert-line" style={{ width: '1px', height: '36px', background: 'rgba(198,255,0,0.15)', marginTop: '4px', animationDelay: `${0.15 + i * 0.28 + 0.18}s` }} />}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? '12px' : '0', paddingTop: '2px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '3px' }}>{step}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                        {detail.includes('…') ? <ScrambleText value={detail} delay={(0.15 + i * 0.28) * 1000 + 250} /> : detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── EVENTOS ─── */}
        <section id="eventos" className="nb-eventos-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>

          <div className="nb-reveal nb-steps-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px' }}>
            <h2 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.92', margin: 0, color: '#0A0A0F' }}>
              Para cada<br />tipo de evento.
            </h2>
            <p className="nb-steps-sub" style={{ maxWidth: '380px', color: S.muted, fontSize: '16px', lineHeight: '1.75', textAlign: 'right', marginBottom: '4px' }}>
              Todo lo que necesitás para vender en tu evento, listo en menos de 20 minutos.
              Menú digital, pagos online y puntos de retiro con QR, sin hardware ni
              conocimientos técnicos.
            </p>
          </div>

          <div className="nb-eventos-grid">
            {([
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="7" y="2" width="6" height="10" rx="3" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M4 9a6 6 0 0012 0M10 15v3M7 18h6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                title: 'Festivales y recitales',
                area: 'a', stat: 'Miles de pedidos simultáneos',
                desc: 'Control total de barras de bebidas, comidas y merchandising durante el show, sin colapsar el punto de venta.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3h14l-7 8zM10 11v6M7 18h6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                title: 'Boliches y discotecas',
                area: 'b', stat: 'Retiro en segundos',
                desc: 'Venta de tragos, botella y barra sin interrumpir la fiesta. El asistente pide desde su lugar con su QR único.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="6" height="11" rx="1" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="11" y="3" width="6" height="14" rx="1" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M5 9h2M5 12h2M13 6h2M13 9h2M13 12h2" stroke="#0A0A0F" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                title: 'Fiestas privadas y corporativas',
                area: 'c', stat: 'Control por sectores',
                desc: 'Menú personalizado y visibilidad en tiempo real de cada venta y cada retiro durante el evento.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><ellipse cx="10" cy="10" rx="8" ry="5" stroke="#0A0A0F" strokeWidth="1.5"/><ellipse cx="10" cy="10" rx="3.5" ry="2" stroke="#0A0A0F" strokeWidth="1.5"/></svg>,
                title: 'Estadios y venues deportivos',
                area: 'd', stat: 'Múltiples barras en paralelo',
                desc: 'Retiro instantáneo sin colas ni efectivo, sin demoras entre el pedido y la entrega.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 8l1.8-4h10.4L17 8M4 8v9h12V8M3 8h14" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                title: 'Ferias y mercados gastronómicos',
                area: 'e', stat: 'Un panel para todos los puestos',
                desc: 'Cada stand tiene su propio catálogo y su punto de retiro independiente.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5h10v9H2zM12 8h3.5L18 11v3h-6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="15" r="1.6" stroke="#0A0A0F" strokeWidth="1.5"/><circle cx="14.5" cy="15" r="1.6" stroke="#0A0A0F" strokeWidth="1.5"/></svg>,
                title: 'Food trucks y barras móviles',
                area: 'f', stat: 'Sin hardware adicional',
                desc: 'El staff opera desde cualquier dispositivo y el asistente retira sin esperar turno ni hacer fila.',
              },
            ] as { icon: React.ReactNode; title: string; desc: string; area: string; stat: string }[]).map(({ icon, title, desc, area, stat }, i) => {
              const featured = area === 'a'
              return (
                <div key={title} className="nb-reveal nb-evento-card" style={{
                  gridArea: area,
                  background: '#FAFAFA',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '20px',
                  padding: '28px 28px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transitionDelay: `${i * 0.08}s`,
                }}>
                  <div className="nb-evento-ico" aria-hidden="true" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(10,10,15,0.04)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>{icon}</div>
                  <h3 style={{ fontSize: featured ? '22px' : '17px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em', lineHeight: '1.2', margin: 0 }}>{title}</h3>
                  <p style={{ fontSize: featured ? '14px' : '13px', color: S.muted, lineHeight: '1.7', margin: 0, maxWidth: featured ? '440px' : 'none' }}>{desc}</p>
                  <span style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em', color: '#0A0A0F' }}>
                    {stat}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="nb-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', marginTop: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: S.muted, margin: 0, maxWidth: '420px' }}>¿No ves tu tipo de evento? Lo adaptamos a lo que necesites.</p>
            <a href="/register" className="nb-bc-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C6FF00', color: '#0A0F00', padding: '0 8px 0 22px', height: '52px', boxSizing: 'border-box', borderRadius: '100px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              Empezá gratis
              <span className="nb-bc-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '100px', background: '#0A0F00' }}>
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#C6FF00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </a>
          </div>

        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="nb-faq-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-faq-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }}>

            <div className="nb-reveal nb-faq-sticky" style={{ position: 'sticky', top: '96px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: S.faint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>FAQ</p>
              <h2 style={{ fontSize: 'clamp(36px, 3.5vw, 52px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', margin: '0 0 20px 0', color: '#0A0A0F' }}>
                Preguntas<br />frecuentes.
              </h2>
              <p style={{ fontSize: '15px', color: S.muted, lineHeight: '1.7', margin: 0 }}>
                ¿Tenés dudas? Acá respondemos las más comunes. Si necesitás más info, escribinos.
              </p>
            </div>

            <div className="nb-reveal" style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { q: '¿Qué es Nubapay?', a: 'Nubapay es una plataforma para eventos que permite a los asistentes comprar desde el celular, pagar online y retirar su pedido con un QR, reduciendo filas y agilizando la atención en barras o puntos de entrega.' },
                { q: '¿Necesito descargar una app?', a: 'No. Nubapay funciona desde una web app responsive, por lo que los asistentes pueden acceder escaneando un QR o entrando desde un link, sin descargar nada.' },
                { q: '¿Qué tipo de eventos pueden usar Nubapay?', a: 'Puede usarse en boliches, festivales, fiestas, recitales, eventos privados, ferias, estadios o cualquier evento con venta de productos y puntos de retiro.' },
                { q: '¿El QR se puede usar más de una vez?', a: 'No. Cada QR es único y cuenta con validación antifraude para evitar que un mismo pedido sea retirado más de una vez.' },
                { q: '¿Puedo tener varios puntos de retiro?', a: 'Sí. Podés configurar diferentes barras o sectores —por ejemplo Barra Principal, Barra VIP, Patio o Sector Norte— y asignar productos específicos a cada punto.' },
                { q: '¿Cuánto cuesta usar Nubapay?', a: 'El modelo puede adaptarse al tipo de evento. Una opción es cobrar una comisión por transacción, por ejemplo sobre cada venta realizada dentro de la plataforma. Sin costos fijos.' },
                { q: '¿Cuánto tarda en configurarse Nubapay para un evento?', a: 'Muy poco. Podés tener el menú, los puntos de retiro y los pagos listos en menos de 20 minutos. No necesitás hardware especial ni conocimientos técnicos.' },
              ].map(({ q, a }, i) => {
                const isOpen = openFaq === i
                return (
                  <div
                    key={i}
                    style={{ borderTop: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '16px', padding: '22px 0', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        fontFamily: "var(--font-bricolage, 'Bricolage Grotesque', 'DM Sans', sans-serif)",
                      }}
                    >
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0F', letterSpacing: '-0.02em', lineHeight: '1.3' }}>{q}</span>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: isOpen ? '#C6FF00' : '#F4F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.25s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                          <path d="M6 2v8M2 6h8" stroke={isOpen ? '#0A0F00' : '#6A6A78'} strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </button>
                    <div style={{
                      maxHeight: isOpen ? '300px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
                    }}>
                      <p className="nb-faq-answer" style={{ fontSize: '15px', color: S.muted, lineHeight: '1.75', margin: '0 0 22px 0', paddingRight: '44px' }}>{a}</p>
                    </div>
                  </div>
                )
              })}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />
            </div>

          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="nb-cta-section" style={{ padding: '0 40px 160px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-cta-inner" style={{ background: '#0A0A0F', borderRadius: '36px', padding: '100px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div className="nb-cta-glow" style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <h2 style={{ fontSize: 'clamp(54px, 6.5vw, 96px)', fontWeight: 500, letterSpacing: '-0.055em', lineHeight: '0.88', margin: '0 0 28px 0', color: '#FFFFFF', maxWidth: '700px' }}>
              Tu próximo<br />evento <span className="nb-marker-line">sin cajas.</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', margin: '0 0 52px 0', maxWidth: '440px' }}>
              Registrate gratis, creá tu evento en minutos y empezá a vender. Sin costos fijos. Solo pagás cuando vendés.
            </p>
            <div className="nb-cta-buttons" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/register" className="nb-cta-btn nb-hero-cta-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '58px', boxSizing: 'border-box', background: '#C6FF00', color: '#0A0F00', padding: '0 8px 0 32px', borderRadius: '100px', textDecoration: 'none', fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em' }}>
                Crear mi evento gratis
                <span className="nb-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '100px', background: '#0A0F00' }}>
                  <ArrowRight color="#C6FF00" size={18} strokeWidth={1} />
                </span>
              </Link>
              <Link href="/login" className="nb-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', height: '58px', boxSizing: 'border-box', color: '#FFFFFF', padding: '0 30px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontSize: '15px', fontWeight: 400 }}>
                Ya tengo cuenta
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '28px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              {['Sin tarjeta', 'Setup en 20 min', 'Cancelás cuando quieras'].map((t, i) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
                  {i > 0 && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />}
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <SiteFooter />

      </div>
    </>
  )
}

function ArrowRight({ color = '#0A0A0F', size = 14, strokeWidth = 1.5 }: { color?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckMark() {
  return (
    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
      <path d="M1 3l2 2 4-4" stroke="#3D6B00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StepNum({ n, lime = false }: { n: string; lime?: boolean }) {
  return (
    <span style={{ display: 'block', fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: lime ? '#0A0F00' : '#0A0A0F' }}>{n}</span>
  )
}

function ScrambleText({ value, delay = 0 }: { value: string; delay?: number }) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const pool = '0123456789abcdefABCDEF'
    let interval: ReturnType<typeof setInterval> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return
      started.current = true
      obs.disconnect()
      timer = setTimeout(() => {
        let frame = 0
        const total = 16
        interval = setInterval(() => {
          frame += 1
          const revealed = Math.floor((frame / total) * value.length)
          setDisplay(value.split('').map((ch, i) => (i < revealed || ch === '…' || ch === ' ' || ch === ':') ? ch : pool[Math.floor(Math.random() * pool.length)]).join(''))
          if (frame >= total && interval) { clearInterval(interval); setDisplay(value) }
        }, 45)
      }, delay)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => { obs.disconnect(); if (interval) clearInterval(interval); if (timer) clearTimeout(timer) }
  }, [value, delay])
  return <span ref={ref}>{display}</span>
}

/* Video de la sección Landia: reproduce solo mientras está en viewport
   (ahorra batería/datos) y no arranca con prefers-reduced-motion. */
function LandiaVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {})
      else el.pause()
    }, { threshold: 0.25 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      className="nb-landia-media"
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
    />
  )
}

function CountdownPill() {
  const [s, setS] = useState(45)
  useEffect(() => {
    const id = setInterval(() => setS(v => (v <= 1 ? 45 : v - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const mm = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return <>Listo en {mm}:{ss}</>
}

function QRPattern({ value = 'https://nubapay.com', size = 76 }: { value?: string; size?: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      bgColor="#FFFFFF"
      fgColor="#0A0A0F"
      marginSize={0}
      style={{ display: 'block' }}
    />
  )
}
