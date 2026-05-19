'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import SiteNavbar from '@/components/SiteNavbar'

const TICKER = [
  'Sin filas', 'Menú digital', 'QR antifraude', 'Pagos online',
  'IA integrada', 'Tiempo real', 'Eventos masivos',
]

const CSS = `
  @keyframes nb-fade-up {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nb-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes nb-float-a {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-16px); }
  }
  @keyframes nb-float-b {
    0%, 100% { transform: translateY(0px) rotate(3deg); }
    50%      { transform: translateY(-12px) rotate(3deg); }
  }
  @keyframes nb-float-c {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50%      { transform: translateY(-10px) rotate(-2deg); }
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
  @keyframes nb-msg-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nb-typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30%           { transform: translateY(-4px); opacity: 1; }
  }
  .nb-msg { opacity: 0; animation: nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
  .nb-msg-0 { animation-delay: 0.3s; }
  .nb-msg-1 { animation-delay: 1.1s; }
  .nb-msg-2 { animation-delay: 2.0s; }
  .nb-msg-3 { animation-delay: 2.9s; }
  .nb-msg-4 { animation-delay: 3.7s; }
  .nb-typing-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.4); animation: nb-typing 1.1s ease-in-out infinite; }
  .nb-typing-dot:nth-child(2) { animation-delay: 0.18s; }
  .nb-typing-dot:nth-child(3) { animation-delay: 0.36s; }
  .nb-typing-bubble { opacity: 0; animation: nb-msg-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
  .nb-typing-1 { animation-delay: 0.7s;  }
  .nb-typing-2 { animation-delay: 1.7s;  }
  .nb-typing-3 { animation-delay: 2.6s;  }
  .nb-typing-fade-1 { animation: nb-typing-out 0.2s ease forwards; animation-delay: 1.05s; }
  .nb-typing-fade-2 { animation: nb-typing-out 0.2s ease forwards; animation-delay: 1.95s; }
  .nb-typing-fade-3 { animation: nb-typing-out 0.2s ease forwards; animation-delay: 2.85s; }
  @keyframes nb-typing-out {
    to { opacity: 0; visibility: hidden; }
  }

  .nb-hw { display: block; animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) both; }
  .nb-hw:nth-child(1) { animation-delay: 0.05s; }
  .nb-hw:nth-child(2) {
    animation-delay: 0.17s;
    display: inline-block;
    color: #0A0F00;
    padding: 2px 14px 6px;
    border-radius: 10px;
    margin-left: -4px;
    position: relative;
    background: transparent;
  }
  .nb-hw:nth-child(2)::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #C6FF00;
    border-radius: 10px;
    transform: scaleX(0);
    transform-origin: left;
    animation: nb-highlight 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
    animation-delay: 0.85s;
    z-index: -1;
  }
  @keyframes nb-highlight {
    to { transform: scaleX(1); }
  }
  .nb-hw:nth-child(3) { animation-delay: 0.29s; }

  .nb-sub   { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
  .nb-cta   { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.48s both; }
  .nb-stats { animation: nb-fade-up 1s cubic-bezier(0.16,1,0.3,1) 0.58s both; }
  .nb-badge { animation: nb-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0s both; }

  .nb-float-a { animation: nb-float-a 7s ease-in-out infinite; }
  .nb-float-b { animation: nb-float-b 9s ease-in-out 1.5s infinite; }
  .nb-float-c { animation: nb-float-c 6s ease-in-out 3s infinite; }

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

  /* ── Scroll reveal ── */
  .nb-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
  }
  .nb-reveal.nb-in { opacity: 1; transform: translateY(0); }

  /* ── Live counter pulse ── */
  @keyframes nb-count-pop {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
  .nb-count-pop { animation: nb-count-pop 0.3s cubic-bezier(0.16,1,0.3,1); }

  /* ── Phone tap ripple ── */
  @keyframes nb-tap-ripple {
    0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0.55; }
    100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
  }
  .nb-tap-dot { animation: nb-tap-ripple 0.42s ease-out forwards; pointer-events: none; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .nb-nav-inner { padding: 0 20px !important; }
    .nb-hero-section { padding-top: 100px !important; padding-left: 24px !important; padding-right: 24px !important; padding-bottom: 60px !important; }
    .nb-hero-grid { grid-template-columns: 1fr !important; }
    .nb-hero-cards { display: none !important; }
    .nb-steps-header { flex-direction: column !important; align-items: flex-start !important; gap: 24px !important; }
    .nb-steps-sub { text-align: left !important; max-width: 100% !important; }
    .nb-steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .nb-step-arrow { display: none !important; }
    .nb-howit-section,
    .nb-atendium-section,
    .nb-blockchain-section,
    .nb-stats-section,
    .nb-cta-section { padding-left: 24px !important; padding-right: 24px !important; }
    .nb-atendium-card { padding: 48px !important; grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-blockchain-grid { grid-template-columns: 1fr !important; }
    .nb-blockchain-left { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; padding: 60px 48px !important; }
    .nb-blockchain-right { padding: 60px 48px !important; }
    .nb-stats-grid { grid-template-columns: repeat(2, 1fr) !important; padding: 48px 40px !important; }
    .nb-stats-item { padding: 24px 20px !important; }
    .nb-faq-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-faq-sticky { position: static !important; }
    .nb-cta-inner { padding: 80px 48px !important; }
    .nb-cta-buttons { flex-wrap: wrap !important; justify-content: center !important; }
    .nb-footer-top { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
    .nb-footer-links-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
  }

  @media (max-width: 640px) {
    .nb-nav-login { display: none !important; }
    .nb-hero-h1 { font-size: clamp(60px, 17vw, 116px) !important; }
    .nb-hero-section { padding-top: 90px !important; padding-left: 20px !important; padding-right: 20px !important; padding-bottom: 48px !important; }
    .nb-hero-stats { gap: 28px !important; }
    .nb-steps-grid { grid-template-columns: 1fr !important; }
    .nb-howit-section,
    .nb-atendium-section,
    .nb-blockchain-section,
    .nb-stats-section,
    .nb-cta-section { padding-left: 20px !important; padding-right: 20px !important; }
    .nb-atendium-card { padding: 32px 24px !important; gap: 36px !important; }
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
    .nb-faq-section { padding-left: 20px !important; padding-right: 20px !important; padding-bottom: 80px !important; }
    .nb-faq-grid { gap: 32px !important; }
    .nb-faq-answer { padding-right: 0 !important; }
    .nb-footer { padding: 40px 20px 24px !important; }
    .nb-footer-top { grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-footer-links-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
    .nb-footer-wordmark { font-size: clamp(56px, 18vw, 180px) !important; }
    .nb-footer-verify { display: none !important; }
  }
`

