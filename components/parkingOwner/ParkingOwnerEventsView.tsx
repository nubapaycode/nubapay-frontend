'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Calendar, Check, Copy, ExternalLink, Mail, Pencil, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
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
import { cn, formatDate } from '@/lib/utils'

const PAGE_SIZE = 20

const TABS: { key: EventsTab; label: string; empty: string }[] = [
  { key: 'pending', label: 'Pendientes', empty: 'No hay solicitudes pendientes. Compartí el link para recibirlas.' },
  { key: 'approved', label: 'Aprobados', empty: 'Todavía no aprobaste ningún evento.' },
  { key: 'rejected', label: 'Rechazados', empty: 'No rechazaste ninguna solicitud.' },
]

function eventPanelHref(event: OrganizerEventRow): string {
  const tools = workspaceToolsForEvent('owner', event.id, getAuthUser()?.staff_memberships)
  return `/eventos/${event.id}/${firstAllowedWorkspaceSegment(tools, event.modules)}`
}

function dateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return 'Sin fecha'
  return endsAt ? `${formatDate(startsAt)} – ${formatDate(endsAt)}` : formatDate(startsAt)
}

function RequestLinkCard({
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
  const url = `${origin}${eventRequestPath(account.slug)}`
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

  const chip =
    'inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50'

  return (
    <section className="mb-6 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="text-[12px] font-semibold text-gray-500">Link para que los organizadores pidan su evento</p>
      {editing ? (
        <form
          className="mt-2"
          onSubmit={e => {
            e.preventDefault()
            void save()
          }}
        >
          <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-200 focus-within:border-gray-400">
            <span className="hidden shrink-0 items-center bg-gray-50 px-3 text-[13px] text-gray-400 sm:flex">
              {origin.replace(/^https?:\/\//, '')}/parking/
            </span>
            <input
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
            <span className="hidden shrink-0 items-center bg-gray-50 px-3 text-[13px] text-gray-400 sm:flex">
              /solicitar-evento
            </span>
          </div>
          {error ? (
            <p role="alert" className="mt-1.5 text-[12px] text-red-600">
              {error}
            </p>
          ) : (
            <p className="mt-1.5 text-[12px] text-gray-500">El link anterior deja de funcionar: compartí el nuevo.</p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={saving} disabled={cleanSlug.length < 3}>
              Guardar link
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-0.5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p
            className={cn('min-w-0 flex-1 truncate text-[14px] font-semibold', accepting ? 'text-gray-900' : 'text-gray-400')}
            title={url}
          >
            {url.replace(/^https?:\/\//, '')}
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <button type="button" onClick={startEdit} className={chip}>
              <Pencil size={14} aria-hidden />
              Editar
            </button>
            <button type="button" onClick={() => void copy()} className={chip}>
              {copied ? <Check size={14} className="text-emerald-600" aria-hidden /> : <Copy size={14} aria-hidden />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className={chip}>
              <ExternalLink size={14} aria-hidden />
              Abrir
            </a>
            <button
              type="button"
              role="switch"
              aria-checked={accepting}
              disabled={toggling}
              onClick={() => onToggle(!accepting)}
              className={cn(
                'inline-flex h-8 items-center rounded-lg border px-2.5 text-[12px] font-semibold transition-colors disabled:opacity-60',
                accepting
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
              )}
            >
              {accepting ? 'Recibiendo solicitudes' : 'Solicitudes pausadas'}
            </button>
          </div>
        </div>
      )}
      {!accepting && !editing && (
        <p className="mt-2 text-[12px] text-gray-500">El link muestra que no estás recibiendo solicitudes hasta que lo vuelvas a activar.</p>
      )}
    </section>
  )
}

function SubmissionCard({
  submission,
  busy,
  onApprove,
  onReject,
}: {
  submission: EventSubmission
  busy: boolean
  onApprove?: () => void
  onReject?: () => void
}) {
  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex gap-4">
        {submission.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={submission.cover_image_url}
            alt=""
            className="hidden h-24 w-24 shrink-0 rounded-xl object-cover sm:block"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-gray-900">{submission.event_name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-gray-500">
            <Calendar size={13} aria-hidden />
            {dateRange(submission.starts_at, submission.ends_at)}
          </p>
          {submission.description && (
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-[13px] text-gray-600">{submission.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-700">
            <span className="font-semibold">{submission.organizer_name}</span>
            <a href={`mailto:${submission.organizer_email}`} className="inline-flex items-center gap-1 hover:underline">
              <Mail size={13} aria-hidden />
              {submission.organizer_email}
            </a>
            <a href={`tel:${submission.organizer_phone}`} className="inline-flex items-center gap-1 hover:underline">
              <Phone size={13} aria-hidden />
              {submission.organizer_phone}
            </a>
          </div>
          {submission.status === 'rejected' && submission.reject_reason && (
            <p className="mt-2 text-[12px] text-gray-500">Motivo: {submission.reject_reason}</p>
          )}
        </div>
      </div>
      {(onApprove || onReject) && (
        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Button variant="ghost" size="sm" disabled={busy} onClick={onReject}>
            Rechazar
          </Button>
          <Button size="sm" loading={busy} onClick={onApprove}>
            Aprobar
          </Button>
        </div>
      )}
    </article>
  )
}

function ApprovedCard({ item }: { item: ParkingOwnerEventItem }) {
  const event = item.event
  if (!event) return null
  return (
    <Link
      href={eventPanelHref(event)}
      className="block rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-gray-900">{event.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-gray-500">
            <Calendar size={13} aria-hidden />
            {dateRange(event.starts_at, event.ends_at)}
          </p>
          {item.submission && (
            <p className="mt-2 text-[12px] text-gray-500">
              Organiza {item.submission.organizer_name} · {item.submission.organizer_email}
            </p>
          )}
        </div>
        <Badge variant={event.status === 'active' ? 'success' : 'default'}>
          {event.status === 'active' ? 'Activo' : event.status === 'draft' ? 'Borrador' : event.status}
        </Badge>
      </div>
    </Link>
  )
}

export function ParkingOwnerEventsView() {
  const { account, setAccount } = useParkingOwnerAccount()
  const [tab, setTab] = useState<EventsTab>('pending')
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
  const loading = !loaded
  const items = loaded ? result.items : []
  const total = loaded ? result.total : 0
  const listError = loaded ? result.error : ''

  const changeTab = (next: EventsTab) => {
    if (next === tab) return
    setTab(next)
    setPage(1)
  }

  const toggleAccepting = async (accepts: boolean) => {
    setToggling(true)
    const r = await patchParkingOwnerAccount({ accepts_event_submissions: accepts })
    setToggling(false)
    if (r.ok) setAccount(r.data)
    else show(r.error, 'error')
  }

  const approve = async (s: EventSubmission) => {
    setBusyId(s.id)
    const r = await approveSubmission(s.id)
    setBusyId(null)
    if (r.ok) {
      show(`"${r.data.event.name}" aprobado: ya podés gestionarlo en Aprobados.`, 'success')
    } else {
      show(r.error, 'error')
    }
    // También tras un error: un 409 significa que la solicitud ya estaba resuelta y hay que refrescar.
    reload()
  }

  const confirmReject = async () => {
    if (!rejecting) return
    setBusyId(rejecting.id)
    const r = await rejectSubmission(rejecting.id, rejectReason.trim())
    setBusyId(null)
    if (r.ok) show('Solicitud rechazada.', 'success')
    else show(r.error, 'error')
    setRejecting(null)
    setRejectReason('')
    reload()
  }

  const current = TABS.find(t => t.key === tab)!

  return (
    <div>
      <OrganizerToolHeading
        title="Eventos"
        description="Los organizadores piden su evento con el formulario; vos lo aprobás y se crea para gestionarlo."
      />

      <RequestLinkCard
        account={account}
        toggling={toggling}
        onToggle={accepts => void toggleAccepting(accepts)}
        onCopyError={() => show('No se pudo copiar. Copiá el enlace manualmente.', 'error')}
        onSaved={next => {
          setAccount(next)
          show('Link actualizado.', 'success')
        }}
      />

      <div role="tablist" aria-label="Estado de los eventos" className="mb-4 flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => changeTab(t.key)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition-colors',
              tab === t.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {t.label}
            <span className="ml-1.5 text-gray-400">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {listError && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {listError}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-gray-900" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-[13px] text-gray-500">
          {current.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map(item =>
            tab === 'approved' ? (
              <ApprovedCard key={item.event?.id} item={item} />
            ) : item.submission ? (
              <SubmissionCard
                key={item.submission.id}
                submission={item.submission}
                busy={busyId === item.submission.id}
                onApprove={tab === 'pending' ? () => void approve(item.submission!) : undefined}
                onReject={tab === 'pending' ? () => setRejecting(item.submission) : undefined}
              />
            ) : null,
          )}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-4">
          <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      <Modal
        isOpen={!!rejecting}
        onClose={() => {
          if (busyId) return
          setRejecting(null)
          setRejectReason('')
        }}
        title="Rechazar solicitud"
      >
        <p className="mb-3 text-[13px] text-gray-600">
          {rejecting ? `Vas a rechazar "${rejecting.event_name}". Podés dejar un motivo para tu registro.` : ''}
        </p>
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Motivo (opcional)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-gray-400"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!!busyId}
            onClick={() => {
              setRejecting(null)
              setRejectReason('')
            }}
          >
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={!!busyId} onClick={() => void confirmReject()}>
            Rechazar
          </Button>
        </div>
      </Modal>
      <ToastPortal />
    </div>
  )
}
