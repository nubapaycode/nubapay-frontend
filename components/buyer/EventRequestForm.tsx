'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'

import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { compressToWebp, isAllowedImageUpload } from '@/lib/image'
import { submitEventRequest } from '@/lib/parkingOwner'

const MAX_COVER_BYTES = 5 * 1024 * 1024
const ALLOWED_COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const fieldClass = 'w-full rounded-[14px] px-4 py-3 text-[15px] outline-none transition-colors'

function fieldStyle(invalid: boolean) {
  return {
    background: BUYER_COLORS.subtleFill,
    border: `1px solid ${invalid ? '#DC2626' : BUYER_COLORS.border}`,
    color: BUYER_COLORS.text,
  }
}

function Label({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: BUYER_COLORS.muted }}
    >
      {children} {required && <span style={{ color: '#DC2626' }}>*</span>}
    </label>
  )
}

function FieldError({ children }: { children: string }) {
  return (
    <p className="mt-1 text-[12px]" style={{ color: '#DC2626' }}>
      {children}
    </p>
  )
}

/** Formulario público: un organizador pide su evento al dueño de un estacionamiento. */
export function EventRequestForm({ parkingSlug, parkingName }: { parkingSlug: string; parkingName: string }) {
  const [organizerName, setOrganizerName] = useState('')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [organizerPhone, setOrganizerPhone] = useState('')
  const [eventName, setEventName] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('') // señuelo anti-bots: queda vacío para una persona
  const [cover, setCover] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const previewRef = useRef<string | null>(null)
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    [],
  )

  const setFile = (file: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = file ? URL.createObjectURL(file) : null
    setCover(file)
    setPreview(previewRef.current)
  }

  const invalid = {
    organizerName: organizerName.trim() === '',
    organizerEmail: !EMAIL_RE.test(organizerEmail.trim()),
    organizerPhone: organizerPhone.replace(/\D/g, '').length < 6,
    eventName: eventName.trim().length < 2,
    startsAt: startsAt === '',
    endsAt: endsAt !== '' && startsAt !== '' && endsAt < startsAt,
  }
  const hasErrors = Object.values(invalid).some(Boolean)
  const show = (key: keyof typeof invalid) => touched && invalid[key]

  const pickFile = (file: File | undefined) => {
    if (!file) return
    if (!isAllowedImageUpload(file)) {
      setError('La portada debe ser una imagen (JPG, PNG o WebP).')
      return
    }
    setError('')
    setFile(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (hasErrors || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('organizer_name', organizerName.trim())
      form.append('organizer_email', organizerEmail.trim())
      form.append('organizer_phone', organizerPhone.trim())
      form.append('event_name', eventName.trim())
      form.append('starts_at', startsAt)
      if (endsAt) form.append('ends_at', endsAt)
      if (description.trim()) form.append('description', description.trim())
      form.append('website', website)
      if (cover) {
        const image = await compressToWebp(cover)
        if (!ALLOWED_COVER_TYPES.has(image.type)) {
          // HEIC/HEIF no se convierte en el navegador y el servidor no lo acepta para portadas.
          setError('La portada debe ser JPG, PNG o WebP.')
          return
        }
        if (image.size > MAX_COVER_BYTES) {
          setError('La portada supera 5 MB. Probá con una imagen más liviana.')
          return
        }
        form.append('cover', image, image.name || 'cover.webp')
      }

      const r = await submitEventRequest(parkingSlug, form)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSent(true)
    } catch {
      setError('No pudimos enviar tu solicitud. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-dvh flex-col" style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div
            className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px]"
            style={{ background: BUYER_COLORS.subtleFill }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
              <path d="M7 16.5l6 6L25 10" stroke={BUYER_COLORS.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="mb-1 text-[19px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}>
              Recibimos tu solicitud
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
              {parkingName} va a revisar los datos de {eventName.trim()} y se va a comunicar con vos al{' '}
              {organizerEmail.trim()} o por teléfono.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-8 pb-12"
      >
        <div>
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider" style={{ color: BUYER_COLORS.muted }}>
            {parkingName}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
            Pedí tu evento
          </h1>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
            Completá los datos de tu evento. {parkingName} los revisa y, si los aprueba, se crea el evento y se
            comunican con vos.
          </p>
        </div>

        <div>
          <Label htmlFor="req-event-name" required>Nombre del evento</Label>
          <input
            id="req-event-name"
            type="text"
            maxLength={150}
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            className={fieldClass}
            style={fieldStyle(show('eventName'))}
          />
          {show('eventName') && <FieldError>Ingresá el nombre del evento.</FieldError>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="req-starts" required>Inicio</Label>
            <input
              id="req-starts"
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              className={fieldClass}
              style={fieldStyle(show('startsAt'))}
            />
            {show('startsAt') && <FieldError>Ingresá cuándo empieza.</FieldError>}
          </div>
          <div>
            <Label htmlFor="req-ends">Fin</Label>
            <input
              id="req-ends"
              type="datetime-local"
              value={endsAt}
              min={startsAt || undefined}
              onChange={e => setEndsAt(e.target.value)}
              className={fieldClass}
              style={fieldStyle(show('endsAt'))}
            />
            {show('endsAt') && <FieldError>El fin no puede ser anterior al inicio.</FieldError>}
          </div>
        </div>

        <div>
          <Label htmlFor="req-description">Descripción</Label>
          <textarea
            id="req-description"
            rows={4}
            maxLength={3000}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="De qué se trata, cuánta gente esperás, horarios…"
            className={fieldClass}
            style={fieldStyle(false)}
          />
        </div>

        <div>
          <Label htmlFor="req-cover">Portada</Label>
          <input
            ref={fileRef}
            id="req-cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={e => pickFile(e.target.files?.[0])}
          />
          {preview ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Vista previa de la portada" className="h-20 w-20 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="text-[13px] font-semibold"
                style={{ color: BUYER_COLORS.muted }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`${fieldClass} text-left`}
              style={{ ...fieldStyle(false), color: BUYER_COLORS.muted }}
            >
              Subir una imagen (opcional)
            </button>
          )}
        </div>

        <hr style={{ borderColor: BUYER_COLORS.border }} />

        <div>
          <Label htmlFor="req-name" required>Tu nombre</Label>
          <input
            id="req-name"
            type="text"
            autoComplete="name"
            maxLength={150}
            value={organizerName}
            onChange={e => setOrganizerName(e.target.value)}
            className={fieldClass}
            style={fieldStyle(show('organizerName'))}
          />
          {show('organizerName') && <FieldError>Ingresá tu nombre.</FieldError>}
        </div>

        <div>
          <Label htmlFor="req-email" required>E-mail</Label>
          <input
            id="req-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={150}
            value={organizerEmail}
            onChange={e => setOrganizerEmail(e.target.value)}
            className={fieldClass}
            style={fieldStyle(show('organizerEmail'))}
          />
          {show('organizerEmail') && <FieldError>Ingresá un e-mail válido.</FieldError>}
        </div>

        <div>
          <Label htmlFor="req-phone" required>Teléfono / WhatsApp</Label>
          <input
            id="req-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={50}
            value={organizerPhone}
            onChange={e => setOrganizerPhone(e.target.value)}
            className={fieldClass}
            style={fieldStyle(show('organizerPhone'))}
          />
          {show('organizerPhone') && <FieldError>Ingresá un teléfono de contacto válido.</FieldError>}
        </div>

        {/* Señuelo: oculto para personas y lectores de pantalla; los bots suelen completarlo. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="req-website">Sitio web</label>
          <input
            id="req-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-[13px] font-medium" style={{ color: '#DC2626' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full px-5 py-3.5 text-[15px] font-semibold transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ background: BUYER_COLORS.text, color: '#fff' }}
        >
          {submitting ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}
