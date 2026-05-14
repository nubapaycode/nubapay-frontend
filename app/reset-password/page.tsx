'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

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

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  const inp = (id: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === id ? '#0A0A0F' : 'rgba(0,0,0,0.1)',
    boxShadow: focused === id ? '0 0 0 3px rgba(0,0,0,0.06)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#DC2626', marginBottom: '16px' }}>
          El link de recuperación no es válido o expiró.
        </p>
        <Link href="/forgot-password" style={{ fontSize: '14px', color: '#0A0A0F', fontWeight: 600 }}>
          Solicitá uno nuevo
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const res = await browserFetch(authPaths.resetPassword(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const body = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && body.ok) {
        setDone(true)
      } else {
        setError(body.error ?? 'No se pudo restablecer la contraseña')
      }
    } catch {
      setError('No se pudo contactar al servidor')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '12px',
            padding: '16px 18px',
            fontSize: '14px',
            color: '#166534',
            lineHeight: '1.5',
            marginBottom: '24px',
          }}
        >
          <strong>¡Contraseña actualizada!</strong> Ya podés iniciar sesión con tu nueva contraseña.
        </div>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            borderRadius: '100px',
            background: '#0A0A0F',
            color: '#C6FF00',
            padding: '13px 32px',
            fontSize: '15px',
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          Ir al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="password"
        value={password}
        onChange={e => { setPassword(e.target.value); setError('') }}
        onFocus={() => setFocused('password')}
        onBlur={() => setFocused(null)}
        placeholder="Nueva contraseña (mín. 8 caracteres)"
        autoComplete="new-password"
        required
        disabled={loading}
        style={inp('password')}
      />
      <input
        type="password"
        value={confirm}
        onChange={e => { setConfirm(e.target.value); setError('') }}
        onFocus={() => setFocused('confirm')}
        onBlur={() => setFocused(null)}
        placeholder="Repetir contraseña"
        autoComplete="new-password"
        required
        disabled={loading}
        style={inp('confirm')}
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
        {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
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
          Nueva contraseña
        </h1>
        <p style={{ fontSize: '14px', color: '#9A9AA8', margin: '0 0 32px 0' }}>
          Elegí una contraseña nueva para tu cuenta.
        </p>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
