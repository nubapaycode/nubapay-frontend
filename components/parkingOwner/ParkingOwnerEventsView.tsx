'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronRight,
  CircleSlash,
  Clock,
  Copy,
  ExternalLink,
  Inbox,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  RotateCw,
  X,
} from 'lucide-react'

import { Modal } from '@/components/ui/Modal'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { getAuthUser } from '@/lib/authSession'
import { eventRequestPath } from '@/lib/buyerRoutes'
import { firstAllowedWorkspaceSegment, workspaceToolsForEvent } from '@/lib/organizerStaffTools'
import {
  type EventSubmission,
  type EventsTab,
  type ParkingOwnerAccount,
  type ParkingOwnerCounts,
  type ParkingOwnerEventItem,
  approveSubmission,
  draftSlug,
  fetchParkingOwnerEvents,
  patchParkingOwnerAccount,
  rejectSubmission,
} from '@/lib/parkingOwner'
import type { OrganizerEventRow } from '@/lib/types/organizer'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

/** Primero los eventos ya aprobados (lo que se gestiona a diario), después las solicitudes pendientes. */
const TABS: { key: EventsTab; label: string; param: string }[] = [
  { key: 'approved', label: 'Aprobados', param: 'aprobados' },
  { key: 'pending', label: 'Pendientes', param: 'pendientes' },
  { key: 'rejected', label: 'Rechazados', param: 'rechazados' },
]

const REJECT_REASONS = ['La fecha ya está ocupada', 'No tenemos capacidad', 'Falta información del evento']

const COPY_ERROR = 'No se pudo copiar. Copiá el enlace manualmente.'

// ── Estilos compartidos ────────────────────────────────────────────────────────

const btnPrimary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50'
const btnSecondary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
const btnGhost =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
const surface = 'rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]'

// ── Fechas ─────────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function fmt(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-AR', opts).format(date).replace(/\./g, '')
}

/** "sáb 20 dic · 20:00 – 23:30", o con las dos fechas si termina otro día. */
export function formatWhen(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return 'Sin fecha definida'
  const s = new Date(startsAt)
  const day = (d: Date) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' })
  const time = (d: Date) => fmt(d, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  if (!endsAt) return `${day(s)} · ${time(s)}`
  const e = new Date(endsAt)
  if (startOfDay(s) === startOfDay(e)) return `${day(s)} · ${time(s)} – ${time(e)}`
  return `${day(s)}, ${time(s)} → ${day(e)}, ${time(e)}`
}

type Timing = { label: string; tone: 'live' | 'soon' | 'future' | 'past' }

/** En qué momento está el evento respecto de hoy. */
export function eventTiming(startsAt: string | null, endsAt: string | null, now = new Date()): Timing | null {
  if (!startsAt) return null
  const s = new Date(startsAt)
  const e = endsAt ? new Date(endsAt) : null
  if (e && s <= now && now <= e) return { label: 'En curso', tone: 'live' }
  const days = Math.round((startOfDay(s) - startOfDay(now)) / DAY_MS)
  if (e ? e < now : days < 0) return { label: 'Finalizado', tone: 'past' }
  if (days === 0) return { label: 'Hoy', tone: 'soon' }
  if (days === 1) return { label: 'Mañana', tone: 'soon' }
  if (days <= 7) return { label: `En ${days} días`, tone: 'soon' }
  if (days <= 60) return { label: `En ${days} días`, tone: 'future' }
  return null
}

/** "hace 3 h", "hace 2 días"… */
function timeAgo(iso: string | null, now = new Date()): string | null {
  if (!iso) return null
  const diff = (new Date(iso).getTime() - now.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 60) return 'recién'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 30 * 86_400) return rtf.format(Math.round(diff / 86_400), 'day')
  return fmt(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' })
}

function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}

function eventPanelHref(event: OrganizerEventRow): string {
  const tools = workspaceToolsForEvent('owner', event.id, getAuthUser()?.staff_memberships)
  return `/eventos/${event.id}/${firstAllowedWorkspaceSegment(tools, event.modules)}`
}

function requestUrl(account: ParkingOwnerAccount): string {
  return `${window.location.origin}${eventRequestPath(account.slug)}`
}

function readTabFromUrl(): EventsTab {
  const v = new URLSearchParams(window.location.search).get('vista')
  return TABS.find(t => t.param === v)?.key ?? TABS[0].key
}

