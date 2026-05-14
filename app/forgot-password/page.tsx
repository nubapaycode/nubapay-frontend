'use client'

import Link from 'next/link'
import { useState } from 'react'

import { authPaths } from '@/lib/api'
import { browserFetch } from '@/lib/browserFetch'

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  padding: '13px 16px',
  fontSize: '14px',
  color: '#0A0A0F',
  background: '#FAFAFA',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await browserFetch(authPaths.forgotPassword(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const body = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && body.ok) {
        setSent(true)
      } else {
        setError(body.error ?? 'No se pudo enviar el email')
      }
    } catch {
      setError('No se pudo contactar al servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 20px',
        background: '#FFFFFF',
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/login" style={{ fontSize: '13px', color: '#9A9AA8', textDecoration: 'none' }}>
            ← Volver al inicio de sesión
          </Link>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.04em', color: '#0A0A0F', margin: '0 0 8px 0' }}>
          Recuperar contraseña
        </h1>
        <p style={{ fontSize: '14px', color: '#9A9AA8', margin: '0 0 32px 0' }}>
          Ingresá tu email y te enviamos un link para restablecer tu contraseña.
        </p>

        {sent ? (
          <div
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '12px',
              padding: '16px 18px',
              fontSize: '14px',
              color: '#166534',
              lineHeight: '1.5',
            }}
          >
            <strong>Revisá tu email.</strong> Si hay una cuenta asociada a <strong>{email}</strong>, te enviamos las instrucciones para restablecer la contraseña.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Email"
              autoComplete="email"
              required
              disabled={loading}
              style={{
                ...inputStyle,
                borderColor: focused ? '#0A0A0F' : 'rgba(0,0,0,0.1)',
                boxShadow: focused ? '0 0 0 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                borderRadius: '100px',
                background: '#0A0A0F',
                color: '#C6FF00',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                letterSpacing: '-0.01em',
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Enviando…' : 'Enviar instrucciones'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
