'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AuthError, AuthField, AuthShell, AuthTextarea, AuthSubmit, Mark } from '@/components/auth/AuthShell'
import { useOrganizerPublicTheme } from '@/components/organizer/OrganizerThemeBridge'
import { browserFetch } from '@/lib/browserFetch'

/** ID público del form de Formspree; se puede sobreescribir por entorno. */
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || 'mdeoggby'
const FORMSPREE_ENDPOINT = FORMSPREE_ID ? `https://formspree.io/f/${FORMSPREE_ID}` : ''

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterRequestForm() {
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

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (firstName.trim().length < 2) { setError('Ingresá tu nombre.'); return }
    if (lastName.trim().length < 2) { setError('Ingresá tu apellido.'); return }
    if (!EMAIL_RE.test(email.trim())) { setError('Revisá el email: falta el @ o el dominio.'); return }
    if (message.trim().length < 10) { setError('Contanos un poco más: al menos 10 caracteres.'); return }
    if (!FORMSPREE_ENDPOINT) {
      setError('El formulario no está configurado. Definí NEXT_PUBLIC_FORMSPREE_FORM_ID.')
      return
    }
    setLoading(true)
    try {
      const res = await browserFetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nombre: firstName.trim(),
          apellido: lastName.trim(),
          email: email.trim(),
          mensaje: message.trim(),
          _subject: `Nueva consulta de ${firstName.trim()} ${lastName.trim()}`,
        }),
      })
      if (res.ok) {
        setSent(true)
        return
      }
      const body = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      setError(body?.errors?.[0]?.message ?? 'No pudimos enviar tu mensaje. Probá de nuevo.')
    } catch {
      setError('No se pudo contactar al servidor. Revisá tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  /** El subrayado lima solo se usa en la marca propia, no en whitelabel. */
  const ownBrand = !(whitelabel || resolvedSub)
  const brand = { word: brandWord, logoUrl, showTag: ownBrand }

  if (sent) {
    return (
      <AuthShell
        brand={brand}
        eyebrow="Solicitud enviada"
        stubRight={<span className="nba-stub-chip">Recibido</span>}
      >
        <h1 className="nba-title">
          Mensaje <Mark on={ownBrand}>enviado</Mark>
        </h1>
        <p className="nba-sub">
          Gracias {firstName.trim()}. Te respondemos a <strong style={{ color: '#0A0A0F', fontWeight: 600 }}>{email.trim()}</strong> dentro de las próximas 24 horas hábiles.
        </p>
        <div className="nba-foot" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0, textAlign: 'left' }}>
          <Link href="/" className="nba-foot-link">
            Volver al inicio
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      brand={brand}
      eyebrow="Hablemos de tu evento"
      stubRight={<span className="nba-stub-note">Respuesta en 24 h</span>}
    >
      <h1 className="nba-title">
        Contanos qué <Mark on={ownBrand}>necesitás</Mark>
      </h1>
      <p className="nba-sub">
        Dejanos tus datos y te contactamos para armar tu cuenta de organizador.
      </p>

      <form onSubmit={handleSubmit} className="nba-form" noValidate>
        <div className="nba-row">
          <AuthField
            id="reg-first-name"
            label="Nombre"
            type="text"
            name="nombre"
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setError('') }}
            placeholder="Ana"
            autoComplete="given-name"
            disabled={loading}
          />
          <AuthField
            id="reg-last-name"
            label="Apellido"
            type="text"
            name="apellido"
            value={lastName}
            onChange={e => { setLastName(e.target.value); setError('') }}
            placeholder="Fernández"
            autoComplete="family-name"
            disabled={loading}
          />
        </div>

        <AuthField
          id="reg-email"
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="ana@productora.com"
          autoComplete="email"
          disabled={loading}
        />

        <AuthTextarea
          id="reg-message"
          label="Mensaje"
          name="mensaje"
          value={message}
          onChange={e => { setMessage(e.target.value); setError('') }}
          placeholder="Qué tipo de evento organizás, fecha estimada y cuánta gente esperás."
          disabled={loading}
        />

        {error && <AuthError>{error}</AuthError>}

        <AuthSubmit type="submit" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar mensaje'}
        </AuthSubmit>
      </form>

      <div className="nba-foot">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="nba-foot-link">
          Iniciá sesión
        </Link>
      </div>
    </AuthShell>
  )
}
