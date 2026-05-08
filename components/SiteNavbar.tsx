'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getAuthToken } from '@/lib/authSession'

const navLinks = [
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Atendium', href: '/#atendium' },
  { label: 'QR antifraude', href: '/#qr-antifraude' },
  { label: 'Nosotros', href: '/nosotros' },
]

export default function SiteNavbar({ activePath }: { activePath?: string }) {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [loggedIn, setLoggedIn]   = useState<boolean | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sync = () => setLoggedIn(!!getAuthToken())
    sync()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'nubapay_token' || e.key === null) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('nubapay-auth-change', sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('nubapay-auth-change', sync)
    }
  }, [])

  // Cierra el menú al hacer scroll
  useEffect(() => {
    if (menuOpen) setMenuOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrolled])

  const closeMenu = () => setMenuOpen(false)

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
        .snb-login {
          font-size: 13px; font-weight: 400; color: rgba(0,0,0,0.5);
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color 0.15s; white-space: nowrap;
        }
        .snb-login:hover { color: rgba(0,0,0,1); }

        /* Desktop: muestra links, oculta hamburguesa */
        .snb-links  { display: flex; }
        .snb-burger { display: none; }
        .snb-desktop-cta { display: flex; }

        @media (max-width: 767px) {
          .snb-links       { display: none !important; }
          .snb-burger      { display: flex !important; }
          .snb-desktop-cta { display: none !important; }
        }

        @keyframes snb-menu-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .snb-menu-panel {
          animation: snb-menu-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>

      <div style={{ height: '72px' }} />

      {/* Panel fullscreen mobile */}
      {menuOpen && (
        <div
          className="snb-menu-panel"
          style={{
            position: 'fixed', inset: 0, zIndex: 98,
            background: 'rgba(245,245,240,0.97)',
            backdropFilter: 'blur(32px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
            display: 'flex', flexDirection: 'column',
            padding: '100px 32px 48px',
          }}
        >
          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {navLinks.map(link => {
              const isActive = activePath === link.href
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: isActive ? '#0A0A0F' : 'rgba(0,0,0,0.35)',
                    textDecoration: 'none',
                    padding: '12px 0',
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0F' }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive ? '#0A0A0F' : 'rgba(0,0,0,0.35)' }}
                >
                  {link.label}
                </a>
              )
            })}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loggedIn === null ? null : loggedIn ? (
              <Link
                href="/dashboard"
                onClick={closeMenu}
                style={{ display: 'block', textAlign: 'center', fontSize: '16px', fontWeight: 700, background: '#C6FF00', color: '#0A0F00', padding: '16px', borderRadius: '100px', textDecoration: 'none' }}
              >
                Ver Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  style={{ display: 'block', textAlign: 'center', fontSize: '16px', fontWeight: 700, background: '#C6FF00', color: '#0A0F00', padding: '16px', borderRadius: '100px', textDecoration: 'none' }}
                >
                  Empezar gratis
                </Link>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  style={{ display: 'block', textAlign: 'center', fontSize: '15px', fontWeight: 400, color: 'rgba(0,0,0,0.5)', padding: '14px', borderRadius: '100px', textDecoration: 'none', border: '1px solid rgba(0,0,0,0.1)' }}
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <nav style={{ position: 'fixed', top: '16px', left: 0, right: 0, zIndex: 100, padding: '0 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1280px' }}>

          {/* Pill principal */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '56px', padding: '0 24px',
            background: scrolled ? 'rgba(245,245,240,0.92)' : 'rgba(245,245,240,0.75)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: '100px',
            transition: 'background 0.35s, box-shadow 0.35s, border-radius 0.2s',
            boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0.05)',
          }}>

            {/* Logo */}
            <Link href="/" onClick={closeMenu} style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0A0A0F' }}>nubapay</span>
              <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#5A8A00', background: 'rgba(198,255,0,0.22)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(198,255,0,0.4)' }}>beta</span>
            </Link>

            {/* Links — solo desktop */}
            <div className="snb-links" style={{ alignItems: 'center', gap: '2px' }}>
              {navLinks.map(link => {
                const isActive = activePath === link.href || (activePath && link.href.startsWith('/') && !link.href.includes('#') && activePath === link.href)
                return (
                  <a key={link.label} href={link.href} className={`snb-section-link${isActive ? ' snb-section-link-active' : ''}`}>
                    {link.label}
                  </a>
                )
              })}
            </div>

            {/* CTA — solo desktop */}
            <div className="snb-desktop-cta" style={{ alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {loggedIn === null ? null : loggedIn ? (
                <Link href="/dashboard" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', background: '#C6FF00', color: '#0A0F00', padding: '9px 22px', borderRadius: '100px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Ver Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="snb-login">Iniciar sesión</Link>
                  <Link href="/register" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', background: '#C6FF00', color: '#0A0F00', padding: '9px 22px', borderRadius: '100px', textDecoration: 'none' }}>
                    Empezar gratis
                  </Link>
                </>
              )}
            </div>

            {/* Hamburguesa — solo mobile */}
            <button
              type="button"
              className="snb-burger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              style={{ alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
            >
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4l16 16M20 4L4 20" stroke="#0A0A0F" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="#0A0A0F" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>


        </div>
      </nav>
    </>
  )
}
