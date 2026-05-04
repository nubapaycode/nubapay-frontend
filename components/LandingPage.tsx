'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
    background: #C6FF00;
    color: #0A0F00;
    padding: 2px 14px 6px;
    border-radius: 10px;
    margin-left: -4px;
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
  .nb-btn-fill:hover::before {
    transform: translateX(0);
  }
  .nb-btn-fill:hover {
    color: #F5F5F0 !important;
    border-color: #0A0A0F !important;
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
  accentText: '#3D6B00',   // lime-family, readable on light bg
  orange: '#FF5C1A',
  muted: '#6A6A78',
  faint: '#9A9AA8',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [chatConfirmed, setChatConfirmed] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <style>{CSS}</style>

      {/* Grain — sutil paper texture */}
      <svg
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.055, pointerEvents: 'none', zIndex: 9999 }}
      >
        <filter id="nb-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#nb-grain)" />
      </svg>

      <div style={S.root}>

        {/* ─── NAV ─── */}
        <nav style={{
          position: 'fixed', top: '16px', left: '0', right: '0', zIndex: 100,
          padding: '0 40px',
          display: 'flex', justifyContent: 'center',
        }}>
        <div style={{
          width: '100%', maxWidth: '1280px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '56px', padding: '0 24px',
          background: scrolled ? 'rgba(245,245,240,0.92)' : 'rgba(245,245,240,0.75)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          border: `1px solid rgba(0,0,0,0.09)`,
          borderRadius: '100px',
          transition: 'background 0.35s, box-shadow 0.35s',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0A0A0F' }}>nubapay</span>
            <span style={{
              fontSize: '9px', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase',
              color: S.accentText, background: 'rgba(198,255,0,0.22)',
              padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(198,255,0,0.4)',
            }}>beta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/login" style={{ fontSize: '14px', fontWeight: 500, color: '#000000', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link href="/register" style={{
              fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em',
              background: '#C6FF00', color: '#0A0F00',
              padding: '9px 22px', borderRadius: '100px', textDecoration: 'none',
              marginRight: '-15px',
            }}>
              Empezar gratis
            </Link>
          </div>
        </div>
        </nav>

        {/* ─── HERO ─── */}
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '140px 40px 80px', position: 'relative', overflow: 'hidden' }}>
          {/* ambient blobs */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '65%', height: '70%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.28) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '50%', height: '55%', background: 'radial-gradient(ellipse, rgba(255,92,26,0.1) 0%, transparent 65%)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '54% 46%', gap: '60px', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>

            {/* Copy */}
            <div>
              <h1 style={{ fontSize: '116px', fontWeight: 900, lineHeight: '0.92', marginTop: '4px', letterSpacing: '-0.05em', margin: '0 0 16px 0' }}>
                <span className="nb-hw">PEDÍ.</span>
                <span className="nb-hw">PAGÁ.</span>
                <span className="nb-hw">RETIRÁ.</span>
              </h1>

              <p className="nb-sub" style={{ fontSize: '18px', fontWeight: 400, color: '#000000', lineHeight: '1.65', maxWidth: '560px', margin: '0 0 48px 0' }}>
                <span style={{ background: '#C6FF00', color: '#0A0F00', padding: '0 6px 2px', borderRadius: '5px' }}>Menú digital</span>, pagos móviles y <span style={{ background: '#C6FF00', color: '#0A0F00', padding: '0 6px 2px', borderRadius: '5px' }}>retiro con QR</span> para eventos y festivales. Cero filas. Cero caos.<br /><span style={{ background: '#C6FF00', color: '#0A0F00', padding: '0 8px 3px', borderRadius: '6px', display: 'inline-block', marginTop: '6px', fontWeight: 900, textTransform: 'uppercase' as const }}>Más ventas.</span>
              </p>

              <div className="nb-cta" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <Link href="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: '#C6FF00', color: '#0A0F00',
                  padding: '16px 32px', borderRadius: '100px',
                  textDecoration: 'none', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em',
                }}>
                  Crear mi evento
                  <ArrowRight color="#0A0F00" />
                </Link>
                <a href="#como-funciona" className="nb-btn-fill" style={{
                  display: 'inline-flex', alignItems: 'center',
                  color: S.muted, padding: '16px 24px', borderRadius: '100px',
                  border: `1px solid rgba(0,0,0,0.14)`, textDecoration: 'none',
                  fontSize: '15px', fontWeight: 500,
                }}>
                  Ver cómo funciona
                </a>
              </div>

              <div className="nb-stats" style={{ display: 'flex', gap: '48px', marginTop: '64px', paddingTop: '40px', borderTop: `1px solid rgba(0,0,0,0.1)` }}>
                {[
                  { n: '+10K', label: 'pedidos procesados' },
                  { n: '0 min', label: 'espera en retiro' },
                  { n: '~1%', label: 'comisión total' },
                ].map(({ n, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.045em', color: '#000000' }}>{n}</div>
                    <div style={{ fontSize: '12px', color: '#000000', marginTop: '4px', fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating UI cards */}
            <div style={{ position: 'relative', height: '580px' }}>

              {/* Main order card */}
              <div className="nb-float-a" style={{
                position: 'absolute', top: 'calc(50% - 300px)', left: 'calc(50% - 320px)',
                transform: 'translate(-50%, -50%)',
                width: '285px',
                background: S.surface, border: `1px solid rgba(0,0,0,0.09)`,
                borderRadius: '28px', padding: '28px',
                boxShadow: '0 40px 80px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: S.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mi pedido</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: S.accentText, background: 'rgba(198,255,0,0.22)', padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.03em' }}>
                    En preparación
                  </span>
                </div>
                {[
                  { name: 'Fernet con Coca ×2', price: '$16.000', ok: true },
                  { name: 'Cerveza Heineken', price: '$8.000', ok: true },
                  { name: 'Trago Aperol Spritz', price: '$14.000', ok: false },
                ].map(({ name, price, ok }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                        background: ok ? 'rgba(198,255,0,0.2)' : 'rgba(0,0,0,0.04)',
                        border: ok ? `1.5px solid #8CC800` : '1.5px solid rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {ok && <CheckMark />}
                      </div>
                      <span style={{ fontSize: '13px', color: ok ? S.muted : '#0A0A0F', fontWeight: 500 }}>{name}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: S.faint, fontWeight: 600 }}>{price}</span>
                  </div>
                ))}
                <div style={{
                  marginTop: '16px', background: 'rgba(198,255,0,0.18)',
                  border: '1px solid rgba(198,255,0,0.4)', borderRadius: '14px',
                  padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', color: S.muted }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: S.accentFg, letterSpacing: '-0.04em' }}>$38.000</span>
                </div>
              </div>

              {/* QR card */}
              <div className="nb-float-b" style={{
                position: 'absolute', bottom: '180px', right: '90px',
                width: '152px',
                background: S.surface, border: `1px solid rgba(0,0,0,0.09)`,
                borderRadius: '22px', padding: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
              }}>
                <div style={{ width: '76px', height: '76px', margin: '0 auto 14px' }}>
                  <QRPattern />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: S.accentText, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Pedido confirmado</div>
                  <div style={{ fontSize: '9px', color: S.faint, marginTop: '3px' }}>#0001</div>
                </div>
              </div>

              {/* Stat card */}
              <div className="nb-float-c" style={{
                position: 'absolute', top: '332px', left: '224px',
                background: S.accent, borderRadius: '22px', padding: '20px 22px',
                boxShadow: '0 20px 48px rgba(198,255,0,0.35)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(10,15,0,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tiempo de espera
                </div>
                <div style={{ fontSize: '38px', fontWeight: 900, color: S.accentFg, letterSpacing: '-0.055em', lineHeight: '1' }}>0 min</div>
                <div style={{ fontSize: '10px', color: 'rgba(10,15,0,0.42)', marginTop: '5px' }}>vs. 23 min promedio</div>
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
        <section id="como-funciona" style={{ padding: '120px 40px', maxWidth: '1280px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px' }}>
            <h2 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.92', margin: 0, color: '#0A0A0F' }}>
              Del escaneo<br />al retiro.
            </h2>
            <p style={{ maxWidth: '360px', color: '#000000', fontSize: '20px', lineHeight: '1.7', textAlign: 'right', marginBottom: '4px' }}>
              Escaneás, pedís, pagás y retirás.<br />Sin filas, sin caos, sin fricción.<br />El flujo más rápido del mercado.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              {
                n: '01', title: 'Escaneá el QR',
                desc: 'Entrás al menú digital del evento desde tu celular. Sin app. Sin cuenta.',
                icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="12" y="2" width="8" height="8" rx="1.5" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="2" y="12" width="8" height="8" rx="1.5" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="14" y="14" width="2" height="2" fill="#0A0A0F"/><rect x="18" y="14" width="2" height="2" fill="#0A0A0F"/><rect x="14" y="18" width="2" height="2" fill="#0A0A0F"/><rect x="18" y="18" width="2" height="2" fill="#0A0A0F"/></svg>,
                highlight: false,
              },
              {
                n: '02', title: 'Elegí y pedí',
                desc: 'Navegás el catálogo, agregás al carrito y confirmás el pedido en segundos.',
                icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 3h2l2.5 10h9l2-7H7" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="19" r="1.5" fill="#0A0A0F"/><circle cx="17" cy="19" r="1.5" fill="#0A0A0F"/></svg>,
                highlight: false,
              },
              {
                n: '03', title: 'Pagá online',
                desc: 'MercadoPago, transferencia o efectivo. 100% desde el celular, sin billetera.',
                icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="18" height="13" rx="2.5" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M2 9h18" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="5" y="13" width="4" height="2" rx="1" fill="#0A0A0F"/></svg>,
                highlight: false,
              },
              {
                n: '04', title: 'Retirá sin fila',
                desc: 'Mostrás el QR certificado en blockchain y te van el pedido listo en el acto.',
                icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11l5 5 9-9" stroke="#0A0F00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                highlight: true,
              },
            ].map(({ n, title, desc, icon, highlight }, i) => (
              <div key={n} style={{
                background: highlight ? '#C6FF00' : '#FAFAFA',
                border: highlight ? 'none' : '1px solid rgba(0,0,0,0.07)',
                borderRadius: '20px',
                padding: '32px 28px 36px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
              }}>
                {/* Step number + icon row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 800,
                    color: highlight ? 'rgba(10,15,0,0.4)' : '#C8C8D0',
                    letterSpacing: '0.1em',
                  }}>{n}</span>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: highlight ? 'rgba(10,15,0,0.1)' : '#F0F0F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                </div>

                <h3 style={{
                  fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em',
                  margin: '0 0 10px 0',
                  color: highlight ? '#0A0F00' : '#0A0A0F',
                }}>
                  {title}
                </h3>
                <p style={{
                  fontSize: '13px', lineHeight: '1.7', margin: 0,
                  color: highlight ? 'rgba(10,15,0,0.58)' : '#9A9AA8',
                }}>
                  {desc}
                </p>

                {/* Connector arrow (all except last) */}
                {i < 3 && (
                  <div style={{
                    position: 'absolute', right: '-20px', top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    width: '28px', height: '28px',
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M5.5 2.5l3 2.5-3 2.5" stroke="#C8C8D0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── ATENDIUM ─── */}
        <section style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '36px', border: '1px solid rgba(0,0,0,0.08)',
            padding: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px',
            alignItems: 'center', overflow: 'hidden', position: 'relative',
          }}>
            {/* ambient glow */}
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
                  {
                    svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1L2 9h6l-1 6 7-8H8l1-6z" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                    text: 'Responde consultas al instante',
                  },
                  {
                    svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="#FF5C1A" strokeWidth="1.5"/><circle cx="8" cy="8" r="6" stroke="#FF5C1A" strokeWidth="1.5" strokeDasharray="2 2"/><path d="M13.5 2.5l-3.2 3.2M2.5 13.5l3.2-3.2" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round"/></svg>,
                    text: 'Sugiere combos con upselling inteligente',
                  },
                  {
                    svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.2 2 3 4.2 3 7c0 1.8 1 3.4 2.4 4.3V13h5v-1.7C11.9 10.4 13 8.8 13 7c0-2.8-2.2-5-5-5z" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13h4M8 2v1" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round"/></svg>,
                    text: 'Entiende el menú y el contexto del evento',
                  },
                  {
                    svg: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l4-4 3 3 5-7" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 5h3v3" stroke="#FF5C1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                    text: 'Escala sin contratar más staff',
                  },
                ] as { svg: React.ReactNode; text: string }[]).map(({ svg, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: 'rgba(255,92,26,0.08)', border: '1px solid rgba(255,92,26,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {svg}
                    </div>
                    <span style={{ fontSize: '14px', color: S.muted, fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat UI */}
            <div style={{ background: '#F7F7F5', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.08)', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
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

              {/* Messages */}
              <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '8px', height: '380px', overflow: 'hidden', justifyContent: 'flex-end' }}>
                {/* typing indicator 1 */}
                <div className="nb-typing-bubble nb-typing-1 nb-typing-fade-1" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>

                {/* msg 0 — ai */}
                <div className="nb-msg nb-msg-0" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                    Vi que pediste la Heineken. ¿Te suma un Fernet con Coca? Van perfectas juntas.
                  </div>
                </div>

                {/* msg 1 — user */}
                <div className="nb-msg nb-msg-1" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: 'rgba(255,92,26,0.1)', border: '1px solid rgba(255,92,26,0.22)', borderRadius: '16px 4px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#0A0A0F' }}>
                    Dale, agregá uno.
                  </div>
                </div>

                {/* typing indicator 2 */}
                <div className="nb-typing-bubble nb-typing-2 nb-typing-fade-2" style={{ display: 'flex', justifyContent: 'flex-start', maxHeight: '6px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>

                {/* msg 2 — ai */}
                <div className="nb-msg nb-msg-2" style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-8px' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                    ¡Listo! También tengo el Combo Tragos (Heineken + Fernet) con 20% off.
                  </div>
                </div>

                {/* msg 3 — user */}
                <div className="nb-msg nb-msg-3" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: 'rgba(255,92,26,0.1)', border: '1px solid rgba(255,92,26,0.22)', borderRadius: '16px 4px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#0A0A0F' }}>
                    ¿Cuánto sale?
                  </div>
                </div>

                {/* typing indicator 3 */}
                <div className="nb-typing-bubble nb-typing-3 nb-typing-fade-3" style={{ display: 'flex', justifyContent: 'flex-start', maxHeight: '6px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} /><span className="nb-typing-dot" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>

                {/* msg 4 — ai */}
                <div className="nb-msg nb-msg-4" style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-8px' }}>
                  <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                    $19.200 en lugar de $24.000. ¿Lo sumamos al pedido?
                  </div>
                </div>
              </div>

              {/* Extra messages after button click */}
              {chatConfirmed && (
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
                    <div style={{ maxWidth: '82%', padding: '10px 14px', background: 'rgba(255,92,26,0.1)', border: '1px solid rgba(255,92,26,0.22)', borderRadius: '16px 4px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#0A0A0F' }}>
                      Sí, sumalo al pedido.
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.7s both' }}>
                    <div style={{ maxWidth: '82%', padding: '10px 14px', background: '#EAEAE5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '4px 16px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#3A3A48' }}>
                      ¡Listo! Combo Tragos agregado. Tu total es <strong>$43.200</strong>. ¿Confirmamos el pedido?
                    </div>
                  </div>
                </div>
              )}

              {/* CTA button inside chat */}
              <div style={{ padding: '12px 20px 20px' }}>
                {chatConfirmed ? (
                  <div style={{ display: 'flex', gap: '8px', animation: 'nb-msg-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.9s both' }}>
                    <div style={{ flex: 1, background: 'linear-gradient(135deg, #FF5C1A 0%, #FF7A3D 100%)', borderRadius: '14px', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Confirmar pedido</span>
                    </div>
                    <div onClick={() => setChatConfirmed(false)} style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '14px', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="#6A6A78" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setChatConfirmed(true)} style={{
                    background: 'linear-gradient(135deg, #FF5C1A 0%, #FF7A3D 100%)',
                    borderRadius: '14px', padding: '13px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Sí, sumalo al pedido</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── BLOCKCHAIN ─── */}
        <section style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            background: '#0A0A0F', borderRadius: '36px', overflow: 'hidden', position: 'relative',
            display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch',
          }}>
            {/* glow */}
            <div style={{ position: 'absolute', top: '-20%', left: '20%', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

            {/* Left — copy */}
            <div style={{ padding: '80px', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
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
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — certification flow */}
            <div style={{ padding: '80px 64px', position: 'relative' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '36px' }}>
                Proceso de certificación
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { step: 'Pedido confirmado', detail: 'ORDER_ID: 9f2e1a…c4b', done: true },
                  { step: 'Hash SHA-256', detail: '3d8f2c…b4e6f7', done: true },
                  { step: 'Merkle Tree', detail: 'Root: a1b2c3d4…', done: true },
                  { step: 'Registro en Solana', detail: 'TX: 4zMf8…Ve9p', done: true },
                  { step: 'QR emitido', detail: 'Verificable públicamente', done: true },
                ].map(({ step, detail, done }, i, arr) => (
                  <div key={step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {/* timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                        background: done ? 'rgba(198,255,0,0.15)' : 'rgba(255,255,255,0.05)',
                        border: done ? '1.5px solid rgba(198,255,0,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done
                          ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                        }
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ width: '1px', height: '36px', background: 'rgba(198,255,0,0.15)', marginTop: '4px' }} />
                      )}
                    </div>
                    {/* content */}
                    <div style={{ paddingBottom: i < arr.length - 1 ? '12px' : '0', paddingTop: '2px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '3px' }}>{step}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* verified badge */}
              <div style={{ marginTop: '40px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', borderRadius: '100px', padding: '10px 18px' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 2.5 3 .5-2 2 .5 3L7 8l-3 1 .5-3-2-2 3-.5z" stroke="#C6FF00" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: '12px', fontWeight: 700, color: S.accentText, letterSpacing: '0.04em' }}>Verificado en Solana Mainnet</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS BAND ─── */}
        <section style={{ padding: '0 40px 120px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            background: '#C6FF00', borderRadius: '32px', padding: '64px 72px',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            position: 'relative', overflow: 'hidden',
          }}>
            {[
              { n: '+40%', label: 'aumento en ventas promedio por evento', sub: 'vs. sin plataforma' },
              { n: '0 min', label: 'tiempo de espera en retiro', sub: 'vs. 23 min promedio' },
              { n: '100%', label: 'transacciones verificadas en blockchain', sub: 'unickeys · Solana' },
              { n: '~1%', label: 'comisión total por transacción', sub: 'sin costos fijos' },
            ].map(({ n, label, sub }, i) => (
              <div key={label} style={{
                padding: '0 40px',
                borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                position: 'relative',
              }}>
                <div style={{
                  fontSize: 'clamp(40px, 3.5vw, 62px)', fontWeight: 900,
                  color: '#0A0F00', letterSpacing: '-0.055em', lineHeight: '1',
                  marginBottom: '12px',
                }}>
                  {n}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(10,15,0,0.65)', lineHeight: '1.5', fontWeight: 500, marginBottom: '6px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(10,15,0,0.4)', fontWeight: 500, letterSpacing: '0.02em' }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section style={{ padding: '0 40px 160px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            background: '#0A0A0F', borderRadius: '36px', padding: '100px 80px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '28px' }}>
              Para organizadores
            </div>

            <h2 style={{ fontSize: 'clamp(54px, 6.5vw, 96px)', fontWeight: 500, letterSpacing: '-0.055em', lineHeight: '0.88', margin: '0 0 28px 0', color: '#FFFFFF', maxWidth: '700px' }}>
              Tu próximo<br />evento sin filas.
            </h2>

            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', margin: '0 0 52px 0', maxWidth: '440px' }}>
              Registrate gratis, creá tu evento en minutos y empezá a vender. Sin costos fijos. Solo pagás cuando vendés.
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#C6FF00', color: '#0A0F00',
                padding: '18px 40px', borderRadius: '100px',
                textDecoration: 'none', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em',
              }}>
                Crear mi evento gratis
                <ArrowRight color="#0A0F00" />
              </Link>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center',
                color: '#FFFFFF', padding: '18px 28px', borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
                fontSize: '15px', fontWeight: 500,
              }}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ borderTop: `1px solid rgba(0,0,0,0.08)`, padding: '44px 40px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0A0A0F' }}>nubapay</span>
              <span style={{ fontSize: '12px', color: '#C8C8D0' }}>© 2025</span>
            </div>
            <div style={{ display: 'flex', gap: '28px' }}>
              {['Términos', 'Privacidad', 'Contacto'].map(l => (
                <a key={l} href="#" style={{ fontSize: '13px', color: S.faint, textDecoration: 'none' }}>{l}</a>
              ))}
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
