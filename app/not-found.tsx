import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Página no encontrada',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div style={{
      fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFFFFF',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 800,
        color: '#C8C8D0',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '24px',
      }}>
        Error 404
      </div>

      <h1 style={{
        fontSize: 'clamp(72px, 16vw, 120px)',
        fontWeight: 900,
        letterSpacing: '-0.055em',
        lineHeight: '0.9',
        color: '#0A0A0F',
        margin: '0 0 28px 0',
      }}>
        ¿Perdiste<br />el QR?
      </h1>

      <p style={{
        fontSize: '18px',
        color: '#6A6A78',
        lineHeight: '1.7',
        margin: '0 0 48px 0',
        maxWidth: '380px',
      }}>
        Esta página no existe o fue movida. Volvé al inicio y seguí explorando.
      </p>

      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#C6FF00',
          color: '#0A0F00',
          padding: '16px 32px',
          borderRadius: '100px',
          textDecoration: 'none',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        Volver al inicio
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="#0A0F00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
