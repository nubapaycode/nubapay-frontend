'use client'

import { type FormEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, CalendarClock, Check, ImagePlus, Loader2, PauseCircle, RefreshCw, Trash2 } from 'lucide-react'

import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { compressToWebp, isAllowedImageUpload } from '@/lib/image'
import { DatePickerField, TimePickerField, Toggle } from '@/components/buyer/EventRequestPickers'
import { submitEventRequest } from '@/lib/parkingOwner'
import { cn } from '@/lib/utils'

const MAX_COVER_BYTES = 5 * 1024 * 1024
const ALLOWED_COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const DESCRIPTION_MAX = 400

// ── Fechas ─────────────────────────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const next = new Date(y, m - 1, d + days)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}

function prettyDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const s = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Schedule = { startsAt: string; endsAt: string; nextDay: boolean }

/**
 * Arma inicio y fin a partir de fecha + horas. Si no es de varios días y la hora de fin es menor o igual
 * a la de inicio, el evento termina al día siguiente (el caso típico de una fiesta que pasa la medianoche).
 */
export function buildSchedule(input: {
  date: string
  startTime: string
  endTime: string
  multiDay: boolean
  endDate: string
}): Schedule | null {
  if (!input.date || !input.startTime) return null
  const startsAt = `${input.date}T${input.startTime}`
  if (!input.endTime) return { startsAt, endsAt: '', nextDay: false }
  if (input.multiDay) {
    return { startsAt, endsAt: input.endDate ? `${input.endDate}T${input.endTime}` : '', nextDay: false }
  }
  const nextDay = input.endTime <= input.startTime
  return { startsAt, endsAt: `${nextDay ? addDays(input.date, 1) : input.date}T${input.endTime}`, nextDay }
}

// ── Piezas ─────────────────────────────────────────────────────────────────────

const inputClass =
  'w-full min-w-0 rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-[#0A0A0F] outline-none transition-[border-color,box-shadow] placeholder:text-[#A8A8B3] focus:border-[#0A0A0F] focus:ring-4 focus:ring-black/5'

