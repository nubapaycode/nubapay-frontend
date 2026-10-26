'use client'

import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { AuthError, AuthField, AuthShell, AuthSubmit, Mark } from '@/components/auth/AuthShell'
import { useOrganizerPublicTheme } from '@/components/organizer/OrganizerThemeBridge'

import { authPaths } from '@/lib/api'
import { browserFetch } from '@/lib/browserFetch'

export function ForgotPasswordView() {
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
  /** El subrayado lima solo se usa en la marca propia, no en whitelabel. */
  const ownBrand = !(whitelabel || resolvedSub)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const normalized = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(normalized)) { setError('Ingresá un email válido'); return }
    setLoading(true)
    try {
      const res = await browserFetch(authPaths.forgotPassword(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
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

  const retry = () => {
    setSent(false)
    setError('')
  }

  return (
    <AuthShell
      brand={{ word: brandWord, logoUrl, showTag: ownBrand }}
      eyebrow="Recuperar acceso"
      stubRight={<span className="nba-stub-note">{sent ? 'Paso 2 de 2' : 'Paso 1 de 2'}</span>}
    >
      {sent ? (
        <>
          <h1 className="nba-title">
            Revisá tu <Mark on={ownBrand}>email</Mark>
          </h1>
          <p className="nba-sub">Seguí el link que te enviamos para elegir una contraseña nueva.</p>

          <div className="nba-success" role="status">
            <span className="nba-success-icon" aria-hidden>
              <MailCheck size={17} />
            </span>
            <span>
              Si hay una cuenta asociada a <strong>{email.trim().toLowerCase()}</strong>, ya tenés las
              instrucciones en tu bandeja de entrada.
            </span>
          </div>

          <p className="nba-note">
            ¿No te llegó? Revisá la carpeta de spam o{' '}
            <button type="button" className="nba-foot-link" onClick={retry}>
              probá con otro email
            </button>
            .
          </p>
        </>
      ) : (
        <>
          <h1 className="nba-title">
            Recuperá tu <Mark on={ownBrand}>acceso</Mark>
          </h1>
          <p className="nba-sub">Ingresá el email de tu cuenta y te enviamos un link para restablecer la contraseña.</p>

          <form onSubmit={handleSubmit} className="nba-form" noValidate>
            <AuthField
              id="forgot-email"
              label="Email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="ana@productora.com"
              autoComplete="email"
              autoFocus
              disabled={loading}
            />

            {error && <AuthError>{error}</AuthError>}

            <AuthSubmit type="submit" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar instrucciones'}
            </AuthSubmit>
          </form>
        </>
      )}

      <div className="nba-foot">
        ¿Te acordaste?{' '}
        <Link href="/login" className="nba-foot-link">
          Iniciá sesión
        </Link>
      </div>
    </AuthShell>
  )
}
