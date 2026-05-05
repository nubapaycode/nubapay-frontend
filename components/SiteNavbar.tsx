'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const navLinks = [
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Atendium', href: '/#atendium' },
  { label: 'QR antifraude', href: '/#qr-antifraude' },
  { label: 'Nosotros', href: '/nosotros' },
]

export default function SiteNavbar({ activePath }: { activePath?: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        .snb-section-link {
          font-size: 14px; font-weight: 400; color: rgba(0,0,0,0.5);
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color 0.15s, background 0.15s; white-space: nowrap;
        }
        .snb-section-link:hover { color: rgba(0,0,0,1); background: rgba(0,0,0,0.04); }
        .snb-section-link-active { color: rgba(0,0,0,0.9) !important; font-weight: 500 !important; }
        .snb-login { font-size: 13px; font-weight: 400; color: rgba(0,0,0,0.5); text-decoration: none; padding: 6px 12px; border-radius: 8px; transition: color 0.15s; white-space: nowrap; }
        .snb-login:hover { color: rgba(0,0,0,1); }
      `}</style>

      <div style={{ height: '72px' }} />

      <nav style={{ position: 'fixed', top: '16px', left: 0, right: 0, zIndex: 100, padding: '0 40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: '1280px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '56px', padding: '0 24px',
          background: scrolled ? 'rgba(245,245,240,0.92)' : 'rgba(245,245,240,0.75)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          border: '1px solid rgba(0,0,0,0.09)',
          borderRadius: '100px',
          transition: 'background 0.35s, box-shadow 0.35s',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0.05)',
        }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0A0A0F' }}>nubapay</span>
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase' as const, color: '#5A8A00', background: 'rgba(198,255,0,0.22)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(198,255,0,0.4)' }}>beta</span>
          </Link>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {navLinks.map(link => {
              const isActive = activePath === link.href || (activePath && link.href.startsWith('/') && !link.href.includes('#') && activePath === link.href)
              return (
                <a key={link.label} href={link.href} className={`snb-section-link${isActive ? ' snb-section-link-active' : ''}`}>
                  {link.label}
                </a>
              )
            })}
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Link href="/login" className="snb-login">Iniciar sesión</Link>
            <Link href="/register" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', background: '#C6FF00', color: '#0A0F00', padding: '9px 22px', borderRadius: '100px', textDecoration: 'none' }}>
              Empezar gratis
            </Link>
          </div>

        </div>
      </nav>
    </>
  )
}
