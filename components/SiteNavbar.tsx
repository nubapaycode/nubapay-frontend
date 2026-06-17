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

function CtaArrow() {
  return (
    <span className="snb-cta-arrow">
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#C6FF00" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function SiteNavbar({ activePath }: { activePath?: string }) {
  const [scrolled, setScrolled]         = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [loggedIn, setLoggedIn]         = useState<boolean | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [reduceMotion, setReduceMotion]   = useState(false)

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

  // Respeta prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Scroll-spy: marca activo el link de la sección visible (solo anclas del landing)
  useEffect(() => {
    const ids = navLinks.filter(l => l.href.includes('#')).map(l => l.href.split('#')[1])
    const sections = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (sections.length === 0) return
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  // Cierra el menú mobile con Escape y bloquea el scroll del fondo
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  // Combina ruta explícita + sección visible (scroll-spy) para resaltar el link
  const isLinkActive = (href: string) => {
    if (activePath === href) return true
    if (href.includes('#') && activeSection) return href.endsWith(`#${activeSection}`)
    return false
  }

  return (
    <>
      <style>{`
        .snb-section-link {
          position: relative;
          font-size: 14px; font-weight: 400; color: rgba(0,0,0,0.6);
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color 0.15s; white-space: nowrap;
        }
        .snb-section-link::after {
          content: ''; position: absolute; left: 12px; right: 12px; bottom: 2px;
          height: 2px; background: #C6FF00; border-radius: 2px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .snb-section-link:hover { color: rgba(0,0,0,1); }
        .snb-section-link:hover::after,
        .snb-section-link-active::after { transform: scaleX(1); }
        .snb-section-link-active { color: rgba(0,0,0,0.9) !important; font-weight: 500 !important; }
        .snb-login {
          font-size: 13px; font-weight: 400; color: rgba(0,0,0,0.5);
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color 0.15s; white-space: nowrap;
        }
        .snb-login:hover { color: rgba(0,0,0,1); }

        /* Foco visible por teclado */
        .snb-section-link:focus-visible,
        .snb-login:focus-visible,
        .snb-cta:focus-visible,
        .snb-logo:focus-visible,
        .snb-burger:focus-visible {
          outline: 2px solid #0A0A0F; outline-offset: 3px;
        }

        /* Respeta prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .snb-logo, .snb-links, .snb-desktop-cta, .snb-cta,
          .snb-cta-arrow, .snb-section-link, .snb-section-link::after {
            transition: none !important;
          }
          .snb-menu-panel { animation: none !important; }
        }

        /* Logo hover */
        .snb-logo { transition: opacity 0.15s, transform 0.55s cubic-bezier(0.16,1,0.3,1); transform-origin: left center; }
        .snb-logo:hover { opacity: 0.7; }

        /* CTA unificado con el del hero */
        .snb-cta {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 400; letter-spacing: -0.01em;
          background: #C6FF00; color: #0A0F00;
          height: 40px; box-sizing: border-box; padding: 0 6px 0 18px;
          border-radius: 100px; text-decoration: none; white-space: nowrap;
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1), background 0.35s ease;
        }
        .snb-cta:hover {
          transform: scale(1.02);
          background: #D4FF3D;
          box-shadow: 0 8px 20px -10px rgba(198,255,0,0.3);
        }
        .snb-cta-arrow {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 100px; background: #0A0F00;
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .snb-cta:hover .snb-cta-arrow { transform: translateX(5px); }

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
          id="snb-mobile-menu"
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
              const isActive = isLinkActive(link.href)
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={isActive ? 'page' : undefined}
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
                style={{ display: 'block', textAlign: 'center', fontSize: '16px', fontWeight: 400, background: '#C6FF00', color: '#0A0F00', padding: '16px', borderRadius: '100px', textDecoration: 'none' }}
              >
                Ver Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  style={{ display: 'block', textAlign: 'center', fontSize: '16px', fontWeight: 400, background: '#C6FF00', color: '#0A0F00', padding: '16px', borderRadius: '100px', textDecoration: 'none' }}
                >
                  Crear evento
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
            height: scrolled ? '52px' : '56px', padding: '0 14px 0 24px',
            background: scrolled ? 'rgba(245,245,240,0.92)' : 'rgba(245,245,240,0.75)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: scrolled ? '1px solid rgba(0,0,0,0.14)' : '1px solid rgba(0,0,0,0.09)',
            borderRadius: '100px',
            transition: reduceMotion ? 'none' : 'height 0.55s cubic-bezier(0.16,1,0.3,1), background 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s cubic-bezier(0.16,1,0.3,1), border-color 0.55s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0.05)',
          }}>

            {/* Logo */}
            <Link href="/" onClick={closeMenu} className="snb-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0, transform: scrolled ? 'scale(0.93)' : 'scale(1)' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: '#0A0A0F' }}>nubapay</span>
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>beta</span>
            </Link>

            {/* Links — solo desktop */}
            <div className="snb-links" style={{ alignItems: 'center', gap: '2px', transform: scrolled ? 'scale(0.93)' : 'scale(1)', transition: reduceMotion ? 'none' : 'transform 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
              {navLinks.map(link => {
                const isActive = isLinkActive(link.href)
                return (
                  <a key={link.label} href={link.href} aria-current={isActive ? 'page' : undefined} className={`snb-section-link${isActive ? ' snb-section-link-active' : ''}`}>
                    {link.label}
                  </a>
                )
              })}
            </div>

            {/* CTA — solo desktop */}
            <div className="snb-desktop-cta" style={{ alignItems: 'center', gap: '12px', flexShrink: 0, transform: scrolled ? 'scale(0.93)' : 'scale(1)', transformOrigin: 'right center', transition: reduceMotion ? 'none' : 'transform 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
              {loggedIn === null ? null : loggedIn ? (
                <Link href="/dashboard" className="snb-cta">
                  Ver Dashboard
                  <CtaArrow />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="snb-login">Iniciar sesión</Link>
                  <Link href="/register" className="snb-cta">
                    Crear evento
                    <CtaArrow />
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
              aria-expanded={menuOpen}
              aria-controls="snb-mobile-menu"
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