const S = {
  root: {
    fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
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
  const [chatConfirmed, setChatConfirmed] = useState(false)
  const [liveOrders, setLiveOrders] = useState(1247)
  const [phoneState, setPhoneState] = useState<'catalog' | 'tapping-cart' | 'cart' | 'tapping-pay' | 'qr'>('catalog')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  /* ── Scroll listener ── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
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

  /* ── Live orders counter ── */
  useEffect(() => {
    const id = setInterval(() => {
      setLiveOrders(n => n + Math.floor(Math.random() * 3 + 1))
    }, 2800)
    return () => clearInterval(id)
  }, [])

  /* ── Phone mockup interaction loop ── */
  useEffect(() => {
    let canceled = false
    const wait = (ms: number) => new Promise<void>(res => setTimeout(res, ms))
    const run = async () => {
      while (!canceled) {
        await wait(3200)
        if (canceled) break
        setPhoneState('tapping-cart')
        await wait(440)
        if (canceled) break
        setPhoneState('cart')
        await wait(2800)
        if (canceled) break
        setPhoneState('tapping-pay')
        await wait(440)
        if (canceled) break
        setPhoneState('qr')
        await wait(3000)
        if (canceled) break
        setPhoneState('catalog')
        await wait(500)
      }
    }
    run()
    return () => { canceled = true }
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
        <section className="nb-hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '60px 40px 80px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '65%', height: '70%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.28) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '50%', height: '55%', background: 'radial-gradient(ellipse, rgba(255,92,26,0.1) 0%, transparent 65%)' }} />
          </div>

          <div className="nb-hero-grid" style={{ display: 'grid', gridTemplateColumns: '54% 46%', gap: '60px', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <div>
              <h1 className="nb-hero-h1" style={{ fontSize: '116px', fontWeight: 900, lineHeight: '0.92', letterSpacing: '-0.05em', margin: '0 0 16px 0' }}>
                <span className="nb-hw">PEDÍ.</span>
                <span className="nb-hw">PAGÁ.</span>
                <span className="nb-hw">RETIRÁ.</span>
              </h1>

              <p className="nb-sub" style={{ fontSize: '18px', fontWeight: 400, color: '#000000', lineHeight: '1.65', maxWidth: '560px', margin: '0 0 48px 0' }}>
                <span style={{ background: '#C6FF00', color: '#0A0F00', padding: '0 6px 2px', borderRadius: '5px' }}>Menú digital</span>, pagos móviles y <span style={{ background: '#C6FF00', color: '#0A0F00', padding: '0 6px 2px', borderRadius: '5px' }}>retiro con QR</span> para eventos y festivales. Cero filas. Cero caos.<br />
                <span style={{ background: '#C6FF00', color: '#0A0F00', padding: '0 8px 3px', borderRadius: '6px', display: 'inline-block', marginTop: '6px', fontWeight: 900, textTransform: 'uppercase' as const }}>Más ventas.</span>
              </p>

              <div className="nb-cta nb-hero-cta" style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" className="nb-hero-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C6FF00', color: '#0A0F00', padding: '16px 32px', borderRadius: '100px', textDecoration: 'none', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Crear mi evento
                  <ArrowRight color="#0A0F00" />
                </Link>
                <a href="#como-funciona" className="nb-btn-fill nb-hero-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', color: S.muted, padding: '16px 24px', borderRadius: '100px', border: `1px solid rgba(0,0,0,0.14)`, textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>
                  Ver cómo funciona
                </a>
              </div>

              <div className="nb-stats nb-hero-stats" style={{ display: 'flex', gap: '48px', marginTop: '64px', paddingTop: '40px', borderTop: `1px solid rgba(0,0,0,0.1)`, flexWrap: 'wrap' }}>
                {[
                  { prefix: '+', to: 10, suffix: 'K', label: 'pedidos procesados' },
                  { prefix: '', to: 0, suffix: ' min', label: 'espera en retiro' },
                  { prefix: '~', to: 1, suffix: '%', label: 'comisión total' },
                ].map(({ prefix, to, suffix, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.045em', color: '#000000' }}>
                      {to === 0 ? '0 min' : <CountUp to={to} prefix={prefix} suffix={suffix} duration={1600} />}
                    </div>
                    <div style={{ fontSize: '12px', color: '#000000', marginTop: '4px', fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Phone mockup */}
            <div className="nb-hero-cards" style={{ position: 'relative', height: '620px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-200px', marginLeft: '-180px' }}>

              {/* Phone frame */}
              <div className="nb-float-a" style={{
                width: '258px', height: '524px',
                borderRadius: '46px',
                background: '#0A0A0F',
                padding: '3px',
                boxShadow: '0 48px 100px rgba(0,0,0,0.22), 0 12px 36px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                position: 'relative', zIndex: 2,
                flexShrink: 0,
              }}>
                {/* Screen */}
                <div style={{ width: '100%', height: '100%', borderRadius: '44px', background: '#F7F7FA', overflow: 'hidden', position: 'relative' }}>

                  {/* Dynamic island */}
                  <div style={{ position: 'absolute', top: '13px', left: '50%', transform: 'translateX(-50%)', width: '78px', height: '22px', borderRadius: '100px', background: '#0A0A0F', zIndex: 10 }} />

                  {/* ── Catalog screen ── */}
                  <div style={{
                    position: 'absolute', inset: 0, background: '#F7F7FA',
                    transform: (phoneState === 'catalog' || phoneState === 'tapping-cart') ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.38s cubic-bezier(0.32,0,0,1)',
                  }}>
                    <div style={{ paddingTop: '50px', padding: '50px 14px 10px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#9A9AA8', marginBottom: '2px', letterSpacing: '0.02em' }}>Lollapalooza · Zona VIP</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.03em' }}>¿Qué querés pedir?</div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', padding: '8px 14px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      {[['Bebidas', true], ['Comidas', false], ['Snacks', false]].map(([cat, active]) => (
                        <span key={String(cat)} style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: active ? '#C6FF00' : '#F0F0F0', color: active ? '#0A0F00' : '#6A6A78', whiteSpace: 'nowrap' }}>{String(cat)}</span>
                      ))}
                    </div>
                    {[
                      { name: 'Fernet con Coca', price: '$8.000', added: true, color: '#FDE8DC', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="2" width="6" height="12" rx="2" stroke="#C2410C" strokeWidth="1.2"/><path d="M5 6h6" stroke="#C2410C" strokeWidth="1.2"/><path d="M7 4h2" stroke="#C2410C" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                      { name: 'Cerveza Heineken', price: '$6.000', added: false, color: '#DCFCE7', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 4h6l1 9H4L5 4z" stroke="#15803D" strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 4V3a1 1 0 012 0v1" stroke="#15803D" strokeWidth="1.2"/><path d="M5 7h6" stroke="#15803D" strokeWidth="1.2" strokeDasharray="1.5 1.5"/></svg> },
                      { name: 'Agua mineral', price: '$2.500', added: false, color: '#DBEAFE', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 4 7 4 10a4 4 0 008 0c0-3-4-8-4-8z" stroke="#1D4ED8" strokeWidth="1.2" strokeLinejoin="round"/></svg> },
                    ].map(({ name, price, added, color, icon }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#FFFFFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0F', lineHeight: '1.3' }}>{name}</div>
                            <div style={{ fontSize: '10px', color: '#9A9AA8', marginTop: '1px' }}>{price}</div>
                          </div>
                        </div>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: added ? '#C6FF00' : '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {added
                            ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="#0A0F00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="#6A6A78" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          }
                        </div>
                      </div>
                    ))}
                    {/* Cart bar */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '12px', right: '12px', background: phoneState === 'tapping-cart' ? 'rgba(198,255,0,0.65)' : '#C6FF00', borderRadius: '100px', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0A0F00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#C6FF00' }}>1</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A0F00' }}>Ver carrito</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0A0F00' }}>$8.000</span>
                    </div>
                    {/* Tap ripple on cart bar */}
                    {phoneState === 'tapping-cart' && (
                      <div key={String(Date.now())} className="nb-tap-dot" style={{ position: 'absolute', bottom: '36px', left: '38%', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.18)' }} />
                    )}
                  </div>

                  {/* ── Cart screen ── */}
                  <div style={{
                    position: 'absolute', inset: 0, background: '#F7F7FA',
                    transform: (phoneState === 'cart' || phoneState === 'tapping-pay') ? 'translateX(0)' : (phoneState === 'qr' ? 'translateX(-100%)' : 'translateX(100%)'),
                    transition: 'transform 0.38s cubic-bezier(0.32,0,0,1)',
                  }}>
                    {/* Header */}
                    <div style={{ paddingTop: '50px', padding: '50px 14px 12px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F4F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none"><path d="M5.5 1.5L2 5l3.5 3.5" stroke="#0A0A0F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.02em' }}>Tu carrito</span>
                      <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, background: '#C6FF00', color: '#0A0F00', borderRadius: '100px', padding: '2px 8px' }}>1 item</span>
                    </div>
                    {/* Cart item */}
                    <div style={{ margin: '10px 12px 0', background: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', padding: '11px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FDE8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="2" width="6" height="12" rx="2" stroke="#C2410C" strokeWidth="1.2"/><path d="M5 6h6" stroke="#C2410C" strokeWidth="1.2"/><path d="M7 4h2" stroke="#C2410C" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0F' }}>Fernet con Coca</div>
                          <div style={{ fontSize: '10px', color: '#9A9AA8', marginTop: '1px' }}>$8.000</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="2" viewBox="0 0 8 2" fill="none"><path d="M1 1h6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0F', width: '10px', textAlign: 'center' }}>1</span>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#C6FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 1v6M1 4h6" stroke="#0A0F00" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Summary */}
                    <div style={{ margin: '8px 12px 0', background: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid #F4F4F6' }}>
                        <span style={{ fontSize: '10px', color: '#9A9AA8' }}>Subtotal</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#0A0A0F' }}>$8.000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid #F4F4F6' }}>
                        <span style={{ fontSize: '10px', color: '#9A9AA8' }}>Cargo por servicio</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#16A34A' }}>Gratis</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F' }}>Total</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.03em' }}>$8.000</span>
                      </div>
                    </div>
                    {/* Pay CTA */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '12px', right: '12px', background: phoneState === 'tapping-pay' ? 'rgba(198,255,0,0.65)' : '#C6FF00', borderRadius: '100px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0A0F00' }}>Ir a pagar · $8.000</span>
                    </div>
                    {/* Tap ripple on pay CTA */}
                    {phoneState === 'tapping-pay' && (
                      <div key={String(Date.now())} className="nb-tap-dot" style={{ position: 'absolute', bottom: '36px', left: '50%', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.18)' }} />
                    )}
                  </div>

                  {/* ── QR screen ── */}
                  <div style={{
                    position: 'absolute', inset: 0, background: '#F7F7FA',
                    transform: phoneState === 'qr' ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.38s cubic-bezier(0.32,0,0,1)',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Header */}
                    <div style={{ paddingTop: '50px', padding: '50px 14px 12px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F4F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none"><path d="M5.5 1.5L2 5l3.5 3.5" stroke="#0A0A0F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.02em' }}>Tu pedido</span>
                    </div>

                    {/* QR area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '14px' }}>
                      {/* QR card */}
                      <div style={{ background: '#FFFFFF', borderRadius: '22px', border: '1px solid rgba(0,0,0,0.07)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: '100%' }}>
                        {/* Lime ring around QR */}
                        <div style={{ padding: '10px', background: 'rgba(198,255,0,0.12)', borderRadius: '16px', border: '1.5px solid rgba(198,255,0,0.5)' }}>
                          <QRPattern />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.02em' }}>Mostrá este QR</div>
                          <div style={{ fontSize: '10px', color: '#9A9AA8', marginTop: '2px' }}>en el punto de retiro</div>
                        </div>
                        <div style={{ width: '100%', height: '1px', background: '#F4F4F6' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: '10px', color: '#9A9AA8', fontFamily: 'monospace' }}>#NB-0049</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span style={{ fontSize: '9px', fontWeight: 600, color: '#16A34A' }}>Verificado · Solana</span>
                          </div>
                        </div>
                      </div>

                      {/* Items summary */}
                      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', padding: '10px 14px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#9A9AA8' }}>Fernet con Coca ×1</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F' }}>$8.000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment confirmed badge — top right */}
              <div className="nb-float-b" style={{
                position: 'absolute', top: '52px', right: '68px',
                background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: '18px', padding: '11px 14px',
                boxShadow: '0 8px 28px rgba(0,0,0,0.09)',
                display: 'flex', alignItems: 'center', gap: '9px', zIndex: 3,
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3 3 7-7" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0F', whiteSpace: 'nowrap' }}>Pago confirmado</div>
                  <div style={{ fontSize: '10px', color: '#9A9AA8' }}>$38.000 · MP</div>
                </div>
              </div>

              {/* QR card — bottom right */}
              <div className="nb-float-c" style={{
                position: 'absolute', bottom: '68px', right: '60px', width: '158px',
                background: S.surface, border: `1px solid rgba(0,0,0,0.08)`,
                borderRadius: '24px', padding: '16px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.12)', zIndex: 3,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>Retiro QR</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: S.accentText, background: 'rgba(198,255,0,0.2)', border: '1px solid rgba(198,255,0,0.4)', padding: '2px 7px', borderRadius: '100px' }}>Listo</span>
                </div>
                {/* QR centered */}
                <div style={{ background: '#F7F7FA', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '72px', height: '72px' }}><QRPattern /></div>
                </div>
                {/* Order info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: S.faint, fontFamily: 'monospace' }}>#NB-0049</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E' }} />
                    <span style={{ fontSize: '9px', color: '#16A34A', fontWeight: 600 }}>Verificado</span>
                  </div>
                </div>
              </div>

              {/* 0 min card — left */}
              <div style={{
                position: 'absolute', bottom: '140px', left: '80px',
                background: S.accent, borderRadius: '20px', padding: '16px 18px',
                boxShadow: '0 16px 40px rgba(198,255,0,0.4)', zIndex: 3,
                animation: 'nb-float-c 6s ease-in-out 3s infinite',
              }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(10,15,0,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Espera</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: S.accentFg, letterSpacing: '-0.055em', lineHeight: '1' }}>0 min</div>
                <div style={{ fontSize: '9px', color: 'rgba(10,15,0,0.42)', marginTop: '4px' }}>vs. 23 min avg</div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── TICKER ─── */}
        <div style={{ borderTop: `1px solid rgba(0,0,0,0.08)`, borderBottom: `1px solid rgba(0,0,0,0.08)`, padding: '18px 0', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', animation: 'nb-marquee 24s linear infinite', width: 'max-content' }}>
            {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#000000', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item}</span>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#8CC800', opacity: 0.7 }} />
              </div>
            ))}
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <section id="como-funciona" className="nb-howit-section" style={{ padding: '120px 40px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-steps-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px' }}>
            <h2 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.92', margin: 0, color: '#0A0A0F' }}>
              Del escaneo<br />al retiro.
            </h2>
            <p className="nb-steps-sub" style={{ maxWidth: '360px', color: '#000000', fontSize: '20px', lineHeight: '1.7', textAlign: 'right', marginBottom: '4px' }}>
              Escaneás, pedís, pagás y retirás.<br />Sin filas, sin caos, sin fricción.<br />El flujo más rápido del mercado.
            </p>
          </div>

          <div className="nb-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { n: '01', title: 'Escaneá el QR', desc: 'Entrás al menú digital del evento desde tu celular. Sin app. Sin cuenta.', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="12" y="2" width="8" height="8" rx="1.5" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="2" y="12" width="8" height="8" rx="1.5" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="14" y="14" width="2" height="2" fill="#0A0A0F"/><rect x="18" y="14" width="2" height="2" fill="#0A0A0F"/><rect x="14" y="18" width="2" height="2" fill="#0A0A0F"/><rect x="18" y="18" width="2" height="2" fill="#0A0A0F"/></svg>, highlight: false },
              { n: '02', title: 'Elegí y pedí', desc: 'Navegás el catálogo, agregás al carrito y confirmás el pedido en segundos.', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 3h2l2.5 10h9l2-7H7" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="19" r="1.5" fill="#0A0A0F"/><circle cx="17" cy="19" r="1.5" fill="#0A0A0F"/></svg>, highlight: false },
              { n: '03', title: 'Pagá online', desc: 'MercadoPago, transferencia o efectivo. 100% desde el celular, sin billetera.', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="18" height="13" rx="2.5" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M2 9h18" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="5" y="13" width="4" height="2" rx="1" fill="#0A0A0F"/></svg>, highlight: false },
              { n: '04', title: 'Retirá sin fila', desc: 'Mostrás el QR certificado en blockchain y te van el pedido listo en el acto.', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11l5 5 9-9" stroke="#0A0F00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, highlight: true },
            ].map(({ n, title, desc, icon, highlight }, i) => (
              <div key={n} className="nb-reveal" style={{
                background: highlight ? '#C6FF00' : '#FAFAFA',
                border: highlight ? 'none' : '1px solid rgba(0,0,0,0.07)',
                borderRadius: '20px', padding: '32px 28px 36px',
                position: 'relative', display: 'flex', flexDirection: 'column', gap: '0',
                transitionDelay: `${i * 0.1}s`,
                zIndex: 4 - i,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: highlight ? 'rgba(10,15,0,0.4)' : '#C8C8D0', letterSpacing: '0.1em' }}>{n}</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: highlight ? 'rgba(10,15,0,0.1)' : '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px 0', color: highlight ? '#0A0F00' : '#0A0A0F' }}>{title}</h3>
                <p style={{ fontSize: '13px', lineHeight: '1.7', margin: 0, color: highlight ? 'rgba(10,15,0,0.58)' : '#9A9AA8' }}>{desc}</p>
                {i < 3 && (
                  <div className="nb-step-arrow" style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '28px', height: '28px', background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5.5 2.5l3 2.5-3 2.5" stroke="#C8C8D0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── ATENDIUM ─── */}
        <section id="atendium" className="nb-atendium-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-atendium-card" style={{
            background: '#FFFFFF', borderRadius: '36px', border: '1px solid rgba(0,0,0,0.08)',
            padding: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px',
            alignItems: 'center', overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '55%', height: '130%', background: 'radial-gradient(ellipse, rgba(255,92,26,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '28px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF5C1A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Atendium IA</span>
              </div>
              <h2 style={{ fontSize: 'clamp(38px, 3.8vw, 58px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', margin: '0 0 24px 0', color: '#0A0A0F' }}>
                Tu vendedor<br />más inteligente.
              </h2>
              <p style={{ fontSize: '16px', color: S.muted, lineHeight: '1.75', margin: '0 0 44px 0', maxWidth: '380px' }}>
                Atendium atiende, recomienda y vende por vos. Disponible 24/7 por web y WhatsApp, con upselling personalizado para cada asistente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {([
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1L2 9h6l-1 6 7-8H8l1-6z" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: 'Responde consultas al instante' },
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="#FF5C1A" strokeWidth="1.5"/><circle cx="8" cy="8" r="6" stroke="#FF5C1A" strokeWidth="1.5" strokeDasharray="2 2"/><path d="M13.5 2.5l-3.2 3.2M2.5 13.5l3.2-3.2" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: 'Sugiere combos con upselling inteligente' },
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.2 2 3 4.2 3 7c0 1.8 1 3.4 2.4 4.3V13h5v-1.7C11.9 10.4 13 8.8 13 7c0-2.8-2.2-5-5-5z" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13h4M8 2v1" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round"/></svg>, text: 'Entiende el menú y el contexto del evento' },
                  { svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l4-4 3 3 5-7" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 5h3v3" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: 'Escala sin contratar más staff' },
                ] as { svg: React.ReactNode; text: string }[]).map(({ svg, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: 'rgba(255,92,26,0.08)', border: '1px solid rgba(255,92,26,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{svg}</div>
                    <span style={{ fontSize: '14px', color: S.muted, fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat UI */}
            <div style={{ background: '#F7F7F5', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.08)', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 22px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#FFFFFF' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF5C1A 0%, #FF8C4A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="7" width="12" height="9" rx="3" stroke="white" strokeWidth="1.6"/>
                    <path d="M7 7V5.5a3 3 0 016 0V7" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="7.5" cy="11.5" r="1" fill="white"/>
                    <circle cx="12.5" cy="11.5" r="1" fill="white"/>
                    <path d="M8.5 13.5c.4.4 2.6.4 3 0" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M10 4V2.5M10 2.5H8.5M10 2.5H11.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>Atendium</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
                    <span style={{ fontSize: '11px', color: S.faint, fontWeight: 500 }}>En línea · responde al instante</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '8px', height: '380px', overflow: 'hidden', justifyContent: 'flex-end' }}>
                <div className="nb-typing-bubble nb-typing-1 nb-typing-fade-1" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
                <div className="nb-msg nb-msg-0" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                    Vi que pediste la Heineken. ¿Te suma un Fernet con Coca? Van perfectas juntas.
                  </div>
                </div>
                <div className="nb-msg nb-msg-1" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: 'rgba(255,92,26,0.1)', border: '1px solid rgba(255,92,26,0.22)', borderRadius: '16px 4px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#0A0A0F' }}>
                    Dale, agregá uno.
                  </div>
                </div>
                <div className="nb-typing-bubble nb-typing-2 nb-typing-fade-2" style={{ display: 'flex', justifyContent: 'flex-start', maxHeight: '6px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
                <div className="nb-msg nb-msg-2" style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-8px' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                    ¡Listo! También tengo el Combo Tragos (Heineken + Fernet) con 20% off.
                  </div>
                </div>
                <div className="nb-msg nb-msg-3" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: 'rgba(255,92,26,0.1)', border: '1px solid rgba(255,92,26,0.22)', borderRadius: '16px 4px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#0A0A0F' }}>
                    ¿Cuánto sale?
                  </div>
                </div>
                <div className="nb-typing-bubble nb-typing-3 nb-typing-fade-3" style={{ display: 'flex', justifyContent: 'flex-start', maxHeight: '6px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
                <div className="nb-msg nb-msg-4" style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-8px' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                    $19.200 en lugar de $24.000. ¿Lo sumamos al pedido?
                  </div>
                </div>
              </div>

              {chatConfirmed && (
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
                    <div style={{ maxWidth: '82%', padding: '10px 14px', background: 'rgba(255,92,26,0.1)', border: '1px solid rgba(255,92,26,0.22)', borderRadius: '16px 4px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#0A0A0F' }}>Sí, sumalo al pedido.</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.7s both' }}>
                    <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                      ¡Listo! Combo Tragos agregado. Tu total es <strong>$43.200</strong>. ¿Confirmamos el pedido?
                    </div>
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 20px 20px' }}>
                {chatConfirmed ? (
                  <div style={{ display: 'flex', gap: '8px', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.9s both' }}>
                    <div style={{ flex: 1, background: 'linear-gradient(135deg, #FF5C1A 0%, #FF7A3D 100%)', borderRadius: '14px', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Confirmar pedido</span>
                    </div>
                    <div onClick={() => setChatConfirmed(false)} style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '14px', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#6A6A78" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setChatConfirmed(true)} style={{ background: 'linear-gradient(135deg, #FF5C1A 0%, #FF7A3D 100%)', borderRadius: '14px', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Sí, sumalo al pedido</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── BLOCKCHAIN ─── */}
        <section id="qr-antifraude" className="nb-blockchain-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-blockchain-grid" style={{ background: '#0A0A0F', borderRadius: '36px', overflow: 'hidden', position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '20%', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div className="nb-blockchain-left" style={{ padding: '80px', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 'clamp(38px, 3.2vw, 54px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', margin: '0 0 24px 0', color: '#FFFFFF' }}>
                Cada QR,<br />certificado en<br />
                <span style={{ background: S.accent, color: S.accentFg, padding: '2px 10px 6px', borderRadius: '8px', display: 'inline-block', marginTop: '6px' }}>blockchain.</span>
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
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
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
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '36px' }}>Proceso de certificación</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { step: 'Pedido confirmado', detail: 'ORDER_ID: 9f2e1a…c4b', done: true },
                  { step: 'Hash SHA-256', detail: '3d8f2c…b4e6f7', done: true },
                  { step: 'Merkle Tree', detail: 'Root: a1b2c3d4…', done: true },
                  { step: 'Registro en Solana', detail: 'TX: 4zMf8…Ve9p', done: true },
                  { step: 'QR emitido', detail: 'Verificable públicamente', done: true },
                ].map(({ step, detail, done }, i, arr) => (
                  <div key={step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: done ? 'rgba(198,255,0,0.15)' : 'rgba(255,255,255,0.05)', border: done ? '1.5px solid rgba(198,255,0,0.5)' : '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {done ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
                      </div>
                      {i < arr.length - 1 && <div style={{ width: '1px', height: '36px', background: 'rgba(198,255,0,0.15)', marginTop: '4px' }} />}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? '12px' : '0', paddingTop: '2px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '3px' }}>{step}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '40px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', borderRadius: '100px', padding: '10px 18px' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 2.5 3 .5-2 2 .5 3L7 8l-3 1 .5-3-2-2 3-.5z" stroke="#C6FF00" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: '12px', fontWeight: 700, color: S.accentText, letterSpacing: '0.04em' }}>Verificado en Solana Mainnet</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS BAND ─── */}
        <section className="nb-stats-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div className="nb-reveal nb-stats-grid" style={{ background: '#C6FF00', borderRadius: '32px', padding: '64px 72px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative', overflow: 'hidden' }}>
            {[
              { prefix: '+', to: 40, suffix: '%', label: 'aumento en ventas promedio por evento', sub: 'vs. sin plataforma' },
              { prefix: '', to: 0, suffix: ' min', label: 'tiempo de espera en retiro', sub: 'vs. 23 min promedio' },
              { prefix: '', to: 100, suffix: '%', label: 'transacciones verificadas en blockchain', sub: 'unickeys · Solana' },
              { prefix: '~', to: 1, suffix: '%', label: 'comisión total por transacción', sub: 'sin costos fijos' },
            ].map(({ prefix, to, suffix, label, sub }, i) => (
              <div key={label} className="nb-stats-item" style={{ padding: '0 40px', borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none', position: 'relative' }}>
                <div style={{ fontSize: 'clamp(40px, 3.5vw, 62px)', fontWeight: 900, color: '#0A0F00', letterSpacing: '-0.055em', lineHeight: '1', marginBottom: '12px' }}>
                  {to === 0 ? '0 min' : <CountUp to={to} prefix={prefix} suffix={suffix} duration={1800} />}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(10,15,0,0.65)', lineHeight: '1.5', fontWeight: 500, marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'rgba(10,15,0,0.4)', fontWeight: 500, letterSpacing: '0.02em' }}>{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="nb-faq-section" style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
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
                { q: '¿Nubapay reemplaza al personal de barra?', a: 'No. Nubapay no reemplaza al staff, lo ayuda a trabajar más ordenado. El sistema reduce la carga en caja, organiza los pedidos y permite que el equipo se enfoque en preparar y entregar más rápido.' },
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
                        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
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
            <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '28px' }}>Para organizadores</div>
            <h2 style={{ fontSize: 'clamp(54px, 6.5vw, 96px)', fontWeight: 500, letterSpacing: '-0.055em', lineHeight: '0.88', margin: '0 0 28px 0', color: '#FFFFFF', maxWidth: '700px' }}>
              Tu próximo<br />evento sin filas.
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', margin: '0 0 52px 0', maxWidth: '440px' }}>
              Registrate gratis, creá tu evento en minutos y empezá a vender. Sin costos fijos. Solo pagás cuando vendés.
            </p>
            <div className="nb-cta-buttons" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/register" className="nb-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C6FF00', color: '#0A0F00', padding: '18px 40px', borderRadius: '100px', textDecoration: 'none', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Crear mi evento gratis
                <ArrowRight color="#0A0F00" />
              </Link>
              <Link href="/login" className="nb-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', color: '#FFFFFF', padding: '18px 28px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="nb-footer" style={{ background: '#0A0A0F', padding: '72px 40px 0', overflow: 'hidden' }}>

          {/* Top grid */}
          <div className="nb-footer-top" style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '80px', paddingBottom: '64px' }}>

            {/* Left — brand + tagline + CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '40px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF' }}>nubapay</span>
                </div>
                <p style={{ fontSize: '15px', color: '#FFFFFF', lineHeight: '1.7', margin: '0 0 32px 0', maxWidth: '340px' }}>
                  Más ventas, menos filas. Para los que organizan eventos que la gente recuerda.
                </p>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C6FF00', color: '#0A0F00', padding: '12px 22px', borderRadius: '100px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Empezá ahora
                  <ArrowRight color="#0A0F00" />
                </Link>
              </div>
            </div>

            {/* Right — link columns */}
            <div className="nb-footer-links-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              {[
                {
                  title: 'Producto',
                  links: [
                    { label: 'Cómo funciona', href: '#como-funciona' },
                    { label: 'Atendium IA', href: '#' },
                    { label: 'Blockchain QR', href: '#' },
                    { label: 'Precios', href: '#' },
                    { label: 'Para organizadores', href: '/register' },
                  ],
                },
                {
                  title: 'Empresa',
                  links: [
                    { label: 'Sobre Nubapay', href: '/nosotros' },
                    { label: 'Blog', href: '#' },
                    { label: 'Contacto', href: '#' },
                    { label: 'Trabaja con nosotros', href: '#' },
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
              ].map(({ title, links }) => (
                <div key={title}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px 0' }}>{title}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {links.map(({ label, href }) => (
                      <a key={label} href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s', fontWeight: 400 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                      >{label}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Wordmark */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0px', marginBottom: '40px' }}>
              <div
                className="nb-footer-wordmark"
                style={{
                  fontSize: 'clamp(80px, 13.5vw, 196px)',
                  fontWeight: 900,
                  letterSpacing: '-0.055em',
                  lineHeight: '0.85',
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(255,255,255,0.1)',
                  userSelect: 'none',
                }}
              >
                nubapay
              </div>
              <svg
                className="nb-footer-verify"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: '8em', height: '8em', flexShrink: 0, marginTop: '40px', marginRight: '300px' }}
              >
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ padding: '20px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>© 2025 Nubapay · Argentina</span>
            </div>
          </div>

        </footer>

      </div>
    </>
  )
}

function ArrowRight({ color = '#0A0A0F' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function QRPattern() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
      <rect width="76" height="76" rx="10" fill="#EDEDEA" />
      <rect x="8" y="8" width="24" height="24" rx="3" fill="#000000" opacity="0.9" />
      <rect x="11" y="11" width="18" height="18" rx="2" fill="#EDEDEA" />
      <rect x="14" y="14" width="12" height="12" rx="1.5" fill="#000000" />
      <rect x="44" y="8" width="24" height="24" rx="3" fill="#000000" opacity="0.9" />
      <rect x="47" y="11" width="18" height="18" rx="2" fill="#EDEDEA" />
      <rect x="50" y="14" width="12" height="12" rx="1.5" fill="#000000" />
      <rect x="8" y="44" width="24" height="24" rx="3" fill="#000000" opacity="0.9" />
      <rect x="11" y="47" width="18" height="18" rx="2" fill="#EDEDEA" />
      <rect x="14" y="50" width="12" height="12" rx="1.5" fill="#000000" />
      <rect x="44" y="44" width="8" height="8" rx="1.5" fill="#000000" opacity="0.65" />
      <rect x="56" y="44" width="8" height="8" rx="1.5" fill="#000000" opacity="0.65" />
      <rect x="44" y="56" width="8" height="8" rx="1.5" fill="#000000" opacity="0.65" />
      <rect x="56" y="56" width="8" height="8" rx="1.5" fill="#000000" opacity="0.38" />
      <rect x="36" y="8" width="4" height="4" rx="1" fill="#000000" opacity="0.4" />
      <rect x="36" y="16" width="4" height="8" rx="1" fill="#000000" opacity="0.4" />
      <rect x="36" y="36" width="4" height="4" rx="1" fill="#000000" opacity="0.4" />
    </svg>
  )
}