function writeTabToUrl(tab: EventsTab) {
  const p = new URLSearchParams(window.location.search)
  if (tab === TABS[0].key) p.delete('vista')
  else p.set('vista', TABS.find(t => t.key === tab)!.param)
  const qs = p.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
}

// ── Piezas ─────────────────────────────────────────────────────────────────────

/** Bloque de calendario con día y mes: se escanea la lista por fecha de un vistazo. */
function DateTile({ iso, muted }: { iso: string | null; muted?: boolean }) {
  const d = iso ? new Date(iso) : null
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border text-center leading-none',
        muted ? 'border-gray-100 bg-gray-50 text-gray-400' : 'border-gray-200 bg-white text-gray-900',
      )}
    >
      {d ? (
        <>
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide', muted ? 'text-gray-400' : 'text-gray-500')}>
            {fmt(d, { month: 'short' })}
          </span>
          <span className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight">{d.getDate()}</span>
        </>
      ) : (
        <span className="text-[16px] text-gray-300">—</span>
      )}
    </div>
  )
}

function Cover({ src, iso, muted }: { src: string | null; iso: string | null; muted?: boolean }) {
  if (!src) return <DateTile iso={iso} muted={muted} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={cn('size-12 shrink-0 rounded-xl object-cover', muted && 'opacity-60 grayscale')} />
  )
}

function TimingChip({ timing }: { timing: Timing | null }) {
  if (!timing) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
        timing.tone === 'live' && 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
        timing.tone === 'soon' && 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
        timing.tone === 'future' && 'bg-gray-100 text-gray-600',
        timing.tone === 'past' && 'bg-gray-50 text-gray-400',
      )}
    >
      {timing.label}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  if (status === 'draft') return null
  const label = status === 'active' ? 'Activo' : status
  return (
    <span className="whitespace-nowrap text-[12px] font-medium text-gray-600">
      {label}
    </span>
  )
}

/** Interruptor real (con perilla) en vez de un chip que parece un estado. */
function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:opacity-60',
        checked ? 'bg-emerald-500' : 'bg-gray-300',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ── Tarjeta del formulario (columna lateral) ──────────────────────────────────

