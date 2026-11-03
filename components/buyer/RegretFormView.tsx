'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { catalogPaths } from '@/lib/api/paths'
import { browserFetch } from '@/lib/browserFetch'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { compressToWebp, isAllowedImageUpload } from '@/lib/image'

interface RegretFormViewProps {
  catalogSlug: string
  eventName: string
}

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

const fieldClass = 'w-full rounded-[14px] px-4 py-3 text-[15px] outline-none transition-colors'

function fieldStyle(invalid: boolean) {
  return {
    background: BUYER_COLORS.subtleFill,
    border: `1px solid ${invalid ? '#DC2626' : BUYER_COLORS.border}`,
    color: BUYER_COLORS.text,
  }
}

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider"
      style={{ color: BUYER_COLORS.muted }}
    >
      {children} <span style={{ color: '#DC2626' }}>*</span>
    </label>
  )
}

export function RegretFormView({ catalogSlug, eventName }: RegretFormViewProps) {
  const router = useRouter()
  const catalogPath = buyerFlowPath(catalogSlug, { catalogSlug })
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [bankAlias, setBankAlias] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [purchaseDetail, setPurchaseDetail] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Libera la URL de la vista previa al desmontar.
  const previewRef = useRef<string | null>(null)
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  const setFile = (file: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = file ? URL.createObjectURL(file) : null
    setScreenshot(file)
    setPreview(previewRef.current)
  }

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const whatsappValid = whatsapp.replace(/\D/g, '').length >= 6
  const invalid = {
    fullName: fullName.trim() === '',
    email: !emailValid,
    bankAlias: bankAlias.trim() === '',
    whatsapp: !whatsappValid,
    purchaseDetail: purchaseDetail.trim() === '',
    screenshot: screenshot === null,
  }
  const hasErrors = Object.values(invalid).some(Boolean)
  const show = (key: keyof typeof invalid) => touched && invalid[key]

  const pickFile = (file: File | undefined) => {
    if (!file) return
    if (!isAllowedImageUpload(file)) {
      setError('El screenshot debe ser una imagen (JPG, PNG, WebP o HEIC).')
      return
    }
    setError('')
    setFile(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (hasErrors || !screenshot || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const image = await compressToWebp(screenshot, { maxSide: 2048, quality: 0.86 })
      if (image.size > MAX_SCREENSHOT_BYTES) {
        setError('El screenshot pesa más de 5 MB. Probá con otra captura.')
        return
      }
      const form = new FormData()
      form.append('full_name', fullName.trim())
      form.append('email', email.trim())
      form.append('bank_alias', bankAlias.trim())
      form.append('whatsapp', whatsapp.trim())
      form.append('purchase_detail', purchaseDetail.trim())
      form.append('screenshot', image, image.name || 'screenshot.webp')

      const res = await browserFetch(catalogPaths.createRegret(catalogSlug), {
        method: 'POST',
        headers: { 'X-Branded-Host': window.location.host },
        body: form,
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(body.error ?? 'No pudimos enviar tu solicitud. Intentá de nuevo.')
        return
      }
      setSent(true)
    } catch {
      setError('No pudimos enviar tu solicitud. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const header = (
    <div
      className="sticky top-0 z-10 flex h-[60px] items-center px-4"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BUYER_COLORS.border}`,
      } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => router.push(catalogPath)}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors"
        style={{ background: BUYER_COLORS.subtleFill }}
        aria-label="Volver al catálogo"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M11 4L6 9l5 5" stroke={BUYER_COLORS.text} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span
        className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold tracking-tight"
        style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}
      >
        Arrepentimiento
      </span>
    </div>
  )

  if (sent) {
    return (
      <div className="flex min-h-dvh flex-col" style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}>
        {header}
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
            <p className="mb-1 text-[19px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}>
              Recibimos tu solicitud
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
              El organizador de {eventName} la va a revisar y se va a comunicar con vos por WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(catalogPath)}
            className="rounded-full px-5 py-2.5 text-[14px] font-semibold transition-opacity active:opacity-80"
            style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
          >
            ← Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}>
      {header}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6 pb-12"
      >
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
            Botón de arrepentimiento
          </h1>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
            Completá los datos de tu compra en {eventName}. El organizador va a revisar tu solicitud y te va a contactar.
          </p>
        </div>

        <div>
          <Label htmlFor="regret-name">Nombre y apellido</Label>
          <input
            id="regret-name"
            type="text"
            autoComplete="name"
            maxLength={150}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={fieldClass}
            style={fieldStyle(show('fullName'))}
          />
        </div>

        <div>
          <Label htmlFor="regret-email">E-mail</Label>
          <input
            id="regret-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={150}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="El mismo que usaste al comprar"
            className={fieldClass}
            style={fieldStyle(show('email'))}
          />
          {show('email') && (
            <p className="mt-1 text-[12px]" style={{ color: '#DC2626' }}>Ingresá un e-mail válido.</p>
          )}
        </div>

        <div>
          <Label htmlFor="regret-alias">Alias o datos bancarios de titular</Label>
          <input
            id="regret-alias"
            type="text"
            maxLength={200}
            value={bankAlias}
            onChange={e => setBankAlias(e.target.value)}
            placeholder="Alias, CBU o CVU de la cuenta a tu nombre"
            className={fieldClass}
            style={fieldStyle(show('bankAlias'))}
          />
        </div>

        <div>
          <Label htmlFor="regret-whatsapp">WhatsApp de comunicación</Label>
          <input
            id="regret-whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={50}
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="Ej. +54 9 11 1234 5678"
            className={fieldClass}
            style={fieldStyle(show('whatsapp'))}
          />
          {show('whatsapp') && (
            <p className="mt-1 text-[12px]" style={{ color: '#DC2626' }}>Ingresá un número válido.</p>
          )}
        </div>

        <div>
          <Label htmlFor="regret-detail">Detalle de compra</Label>
          <textarea
            id="regret-detail"
            rows={4}
            maxLength={2000}
            value={purchaseDetail}
            onChange={e => setPurchaseDetail(e.target.value)}
            placeholder="Qué compraste, cantidades y fecha"
            className={`${fieldClass} resize-none`}
            style={fieldStyle(show('purchaseDetail'))}
          />
        </div>

        <div>
          <Label htmlFor="regret-screenshot">Screenshot de confirmación de compra</Label>
          <input
            ref={fileRef}
            id="regret-screenshot"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={e => {
              pickFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {preview ? (
            <div
              className="flex items-center gap-3 rounded-[14px] p-2.5"
              style={{ background: BUYER_COLORS.subtleFill, border: `1px solid ${BUYER_COLORS.border}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) */}
              <img src={preview} alt="Screenshot seleccionado" className="h-16 w-16 flex-shrink-0 rounded-[10px] object-cover" />
              <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: BUYER_COLORS.text }}>
                {screenshot?.name}
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: '#FFFFFF', border: `1px solid ${BUYER_COLORS.border}`, color: BUYER_COLORS.text }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-1.5 rounded-[14px] px-4 py-6 text-[14px] font-semibold transition-colors"
              style={{
                background: BUYER_COLORS.subtleFill,
                border: `1.5px dashed ${show('screenshot') ? '#DC2626' : BUYER_COLORS.chipInactiveBorder}`,
                color: BUYER_COLORS.text,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M11 15V4m0 0L7 8m4-4l4 4M4 15v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Adjuntar imagen
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-[14px] px-4 py-3 text-[13px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626' }}
          >
            {error}
          </div>
        )}
        {touched && hasErrors && !error && (
          <p className="text-[13px]" style={{ color: '#DC2626' }}>Completá todos los campos obligatorios.</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full px-5 py-3.5 text-[15px] font-bold transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
        >
          {submitting ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}
