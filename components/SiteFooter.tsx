'use client'

import Link from 'next/link'

const CSS = `
  .nb-footer { padding: 72px 40px 0; }
  .nb-footer-top { display: grid; grid-template-columns: 1.2fr 2fr; gap: 80px; }
  .nb-footer-links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }

  /* CTA primario: mismo comportamiento que los botones de la landing */
  .nb-footer-cta {
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1), background 0.35s ease;
  }
  .nb-footer-cta:hover {
    transform: scale(1.02);
    background: #D4FF3D;
    box-shadow: 0 8px 20px -10px rgba(198,255,0,0.3);
  }
  .nb-footer-cta-arrow { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
  .nb-footer-cta:hover .nb-footer-cta-arrow { transform: translateX(6px); }
  @media (prefers-reduced-motion: reduce) {
    .nb-footer-cta:hover, .nb-footer-cta:hover .nb-footer-cta-arrow { transform: none; }
  }

  @media (max-width: 900px) {
    .nb-footer-top { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
    .nb-footer-links-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
  }
  @media (max-width: 640px) {
    .nb-footer { padding: 40px 20px 24px !important; }
    .nb-footer-top { grid-template-columns: 1fr !important; gap: 40px !important; }
    .nb-footer-links-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
    .nb-footer-wordmark { font-size: clamp(56px, 18vw, 180px) !important; }
    .nb-footer-verify { display: none !important; }
  }
`

const NAV = [
  {
    title: 'Producto',
    links: [
      { label: 'Cómo funciona', href: '/#como-funciona' },
      { label: 'QR antifraude', href: '/#qr-antifraude' },
      { label: 'Tipos de evento', href: '/#eventos' },
      { label: 'Preguntas frecuentes', href: '/#faq' },
      { label: 'Para organizadores', href: '/register' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre Nubapay', href: '/nosotros' },
      { label: 'Contacto', href: '/nosotros#equipo' },
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

export default function SiteFooter() {
  return (
    <>
      <style>{CSS}</style>
      <footer className="nb-footer" style={{ background: '#0A0A0F', overflow: 'hidden' }}>

        <div className="nb-footer-top" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '64px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF' }}>nubapay</span>
              </div>
              <p style={{ fontSize: '15px', color: '#FFFFFF', lineHeight: '1.7', margin: '0 0 32px 0', maxWidth: '340px' }}>
                Más ventas, menos filas. Para los que organizan eventos que la gente recuerda.
              </p>
              <Link href="/register" className="nb-footer-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '58px', boxSizing: 'border-box', background: '#C6FF00', color: '#0A0F00', padding: '0 8px 0 32px', borderRadius: '100px', textDecoration: 'none', fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em' }}>
                Empezá ahora
                <span className="nb-footer-cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '100px', background: '#0A0F00' }}>
                  <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#C6FF00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          <div className="nb-footer-links-grid">
            {NAV.map(({ title, links }) => (
              <div key={title}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 20px 0' }}>{title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {links.map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s', fontWeight: 400 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Wordmark */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
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
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ padding: '20px 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>© 2026 Nubapay · Argentina</span>
            <a
              href="https://www.instagram.com/nubapay.app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Nubapay (@nubapay.app)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
              </svg>
              @nubapay.app
            </a>
          </div>
        </div>

      </footer>
    </>
  )
}
