'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { AuthError, AuthField, AuthShell, AuthSubmit, Mark } from '@/components/auth/AuthShell'
import { useOrganizerPublicTheme } from '@/components/organizer/OrganizerThemeBridge'

import { Spinner } from '@/components/ui/Spinner'
import { authPaths } from '@/lib/api'
import { type AuthUser, getAuthToken, getAuthUser, setAuthSession } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { useLoggedIn } from '@/lib/useLoggedIn'
import { FetchError } from '@/lib/fetcher'

type Mode = 'login' | 'register'

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

function adminRedirectPath(next: string | null): string {
  const target = safeNextPath(next)
  return target?.startsWith('/admin') ? target : '/admin'
}

export function LoginView({ initialMode = 'login' }: { initialMode?: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const pubTheme = useOrganizerPublicTheme()
  const whitelabel = !!(pubTheme && !pubTheme.inherit)
  const resolvedSub =
    typeof pubTheme?.resolved_subdomain === 'string' && pubTheme.resolved_subdomain.trim()
      ? pubTheme.resolved_subdomain.trim()
      : ''
  const displayName =
    whitelabel && typeof pubTheme?.branding.displayName === 'string' && pubTheme.branding.displayName.trim()
      ? pubTheme.branding.displayName.trim()
      : ''
  const logoUrl =
    whitelabel && typeof pubTheme?.branding.logoUrl === 'string' && pubTheme.branding.logoUrl.trim()
      ? pubTheme.branding.logoUrl.trim()
      : ''
  const brandWord = displayName || resolvedSub || 'nubapay'

  const [mode] = useState<Mode>(initialMode)
  // Llegamos con `expired=1` (o lo detectamos acá) cuando había token pero el servidor lo rechazó.
  const expired = searchParams.get('expired') === '1'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Con una sesión guardada se navega al toque, sin esperar a la red: `OrganizerGuard` valida el
  // token en el destino y, si el servidor lo rechaza, vuelve acá con `?expired=1` y sin token.
  const redirecting = useLoggedIn()
  useEffect(() => {
    if (!getAuthToken()) return
    if (getAuthUser()?.is_platform_admin) {
      router.replace(adminRedirectPath(next))
      return
    }
    const target = safeNextPath(next)
    router.replace(target && !target.startsWith('/admin') ? target : '/panel')
  }, [router, next])

  const finishAuth = async (token: string, user: AuthUser) => {
    setAuthSession(token, user)
    if (user.is_platform_admin) {
      router.push(adminRedirectPath(next))
      return
    }
    const target = safeNextPath(next)
    if (target) {
      router.push(target)
      return
    }
    // /panel resuelve el primer evento y a qué sección puede entrar el usuario.
    router.push('/panel')
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
        finishAuth(body.token, { ...body.user, staff_memberships: body.staff_memberships ?? body.user.staff_memberships })
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
        finishAuth(body.token, { ...body.user, staff_memberships: body.staff_memberships ?? body.user.staff_memberships })
        return
      }
      setError(body.error ?? 'No se pudo crear la cuenta')
    } catch (err) {
      setError(err instanceof FetchError ? err.message : 'No se pudo contactar al servidor')
    } finally { setLoading(false) }
  }

  const switchMode = (target: Mode) => {
    setError('')
    router.push(target === 'login' ? '/ingresar' : '/registro')
  }

  const isLogin = mode === 'login'
  /** El subrayado lima solo se usa en la marca propia, no en whitelabel. */
  const ownBrand = !(whitelabel || resolvedSub)

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Spinner size="lg" className="text-gray-900" />
      </div>
    )
  }

  return (
    <AuthShell
      brand={{ word: brandWord, logoUrl, showTag: ownBrand }}
      eyebrow="Acceso organizador"
    >
      <h1 className="nba-title">
        {isLogin ? (
          <>
            Bienvenido <Mark on={ownBrand}>de vuelta</Mark>
          </>
        ) : (
          <>
            Creá tu <Mark on={ownBrand}>cuenta</Mark>
          </>
        )}
      </h1>
      <p className="nba-sub">
        {isLogin
          ? 'Entrá al panel para ver pedidos, cobros y retiros en tiempo real.'
          : 'Empezá a vender en tu evento con menú digital y retiro por QR.'}
      </p>

      <form onSubmit={isLogin ? handleLogin : handleRegister} className="nba-form" noValidate>
        {!isLogin && (
          <AuthField
            id="auth-name"
            label="Nombre"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Nombre completo"
            autoComplete="name"
            disabled={loading}
          />
        )}

        <AuthField
          id="auth-email"
          label="Email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="ana@productora.com"
          autoComplete="email"
          disabled={loading}
        />

        <AuthField
          id="auth-password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          placeholder={isLogin ? '••••••••' : 'Mínimo 8 caracteres'}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          disabled={loading}
        />

        {isLogin && (
          <Link href="/recuperar-clave" className="nba-hint">
            ¿Olvidaste tu contraseña?
          </Link>
        )}

        {error && <AuthError>{error}</AuthError>}
        {!error && expired && isLogin && <AuthError>Tu sesión venció o ya no es válida. Iniciá sesión de nuevo.</AuthError>}

        <AuthSubmit type="submit" disabled={loading}>
          {loading ? (isLogin ? 'Ingresando…' : 'Creando cuenta…') : isLogin ? 'Ingresar' : 'Crear cuenta y entrar'}
        </AuthSubmit>
      </form>

      <div className="nba-foot">
        {isLogin ? (
          <>
            ¿No tenés cuenta?{' '}
            <button type="button" className="nba-foot-link" onClick={() => switchMode('register')}>
              Registrate
            </button>
          </>
        ) : (
          <>
            ¿Ya tenés cuenta?{' '}
            <button type="button" className="nba-foot-link" onClick={() => switchMode('login')}>
              Iniciá sesión
            </button>
          </>
        )}
      </div>
    </AuthShell>
  )
}
