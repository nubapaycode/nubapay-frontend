'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { authPaths, eventsPaths } from '@/lib/api'
import { authHeadersJson, type AuthUser, getAuthToken, setAuthSession } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { FetchError } from '@/lib/fetcher'

type Mode = 'login' | 'register'

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  padding: '13px 16px',
  fontSize: '14px',
  color: '#0A0A0F',
  background: '#FAFAFA',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

export function LoginView({ initialMode = 'login' }: { initialMode?: Mode }) {
  const router = useRouter()
  const [mode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  useEffect(() => {
    if (!getAuthToken()) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await browserFetch(eventsPaths.list({ page: 1, page_size: 1 }), {
          headers: authHeadersJson(),
        })
        const body = (await res.json()) as { events?: { id: string }[] }
        const firstId = body.events?.[0]?.id
        if (!cancelled && firstId) {
          router.replace(`/events/${firstId}/all`)
          return
        }
      } catch {}
      if (!cancelled) router.replace('/events')
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const finishAuth = async (token: string, user: AuthUser) => {
    setAuthSession(token, user)
    try {
      const res = await browserFetch(eventsPaths.list({ page: 1, page_size: 1 }), {
        headers: authHeadersJson(),
      })
      const body = (await res.json()) as { events?: { id: string }[] }
      const firstId = body.events?.[0]?.id
      if (firstId) {
        router.push(`/events/${firstId}/all`)
        return
      }
    } catch {}
    router.push('/events')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await browserFetch(authPaths.login(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = (await res.json()) as {
        token?: string
        user?: AuthUser
        staff_memberships?: AuthUser['staff_memberships']
        error?: string
      }
      if (res.ok && body.token && body.user) {
        finishAuth(body.token, { ...body.user, staff_memberships: body.staff_memberships })
        return
      }
      setError(body.error ?? 'Credenciales incorrectas')
    } catch (err) {
      setError(err instanceof FetchError ? err.message : 'No se pudo contactar al servidor')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) { setError('Ingresá tu nombre (mínimo 2 caracteres)'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    try {
      const res = await browserFetch(authPaths.register(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      })
      const body = (await res.json()) as {
        token?: string
        user?: AuthUser
        staff_memberships?: AuthUser['staff_memberships']
        error?: string
      }
      if (res.ok && body.token && body.user) {
        finishAuth(body.token, { ...body.user, staff_memberships: body.staff_memberships })
        return
      }
      setError(body.error ?? 'No se pudo crear la cuenta')
    } catch (err) {
      setError(err instanceof FetchError ? err.message : 'No se pudo contactar al servidor')
    } finally { setLoading(false) }
  }

  const switchMode = (next: Mode) => {
    setError('')
    router.push(next === 'login' ? '/login' : '/register')
  }

  const inp = (id: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === id ? '#0A0A0F' : 'rgba(0,0,0,0.1)',
    boxShadow: focused === id ? '0 0 0 3px rgba(0,0,0,0.06)' : 'none',
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>

      {/* ── Left panel ── */}
      <div style={{
        width: '42%', background: '#0A0A0F', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }}>
        {/* glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '70%', height: '60%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(198,255,0,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* logo */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.03em' }}>nubapay</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>organizer</span>
          </div>
        </div>

        {/* center copy */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(198,255,0,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Panel de organizador
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 2.5vw, 40px)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: '1.05', color: '#FFFFFF', margin: '0 0 20px 0' }}>
            Gestioná tu evento<br />desde un solo lugar.
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', maxWidth: '300px' }}>
            Pedidos en tiempo real, menú digital, cobros sin fila y retiro con QR antifraude.
          </p>
        </div>

        {/* bottom stats */}
        <div style={{ position: 'relative', display: 'flex', gap: '32px' }}>
          {[{ n: '+40%', label: 'más ventas' }, { n: '0 min', label: 'espera retiro' }, { n: '~1%', label: 'comisión' }].map(({ n, label }) => (
            <div key={label}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#C6FF00', letterSpacing: '-0.05em', lineHeight: '1' }}>{n}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.04em', color: '#0A0A0F', margin: '0 0 8px 0' }}>
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h1>
            <p style={{ fontSize: '14px', color: '#9A9AA8', margin: 0 }}>
              {mode === 'login' ? 'Ingresá tus datos para continuar' : 'Registrate y empezá a crear eventos'}
            </p>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'register' && (
              <input
                type="text" value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                placeholder="Nombre completo" autoComplete="name"
                style={inp('name')} disabled={loading}
              />
            )}
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              placeholder="Email" autoComplete="email"
              style={inp('email')} disabled={loading}
            />
            <input
              type="password" value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              placeholder={mode === 'register' ? 'Contraseña (mín. 8 caracteres)' : 'Contraseña'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={inp('password')} disabled={loading}
            />

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', borderRadius: '100px', background: '#C6FF00', color: '#0A0F00',
                padding: '14px', fontSize: '15px', fontWeight: 700, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                marginTop: '4px', letterSpacing: '-0.01em', transition: 'opacity 0.15s',
              }}
            >
              {loading ? (mode === 'login' ? 'Ingresando…' : 'Creando cuenta…') : (mode === 'login' ? 'Ingresar' : 'Crear cuenta y entrar')}
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.07)', textAlign: 'center' }}>
            {mode === 'login' ? (
              <button type="button" onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#9A9AA8' }}>
                ¿No tenés cuenta?{' '}
                <span style={{ fontWeight: 600, color: '#0A0A0F' }}>Registrate</span>
              </button>
            ) : (
              <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#9A9AA8' }}>
                ¿Ya tenés cuenta?{' '}
                <span style={{ fontWeight: 600, color: '#0A0A0F' }}>Iniciá sesión</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