function RequestFormPanel({
  account,
  onToggle,
  toggling,
  onCopyError,
  onSaved,
}: {
  account: ParkingOwnerAccount
  onToggle: (accepts: boolean) => void
  toggling: boolean
  onCopyError: () => void
  onSaved: (account: ParkingOwnerAccount) => void
}) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [slug, setSlug] = useState(account.slug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const origin = window.location.origin
  const url = requestUrl(account)
  const accepting = account.accepts_event_submissions
  const cleanSlug = slug.replace(/^-+|-+$/g, '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      onCopyError()
    }
  }

  const startEdit = () => {
    setSlug(account.slug)
    setError('')
    setEditing(true)
  }

  const save = async () => {
    if (saving) return
    if (cleanSlug.length < 3) {
      setError('Usá al menos 3 letras o números.')
      return
    }
    if (cleanSlug === account.slug) {
      setEditing(false)
      return
    }
    setSaving(true)
    const r = await patchParkingOwnerAccount({ slug: cleanSlug })
    setSaving(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    if (r.data.slug !== cleanSlug) {
      // Un backend que todavía no admite cambiar el link responde OK sin cambiarlo.
      setError('El link no se pudo cambiar. Revisá que el servidor esté actualizado.')
      return
    }
    onSaved(r.data)
    setEditing(false)
  }

  return (
    <section aria-labelledby="request-form-title" className={cn(surface, 'overflow-hidden')}>
      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="min-w-0">
          <h2 id="request-form-title" className="text-[13px] font-semibold text-gray-900">
            Formulario de solicitudes
          </h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
            {accepting
              ? 'Los organizadores piden su evento desde este link.'
              : 'Pausado: el link avisa que no estás recibiendo pedidos.'}
          </p>
        </div>
        <Switch
          checked={accepting}
          disabled={toggling}
          onChange={onToggle}
          label={accepting ? 'Pausar solicitudes' : 'Recibir solicitudes'}
        />
      </div>

      <div className="border-t border-gray-100 bg-gray-50/60 p-5 pt-4">
        {editing ? (
          <form
            onSubmit={e => {
              e.preventDefault()
              void save()
            }}
          >
            <label htmlFor="request-slug" className="text-[12px] font-medium text-gray-500">
              {origin.replace(/^https?:\/\//, '')}/parking/
            </label>
            <div className="mt-1 flex items-stretch overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10">
              <input
                id="request-slug"
                aria-label="Link para solicitar eventos"
                value={slug}
                maxLength={180}
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={e => {
                  setSlug(draftSlug(e.target.value))
                  setError('')
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') setEditing(false)
                }}
                className="min-w-0 flex-1 px-3 py-2 text-[14px] font-semibold text-gray-900 outline-none"
              />
            </div>
            {error ? (
              <p role="alert" className="mt-1.5 text-[12px] text-red-600">
                {error}
              </p>
            ) : (
              <p className="mt-1.5 text-[12px] text-gray-500">El link anterior deja de funcionar: compartí el nuevo.</p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className={btnGhost} disabled={saving} onClick={() => setEditing(false)}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimary} disabled={saving || cleanSlug.length < 3}>
                {saving && <Spinner size="sm" />}
                Guardar link
              </button>
            </div>
          </form>
        ) : (
          <>
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl border border-gray-200 bg-white py-1.5 pl-3 pr-1.5',
                !accepting && 'opacity-60',
              )}
            >
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-900" title={url}>
                {url.replace(/^https?:\/\//, '')}
              </p>
              <button
                type="button"
                onClick={() => void copy()}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold transition-colors',
                  copied ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-900 text-white hover:bg-gray-800',
                )}
              >
                {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="mt-2 flex gap-1">
              <a href={url} target="_blank" rel="noopener noreferrer" className={cn(btnGhost, 'h-8 px-2.5 text-[12px]')}>
                <ExternalLink size={13} aria-hidden />
                Abrir
              </a>
              <button type="button" onClick={startEdit} className={cn(btnGhost, 'h-8 px-2.5 text-[12px]')}>
                <Pencil size={13} aria-hidden />
                Editar link
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { title: 'Compartí el link', text: 'Mandalo por WhatsApp o mail a los organizadores.' },
    { title: 'Revisá la solicitud', text: 'Te llega con fecha, descripción y datos de contacto.' },
    {
      title: 'Aprobala',
      text: 'Se crea el evento con la tienda, los vehículos, los cobros y el equipo de tu estacionamiento.',
    },
  ]
  return (
    <section className="rounded-2xl border border-gray-200/80 p-5">
      <h2 className="text-[13px] font-semibold text-gray-900">Cómo funciona</h2>
      <ol className="mt-3 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-900">{s.title}</p>
              <p className="text-[12px] leading-relaxed text-gray-500">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ── Filas de la lista ─────────────────────────────────────────────────────────

function ApprovedRow({ item }: { item: ParkingOwnerEventItem }) {
  const event = item.event
  if (!event) return null
  const timing = eventTiming(event.starts_at, event.ends_at)
  const past = timing?.tone === 'past'
  return (
    <li>
      <Link
        href={eventPanelHref(event)}
        className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none sm:px-5"
      >
        <Cover src={event.cover_image_url} iso={event.starts_at} muted={past} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={cn('truncate text-[14px] font-semibold', past ? 'text-gray-500' : 'text-gray-900')}>
              {event.name}
            </h3>
            <TimingChip timing={timing} />
          </div>
          <p className="mt-0.5 truncate text-[12px] text-gray-500">
            {formatWhen(event.starts_at, event.ends_at)}
            {item.submission && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                Organiza {item.submission.organizer_name}
              </>
            )}
          </p>
        </div>
        <span className="hidden sm:block">
          <StatusDot status={event.status} />
        </span>
        <ChevronRight
          size={16}
          className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
          aria-hidden
        />
      </Link>
    </li>
  )
}

function ContactLinks({ submission }: { submission: EventSubmission }) {
  const wa = whatsappHref(submission.organizer_phone)
  const link =
    'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'
  return (
    <div className="-mx-2 flex flex-wrap items-center gap-y-0.5">
      <span className="px-2 text-[12px] font-semibold text-gray-900">{submission.organizer_name}</span>
      <a href={`mailto:${submission.organizer_email}`} className={link}>
        <Mail size={13} aria-hidden />
        <span className="max-w-[220px] truncate">{submission.organizer_email}</span>
      </a>
      <a href={`tel:${submission.organizer_phone}`} className={link}>
        <Phone size={13} aria-hidden />
        {submission.organizer_phone}
      </a>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={link}>
          <MessageCircle size={13} aria-hidden />
          WhatsApp
        </a>
      )}
    </div>
  )
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 180 || text.split('\n').length > 3
  return (
    <div className="mt-2">
      <p className={cn('whitespace-pre-line text-[13px] leading-relaxed text-gray-600', !open && 'line-clamp-3')}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="mt-0.5 text-[12px] font-semibold text-gray-900 hover:underline"
        >
          {open ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  )
}

function PendingRow({
  submission,
  busy,
  onApprove,
  onReject,
}: {
  submission: EventSubmission
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const received = timeAgo(submission.created_at)
  const timing = eventTiming(submission.starts_at, submission.ends_at)
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex gap-4">
        <Cover src={submission.cover_image_url} iso={submission.starts_at} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[14px] font-semibold text-gray-900">{submission.event_name}</h3>
            <TimingChip timing={timing} />
          </div>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {formatWhen(submission.starts_at, submission.ends_at)}
            {received && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                Recibida {received}
              </>
            )}
          </p>
          {submission.description && <Description text={submission.description} />}
          <div className="mt-3">
            <ContactLinks submission={submission} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:pl-16">
        <button type="button" className={btnSecondary} disabled={busy} onClick={onReject}>
          Rechazar
        </button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={onApprove}>
          {busy ? <Spinner size="sm" /> : <Check size={15} aria-hidden />}
          Aprobar
        </button>
      </div>
    </li>
  )
}

function RejectedRow({ submission }: { submission: EventSubmission }) {
  const reviewed = timeAgo(submission.reviewed_at)
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex gap-4">
        <Cover src={submission.cover_image_url} iso={submission.starts_at} muted />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-gray-600">{submission.event_name}</h3>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {formatWhen(submission.starts_at, submission.ends_at)}
            {reviewed && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                Rechazada {reviewed}
              </>
            )}
          </p>
          {submission.reject_reason && (
            <p className="mt-2 border-l-2 border-gray-200 pl-2.5 text-[13px] text-gray-600">
              Motivo: {submission.reject_reason}
            </p>
          )}
          <div className="mt-2.5">
            <ContactLinks submission={submission} />
          </div>
        </div>
      </div>
    </li>
  )
}

function ListSkeleton() {
  return (
    <ul aria-hidden className="divide-y divide-gray-100">
      {[0, 1, 2].map(i => (
        <li key={i} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
          <span className="size-12 shrink-0 animate-pulse rounded-xl bg-gray-100" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-2/5 animate-pulse rounded bg-gray-100" />
            <span className="block h-3 w-3/5 animate-pulse rounded bg-gray-100" />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Estado vacío de cada pestaña: qué significa y qué hacer para que se llene. */
function EventsEmptyState({
  tab,
  account,
  pendingCount,
  onShowPending,
  onCopied,
}: {
  tab: EventsTab
  account: ParkingOwnerAccount
  pendingCount: number
  onShowPending: () => void
  onCopied: (ok: boolean) => void
}) {
  const url = requestUrl(account)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      onCopied(true)
    } catch {
      onCopied(false)
    }
  }

  const content = {
    approved: {
      Icon: CalendarCheck,
      title: 'Todavía no hay eventos aprobados',
      text: 'Cuando apruebes una solicitud, el evento aparece acá listo para vender y gestionar.',
    },
    pending: {
      Icon: Inbox,
      title: 'No hay solicitudes pendientes',
      text: account.accepts_event_submissions
        ? 'Compartí el link del formulario con los organizadores: cada pedido de evento llega acá para que lo revises.'
        : 'Las solicitudes están pausadas. Activalas en el formulario de solicitudes para volver a recibirlas.',
    },
    rejected: {
      Icon: CircleSlash,
      title: 'No rechazaste ninguna solicitud',
      text: 'Las solicitudes que rechaces quedan acá como registro, con el motivo si lo dejaste.',
    },
  }[tab]

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500" aria-hidden>
        <content.Icon size={22} strokeWidth={1.75} />
      </span>
      <p className="text-[15px] font-semibold tracking-tight text-gray-900">{content.title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-gray-500">{content.text}</p>

      {tab === 'approved' && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {pendingCount > 0 ? (
            <button type="button" onClick={onShowPending} className={btnPrimary}>
              Ver solicitudes pendientes ({pendingCount})
            </button>
          ) : (
            <button type="button" onClick={() => void copy()} className={btnPrimary}>
              <Copy size={14} aria-hidden />
              Copiar link del formulario
            </button>
          )}
        </div>
      )}
      {tab === 'pending' && account.accepts_event_submissions && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => void copy()} className={btnPrimary}>
            <Copy size={14} aria-hidden />
            Copiar link
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
            <ExternalLink size={14} aria-hidden />
            Ver formulario
          </a>
        </div>
      )}
    </div>
  )
}

// ── Vista ─────────────────────────────────────────────────────────────────────

export function ParkingOwnerEventsView() {
  const { account, setAccount } = useParkingOwnerAccount()
  // La vista solo se monta en el cliente (detrás del guard), así que se puede leer la URL al iniciar.
  const [tab, setTab] = useState<EventsTab>(readTabFromUrl)
  const [page, setPage] = useState(1)
  // El resultado guarda la consulta que lo produjo: si no coincide con la actual, sigue cargando.
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState<
    { key: string; items: ParkingOwnerEventItem[]; total: number; error: string } | null
  >(null)
  const [counts, setCounts] = useState<ParkingOwnerCounts>(account.counts)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [rejecting, setRejecting] = useState<EventSubmission | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [justApproved, setJustApproved] = useState<OrganizerEventRow | null>(null)
  const { show, ToastPortal } = useToast()

  const queryKey = `${tab}:${page}:${reloadToken}`
  useEffect(() => {
    let cancelled = false
    void fetchParkingOwnerEvents(tab, page, PAGE_SIZE).then(r => {
      if (cancelled) return
      if (r.ok) {
        setResult({ key: queryKey, items: r.data.items, total: r.data.pagination.total, error: '' })
        setCounts(r.data.counts)
      } else {
        setResult({ key: queryKey, items: [], total: 0, error: r.error })
      }
    })
    return () => {
      cancelled = true
    }
  }, [tab, page, queryKey])

  const reload = () => setReloadToken(n => n + 1)
  const loaded = result?.key === queryKey
  const items = loaded ? result.items : []
  const total = loaded ? result.total : 0
  const listError = loaded ? result.error : ''

  const changeTab = (next: EventsTab) => {
    if (next === tab) return
    setTab(next)
    setPage(1)
    writeTabToUrl(next)
  }

  const toggleAccepting = async (accepts: boolean) => {
    setToggling(true)
    const r = await patchParkingOwnerAccount({ accepts_event_submissions: accepts })
    setToggling(false)
    if (r.ok) {
      setAccount(r.data)
      show(accepts ? 'Volviste a recibir solicitudes.' : 'Solicitudes pausadas.', 'success')
    } else show(r.error, 'error')
  }

  const approve = async (s: EventSubmission) => {
    setBusyId(s.id)
    const r = await approveSubmission(s.id)
    setBusyId(null)
    if (r.ok) setJustApproved(r.data.event)
    else show(r.error, 'error')
    // También tras un error: un 409 significa que la solicitud ya estaba resuelta y hay que refrescar.
    reload()
  }

  const closeReject = () => {
    setRejecting(null)
    setRejectReason('')
  }

  const confirmReject = async () => {
    if (!rejecting) return
    setBusyId(rejecting.id)
    const r = await rejectSubmission(rejecting.id, rejectReason.trim())
    setBusyId(null)
    if (r.ok) show('Solicitud rechazada.', 'success')
    else show(r.error, 'error')
    closeReject()
    reload()
  }

  const showPendingNudge = counts.pending > 0 && tab !== 'pending'

  return (
    <div>
      <OrganizerToolHeading
        title="Eventos"
        description="Los organizadores piden su evento con el formulario; vos lo aprobás y se crea para gestionarlo."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {showPendingNudge && (
            <button
              type="button"
              onClick={() => changeTab('pending')}
              className="group flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-left transition-colors hover:bg-amber-50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700" aria-hidden>
                <Clock size={16} />
              </span>
              <span className="min-w-0 flex-1 text-[13px] text-amber-900">
                <span className="font-semibold">
                  {counts.pending === 1 ? '1 solicitud espera' : `${counts.pending} solicitudes esperan`} tu revisión
                </span>
                <span className="hidden text-amber-800/80 sm:inline"> · los organizadores no pueden vender hasta que las apruebes</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-amber-900">
                Revisar
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </button>
          )}

          {justApproved && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700" aria-hidden>
                <Check size={16} />
              </span>
              <p className="min-w-0 flex-1 text-[13px] text-emerald-900">
                <span className="font-semibold">&ldquo;{justApproved.name}&rdquo; aprobado:</span> ya podés gestionarlo en
                Aprobados.
              </p>
              <Link
                href={eventPanelHref(justApproved)}
                className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-emerald-900 hover:underline"
              >
                Abrir evento
                <ArrowRight size={14} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => setJustApproved(null)}
                aria-label="Cerrar aviso"
                className="rounded-lg p-1 text-emerald-700/70 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          )}

          <section className={cn(surface, 'overflow-hidden')}>
            <div className="border-b border-gray-100 px-3 pt-3 sm:px-4">
              <div role="tablist" aria-label="Estado de los eventos" className="flex gap-1 overflow-x-auto">
                {TABS.map(t => {
                  const selected = tab === t.key
                  const attention = t.key === 'pending' && counts.pending > 0
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      type="button"
                      aria-selected={selected}
                      onClick={() => changeTab(t.key)}
                      className={cn(
                        '-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-2.5 pb-2.5 pt-1 text-[13px] font-semibold transition-colors',
                        selected ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800',
                      )}
                    >
                      {t.label}
                      <span
                        className={cn(
                          'min-w-[20px] rounded-full px-1.5 py-px text-center text-[11px] tabular-nums',
                          attention
                            ? 'bg-amber-100 text-amber-800'
                            : selected
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {counts[t.key]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {listError && (
              <div role="alert" className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-4 py-3 sm:px-5">
                <p className="min-w-0 flex-1 text-[13px] text-red-700">{listError}</p>
                <button
                  type="button"
                  onClick={reload}
                  className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-red-700 hover:underline"
                >
                  <RotateCw size={13} aria-hidden />
                  Reintentar
                </button>
              </div>
            )}

            {!loaded ? (
              <ListSkeleton />
            ) : items.length === 0 ? (
              listError ? null : (
                <EventsEmptyState
                  tab={tab}
                  account={account}
                  pendingCount={counts.pending}
                  onShowPending={() => changeTab('pending')}
                  onCopied={ok => show(ok ? 'Link copiado.' : COPY_ERROR, ok ? 'success' : 'error')}
                />
              )
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map(item => {
                  if (tab === 'approved') return <ApprovedRow key={item.event?.id} item={item} />
                  const s = item.submission
                  if (!s) return null
                  return tab === 'pending' ? (
                    <PendingRow
                      key={s.id}
                      submission={s}
                      busy={busyId === s.id}
                      onApprove={() => void approve(s)}
                      onReject={() => setRejecting(s)}
                    />
                  ) : (
                    <RejectedRow key={s.id} submission={s} />
                  )
                })}
              </ul>
            )}
          </section>

          {total > PAGE_SIZE && <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <RequestFormPanel
            account={account}
            toggling={toggling}
            onToggle={accepts => void toggleAccepting(accepts)}
            onCopyError={() => show(COPY_ERROR, 'error')}
            onSaved={next => {
              setAccount(next)
              show('Link actualizado.', 'success')
            }}
          />
          <HowItWorks />
        </aside>
      </div>

      <Modal
        isOpen={!!rejecting}
        onClose={() => {
          if (!busyId) closeReject()
        }}
        title="Rechazar solicitud"
      >
        <p className="mb-3 text-[13px] text-gray-600">
          {rejecting ? `Vas a rechazar "${rejecting.event_name}". Podés dejar un motivo para tu registro.` : ''}
        </p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {REJECT_REASONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRejectReason(r)}
              aria-pressed={rejectReason === r}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors',
                rejectReason === r
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Motivo (opcional)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} disabled={!!busyId} onClick={closeReject}>
            Cancelar
          </button>
          <button
            type="button"
            className={cn(btnPrimary, 'bg-red-600 hover:bg-red-700')}
            disabled={!!busyId}
            onClick={() => void confirmReject()}
          >
            {busyId && <Spinner size="sm" />}
            Rechazar
          </button>
        </div>
      </Modal>
      <ToastPortal />
    </div>
  )
}