function inputState(invalid: boolean) {
  return invalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-black/10 hover:border-black/20'
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  aside,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string | false
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-[#2A2A33]">
          {label}
          {!required && <span className="ml-1 font-normal text-[#9A9AA8]">(opcional)</span>}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-[#8A8A96]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function describedBy(id: string, error: string | false | undefined, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

function Section({ step, title, description, children }: { step: number; title: string; description: string; children: ReactNode }) {
  return (
    <section className="border-t border-black/[0.06] px-5 py-6 first:border-t-0 sm:px-7 sm:py-7">
      <div className="mb-5 flex items-start gap-3">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
          aria-hidden
        >
          {step}
        </span>
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-[#0A0A0F]">{title}</h2>
          <p className="mt-0.5 text-[13px] text-[#8A8A96]">{description}</p>
        </div>
      </div>
      <div className="space-y-5 sm:pl-9">{children}</div>
    </section>
  )
}

function ParkingBadge({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white py-1 pl-1 pr-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <span
        className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold uppercase"
        style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
        aria-hidden
      >
        {name.trim().charAt(0) || 'P'}
      </span>
      <span className="text-[13px] font-semibold text-[#0A0A0F]">{name}</span>
    </div>
  )
}

const NEXT_STEPS = [
  { title: 'Revisan tu pedido', text: 'El estacionamiento ve los datos y la fecha de tu evento.' },
  { title: 'Te contactan', text: 'Te escriben por e-mail o WhatsApp si necesitan algo más.' },
  { title: 'Se crea tu evento', text: 'Si lo aprueban, queda listo para vender estacionamiento.' },
]

function NextSteps({ compact }: { compact?: boolean }) {
  return (
    <ol className={cn('space-y-4', compact && 'space-y-3')}>
      {NEXT_STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[12px] font-semibold text-[#0A0A0F]">
            {i + 1}
          </span>
          <div className="pt-0.5">
            <p className="text-[14px] font-medium text-[#0A0A0F]">{s.title}</p>
            <p className="text-[13px] leading-relaxed text-[#8A8A96]">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F6F6F8]" style={{ fontFamily: BUYER_FONT }}>
      {children}
    </div>
  )
}

/** El estacionamiento pausó las solicitudes: lo decimos en vez de mostrar un 404. */
export function EventRequestPaused({ parkingName }: { parkingName: string }) {
  return (
    <Shell>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <ParkingBadge name={parkingName} />
        <span className="mt-8 flex size-14 items-center justify-center rounded-2xl bg-white text-[#0A0A0F] shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
          <PauseCircle size={26} strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-[#0A0A0F]">Solicitudes pausadas</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B6B78]">
          {parkingName} no está recibiendo pedidos de eventos en este momento. Volvé a intentar más adelante o
          comunicate directamente con el estacionamiento.
        </p>
      </div>
    </Shell>
  )
}

// ── Formulario ─────────────────────────────────────────────────────────────────

type FieldKey = 'eventName' | 'date' | 'startTime' | 'endDate' | 'organizerName' | 'organizerEmail' | 'organizerPhone'

const FIELD_IDS: Record<FieldKey, string> = {
  eventName: 'req-event-name',
  date: 'req-date',
  startTime: 'req-start-time',
  endDate: 'req-end-date',
  organizerName: 'req-name',
  organizerEmail: 'req-email',
  organizerPhone: 'req-phone',
}

/** Formulario público: un organizador pide su evento al dueño de un estacionamiento. */
export function EventRequestForm({ parkingSlug, parkingName }: { parkingSlug: string; parkingName: string }) {
  const [eventName, setEventName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [multiDay, setMultiDay] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [organizerName, setOrganizerName] = useState('')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [organizerPhone, setOrganizerPhone] = useState('')
  const [website, setWebsite] = useState('') // señuelo anti-bots: queda vacío para una persona
  const [cover, setCover] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [blurred, setBlurred] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [coverError, setCoverError] = useState('')
  const [sent, setSent] = useState<{ eventName: string; when: string; email: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // La descripción crece con el texto (también se achica al borrar o al pedir otro evento).
  useLayoutEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }, [description])

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
    if (!file && fileRef.current) fileRef.current.value = ''
  }

  const schedule = buildSchedule({ date, startTime, endTime, multiDay, endDate })
  const today = todayIso()

  const errors: Record<FieldKey, string | false> = {
    eventName: eventName.trim().length < 2 && 'Ingresá el nombre del evento.',
    date: !date ? 'Elegí la fecha del evento.' : date < today && 'La fecha ya pasó.',
    startTime: !startTime && 'Ingresá a qué hora empieza.',
    endDate:
      multiDay &&
      (!endDate
        ? 'Elegí qué día termina.'
        : !!schedule?.endsAt && schedule.endsAt < schedule.startsAt && 'El fin no puede ser anterior al inicio.'),
    organizerName: organizerName.trim() === '' && 'Ingresá tu nombre.',
    organizerEmail: !EMAIL_RE.test(organizerEmail.trim()) && 'Ingresá un e-mail válido.',
    organizerPhone: organizerPhone.replace(/\D/g, '').length < 6 && 'Ingresá un teléfono de contacto válido.',
  }
  const shown = (k: FieldKey) => ((submitted || blurred[k]) && errors[k]) || false
  const blur = (k: FieldKey) => () => setBlurred(b => (b[k] ? b : { ...b, [k]: true }))

  const pickFile = (file: File | undefined) => {
    if (!file) return
    if (!isAllowedImageUpload(file)) {
      setCoverError('La portada debe ser una imagen (JPG, PNG o WebP).')
      return
    }
    setCoverError('')
    setFile(file)
  }

  const whenLabel = (() => {
    if (!schedule || !date) return ''
    const start = `${prettyDay(date)}, ${startTime} h`
    if (!schedule.endsAt) return start
    const [endDay, endHour] = schedule.endsAt.split('T')
    return endDay === date ? `${start} a ${endHour} h` : `${start} → ${prettyDay(endDay)}, ${endHour} h`
  })()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const firstInvalid = (Object.keys(errors) as FieldKey[]).find(k => errors[k])
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }
    if (submitting || !schedule) return
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('organizer_name', organizerName.trim())
      form.append('organizer_email', organizerEmail.trim())
      form.append('organizer_phone', organizerPhone.trim())
      form.append('event_name', eventName.trim())
      form.append('starts_at', schedule.startsAt)
      if (schedule.endsAt) form.append('ends_at', schedule.endsAt)
      if (description.trim()) form.append('description', description.trim())
      form.append('website', website)
      if (cover) {
        const image = await compressToWebp(cover)
        if (!ALLOWED_COVER_TYPES.has(image.type)) {
          // HEIC/HEIF no se convierte en el navegador y el servidor no lo acepta para portadas.
          setCoverError('La portada debe ser JPG, PNG o WebP.')
          return
        }
        if (image.size > MAX_COVER_BYTES) {
          setCoverError('La portada supera 5 MB. Probá con una imagen más liviana.')
          return
        }
        form.append('cover', image, image.name || 'cover.webp')
      }

      const r = await submitEventRequest(parkingSlug, form)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSent({ eventName: eventName.trim(), when: whenLabel, email: organizerEmail.trim() })
      window.scrollTo({ top: 0 })
    } catch {
      setError('No pudimos enviar tu solicitud. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForAnother = () => {
    setEventName('')
    setDescription('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setMultiDay(false)
    setEndDate('')
    setFile(null)
    setBlurred({})
    setSubmitted(false)
    setError('')
    setCoverError('')
    setSent(null)
    // Los datos de contacto quedan: suele ser la misma persona pidiendo otra fecha.
  }

  if (sent) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-20">
          <div className="text-center">
            <span
              className="mx-auto flex size-14 items-center justify-center rounded-2xl"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              <Check size={28} strokeWidth={2.25} aria-hidden />
            </span>
            <h1 className="mt-5 text-[24px] font-semibold tracking-tight text-[#0A0A0F]">Recibimos tu solicitud</h1>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#6B6B78]">
              {parkingName} va a revisar los datos de tu evento y se va a comunicar con vos al{' '}
              <span className="font-medium text-[#0A0A0F]">{sent.email}</span> o por teléfono.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F6] text-[#0A0A0F]">
                <CalendarClock size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#0A0A0F]">{sent.eventName}</p>
                <p className="text-[13px] text-[#8A8A96]">{sent.when}</p>
              </div>
            </div>
            <div className="border-t border-black/[0.06] bg-[#FAFAFB] px-5 py-5">
              <p className="mb-3 text-[14px] font-semibold text-[#0A0A0F]">Qué pasa ahora</p>
              <NextSteps compact />
            </div>
          </div>

          <button
            type="button"
            onClick={resetForAnother}
            className="mx-auto mt-6 flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold text-[#0A0A0F] transition-colors hover:bg-black/5"
          >
            Pedir otro evento
            <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </Shell>
    )
  }

  const descriptionLeft = DESCRIPTION_MAX - description.length

  return (
    <Shell>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-28 pt-8 sm:pb-16 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-14 lg:pt-20">
        {/* Intro */}
        <header className="lg:sticky lg:top-20 lg:self-start">
          <ParkingBadge name={parkingName} />
          <h1 className="mt-5 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0A0A0F] sm:text-[34px]">
            Informá tu evento
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#6B6B78]">
            Contanos de qué se trata y cuándo es. {parkingName} lo revisa y, si lo aprueba, se crea tu evento para
            vender estacionamiento.
          </p>
          <div className="mt-8 hidden lg:block">
            <p className="mb-4 text-[14px] font-semibold text-[#0A0A0F]">Cómo sigue</p>
            <NextSteps />
          </div>
        </header>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]"
        >
          <Section step={1} title="Tu evento" description="Lo que va a ver el estacionamiento al revisar tu pedido.">
            <Field id="req-event-name" label="Nombre del evento" required error={shown('eventName')}>
              <input
                id="req-event-name"
                type="text"
                maxLength={150}
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                onBlur={blur('eventName')}
                placeholder="Ej.: Festival de Verano 2027"
                aria-invalid={!!shown('eventName')}
                aria-describedby={describedBy('req-event-name', shown('eventName'))}
                className={cn(inputClass, inputState(!!shown('eventName')))}
              />
            </Field>

            <Field
              id="req-description"
              label="Descripción"
              hint="Cuánta gente esperás, si es al aire libre, si necesitás algo especial…"
            >
              <div className="relative">
                <textarea
                  ref={descriptionRef}
                  id="req-description"
                  rows={3}
                  maxLength={DESCRIPTION_MAX}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="De qué se trata tu evento"
                  aria-describedby="req-description-hint req-description-count"
                  className={cn(inputClass, inputState(false), 'resize-none overflow-hidden pb-7 leading-relaxed')}
                />
                <span
                  id="req-description-count"
                  aria-live="polite"
                  className={cn(
                    'pointer-events-none absolute bottom-2 right-3 text-[12px] tabular-nums',
                    descriptionLeft <= 40 ? 'text-red-600' : 'text-[#9A9AA8]',
                  )}
                >
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
            </Field>

            <Field id="req-cover" label="Portada" error={coverError || false}>
              <input
                ref={fileRef}
                id="req-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={e => pickFile(e.target.files?.[0])}
              />
              {preview ? (
                <div className="group relative overflow-hidden rounded-2xl border border-black/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Vista previa de la portada" className="aspect-[16/9] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-[#0A0A0F] backdrop-blur hover:bg-white"
                    >
                      <RefreshCw size={13} aria-hidden />
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-[#0A0A0F] backdrop-blur hover:bg-white"
                    >
                      <Trash2 size={13} aria-hidden />
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragging(false)
                    pickFile(e.dataTransfer.files?.[0])
                  }}
                  className={cn(
                    'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center transition-colors',
                    dragging ? 'border-[#0A0A0F] bg-[#F4F4F6]' : 'border-black/15 bg-[#FAFAFB] hover:border-black/30 hover:bg-[#F4F4F6]',
                  )}
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#0A0A0F] shadow-[0_1px_2px_rgba(16,24,40,0.08)]">
                    <ImagePlus size={18} aria-hidden />
                  </span>
                  <span className="text-[14px] font-medium text-[#0A0A0F]">Subí una imagen o arrastrala acá</span>
                  <span className="text-[12px] text-[#8A8A96]">JPG, PNG o WebP · hasta 5 MB · ideal horizontal</span>
                </button>
              )}
            </Field>
          </Section>

          <Section step={2} title="Cuándo" description="Si termina después de medianoche, lo tomamos como el día siguiente.">
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4">
              <div className="col-span-2">
                <Field id="req-date" label="Fecha" required error={shown('date')}>
                  <DatePickerField
                    id="req-date"
                    min={today}
                    value={date}
                    onChange={setDate}
                    onBlur={blur('date')}
                    invalid={!!shown('date')}
                    describedBy={describedBy('req-date', shown('date'))}
                  />
                </Field>
              </div>
              <Field id="req-start-time" label="Inicio" required error={shown('startTime')}>
                <TimePickerField
                  id="req-start-time"
                  value={startTime}
                  onChange={setStartTime}
                  onBlur={blur('startTime')}
                  invalid={!!shown('startTime')}
                  describedBy={describedBy('req-start-time', shown('startTime'))}
                />
              </Field>
              <Field id="req-end-time" label="Fin">
                <TimePickerField
                  id="req-end-time"
                  value={endTime}
                  onChange={setEndTime}
                  relativeTo={!multiDay && startTime ? startTime : undefined}
                />
              </Field>
            </div>

            <Toggle
              id="req-multi-day"
              checked={multiDay}
              onChange={next => {
                setMultiDay(next)
                if (next && !endDate && date) setEndDate(addDays(date, 1))
              }}
              label="Dura más de un día"
              description="Festivales o eventos de fin de semana."
            />

            {multiDay && (
              <Field id="req-end-date" label="Fecha de fin" required error={shown('endDate')}>
                <DatePickerField
                  id="req-end-date"
                  min={date || today}
                  rangeStart={date || undefined}
                  value={endDate}
                  onChange={setEndDate}
                  onBlur={blur('endDate')}
                  invalid={!!shown('endDate')}
                  describedBy={describedBy('req-end-date', shown('endDate'))}
                />
              </Field>
            )}

            {whenLabel && !errors.date && !errors.endDate && (
              <p
                aria-live="polite"
                className="flex items-center gap-2 rounded-xl bg-[#F4F4F6] px-3.5 py-2.5 text-[13px] text-[#2A2A33]"
              >
                <CalendarClock size={15} className="shrink-0 text-[#6B6B78]" aria-hidden />
                <span>
                  {whenLabel}
                  {schedule?.nextDay && <span className="text-[#8A8A96]"> (termina al día siguiente)</span>}
                </span>
              </p>
            )}
          </Section>

          <Section step={3} title="Tus datos" description="Para que el estacionamiento pueda responderte.">
            <Field id="req-name" label="Tu nombre" required error={shown('organizerName')}>
              <input
                id="req-name"
                type="text"
                autoComplete="name"
                maxLength={150}
                value={organizerName}
                onChange={e => setOrganizerName(e.target.value)}
                onBlur={blur('organizerName')}
                aria-invalid={!!shown('organizerName')}
                aria-describedby={describedBy('req-name', shown('organizerName'))}
                className={cn(inputClass, inputState(!!shown('organizerName')))}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="req-email" label="E-mail" required error={shown('organizerEmail')}>
                <input
                  id="req-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={150}
                  value={organizerEmail}
                  onChange={e => setOrganizerEmail(e.target.value)}
                  onBlur={blur('organizerEmail')}
                  placeholder="nombre@ejemplo.com"
                  aria-invalid={!!shown('organizerEmail')}
                  aria-describedby={describedBy('req-email', shown('organizerEmail'))}
                  className={cn(inputClass, inputState(!!shown('organizerEmail')))}
                />
              </Field>
              <Field id="req-phone" label="Teléfono / WhatsApp" required error={shown('organizerPhone')}>
                <input
                  id="req-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={50}
                  value={organizerPhone}
                  onChange={e => setOrganizerPhone(e.target.value)}
                  onBlur={blur('organizerPhone')}
                  placeholder="+54 9 11 1234 5678"
                  aria-invalid={!!shown('organizerPhone')}
                  aria-describedby={describedBy('req-phone', shown('organizerPhone'))}
                  className={cn(inputClass, inputState(!!shown('organizerPhone')))}
                />
              </Field>
            </div>
          </Section>

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

          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-black/[0.06] bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:rounded-b-3xl sm:border-t sm:bg-[#FAFAFB] sm:px-7 sm:py-5">
            {error && (
              <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
              <p className="hidden text-[12px] text-[#8A8A96] sm:block">
                Usamos tus datos solo para que {parkingName} te responda.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#0A0A0F] px-6 py-3.5 text-[15px] font-semibold text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.99] disabled:opacity-60 sm:w-auto"
              >
                {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </form>

        <div className="lg:hidden">
          <p className="mb-4 text-[14px] font-semibold text-[#0A0A0F]">Cómo sigue</p>
          <NextSteps />
        </div>
      </div>
    </Shell>
  )
}
