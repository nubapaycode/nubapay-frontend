'use client'

import { Bike, Car, Crown, Motorbike, Plus, Ticket, Timer, Van } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Money, formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import { ParkingMapsCard } from '@/components/organizer/tickets/ParkingMapsCard'
import { ShareLinkCard } from '@/components/organizer/tickets/ShareLinkCard'
import { TicketCard } from '@/components/organizer/tickets/TicketCard'
import {
  EMPTY_TICKET_FORM,
  TicketFormModal,
  type TicketFormState,
  type TicketPayload,
} from '@/components/organizer/tickets/TicketFormModal'
import { Modal } from '@/components/ui/Modal'
import { parkingPath, ticketsPath } from '@/lib/buyerRoutes'
import { usePublicOrigin } from '@/lib/hooks/usePublicOrigin'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'
import {
  createTicket,
  deleteTicket,
  fetchTickets,
  patchTicket,
  reorderTickets,
  type TicketKind,
  type WorkspaceTicket,
} from '@/lib/organizerWorkspace'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { cn } from '@/lib/utils'

type Template = { label: string; icon: React.ReactNode; form: Partial<TicketFormState> }

/** Plantillas del estado vacío: abren el formulario con el nombre (y descripción) ya puestos. */
const TEMPLATES: Record<TicketKind, Template[]> = {
  ticket: [
    { label: 'Entrada general', icon: <Ticket size={15} strokeWidth={1.75} />, form: { name: 'Entrada general' } },
    { label: 'Anticipada', icon: <Timer size={15} strokeWidth={1.75} />, form: { name: 'Anticipada', description: 'Precio especial por tiempo limitado' } },
    { label: 'VIP', icon: <Crown size={15} strokeWidth={1.75} />, form: { name: 'VIP', description: 'Acceso preferencial' } },
  ],
  parking: [
    { label: 'Auto', icon: <Car size={15} strokeWidth={1.75} />, form: { name: 'Auto', icon: 'car' } },
    { label: 'Moto', icon: <Motorbike size={15} strokeWidth={1.75} />, form: { name: 'Moto', icon: 'motorcycle' } },
    { label: 'Camioneta', icon: <Van size={15} strokeWidth={1.75} />, form: { name: 'Camioneta', icon: 'van' } },
    { label: 'Bicicleta', icon: <Bike size={15} strokeWidth={1.75} />, form: { name: 'Bicicleta', icon: 'bicycle' } },
  ],
}

/** Textos de cada herramienta: Tickets y Parking comparten la pantalla. */
const COPY: Record<
  TicketKind,
  {
    title: string
    intro: string
    newButton: string
    loading: string
    emptyTitle: string
    emptyHint: string
    createLink: string
    deleteTitle: string
    shareLabel: string
    sold: string
    unit: string
  }
> = {
  ticket: {
    title: 'Tickets',
    intro:
      'Entradas con cupo y precio propios. Se venden en su propio link y aparecen en el catálogo como una sección aparte.',
    newButton: 'Nuevo ticket',
    loading: 'Cargando tickets…',
    emptyTitle: 'Todavía no hay tickets',
    emptyHint: 'Empezá con una plantilla y ajustá el precio y el cupo.',
    createLink: 'Crear ticket',
    deleteTitle: 'Eliminar ticket',
    shareLabel: 'Link para vender tickets',
    sold: 'vendidos',
    unit: 'ticket',
  },
  parking: {
    title: 'Parking',
    intro:
      'Tipos de vehículo con su precio y lugares. Se venden en su propio link, con un mapa de dónde queda el estacionamiento.',
    newButton: 'Nuevo vehículo',
    loading: 'Cargando parking…',
    emptyTitle: 'Todavía no hay vehículos',
    emptyHint: 'Empezá con un tipo de vehículo y ajustá el precio y los lugares.',
    createLink: 'Crear vehículo',
    deleteTitle: 'Eliminar vehículo',
    shareLabel: 'Link para vender parking',
    sold: 'vendidos',
    unit: 'vehículo',
  },
}

function TicketsSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true">
      <p className="sr-only">{label}</p>
      <div className="mb-6 h-[72px] animate-pulse rounded-2xl bg-gray-100" />
      <div className="grid gap-3 xl:grid-cols-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-[148px] animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

export function TicketsView({ eventId, kind = 'ticket' }: { eventId: string; kind?: TicketKind }) {
  const copy = COPY[kind]
  const isParking = kind === 'parking'
  const [tickets, setTickets] = useState<WorkspaceTicket[]>([])
  const [eventSlug, setEventSlug] = useState('')
  const [hasCover, setHasCover] = useState(true)
  const [mapsUrl, setMapsUrl] = useState<string | null>(null)
  const [mapsResolved, setMapsResolved] = useState<string | null>(null)
  const origin = usePublicOrigin()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WorkspaceTicket | null>(null)
  const [formInitial, setFormInitial] = useState<TicketFormState>(EMPTY_TICKET_FORM)

  const [deleteTarget, setDeleteTarget] = useState<WorkspaceTicket | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [togglePending, setTogglePending] = useState<Set<string>>(() => new Set())

  const [dragId, setDragId] = useState<string | null>(null)
  const dragOrderBefore = useRef<WorkspaceTicket[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchOrganizerEventDetail(eventId).then(res => {
      if (cancelled || !res.ok) return
      setEventSlug(res.event.slug)
      setHasCover(Boolean(res.event.cover_image_url))
      setMapsUrl(res.event.parking_maps_url ?? null)
      setMapsResolved(res.event.parking_maps_resolved_url ?? null)
    })
    void fetchTickets(eventId, kind).then(res => {
      if (cancelled) return
      if (!res.ok) setError(res.error)
      else setTickets(res.tickets)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [eventId, kind])

  const openCreate = (preset: Partial<TicketFormState> = {}) => {
    setEditing(null)
    setFormInitial({ ...EMPTY_TICKET_FORM, ...preset })
    setFormOpen(true)
  }

  const openEdit = (t: WorkspaceTicket) => {
    setEditing(t)
    setFormInitial({
      name: t.name,
      description: t.description,
      price: String(t.price),
      stock: t.stock == null ? '' : String(t.stock),
      icon: t.icon ?? EMPTY_TICKET_FORM.icon,
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const saveTicket = async (payload: TicketPayload): Promise<string | null> => {
    const res = editing ? await patchTicket(eventId, editing.id, payload) : await createTicket(eventId, { ...payload, kind })
    if (!res.ok) return res.error
    setTickets(list => (editing ? list.map(x => (x.id === res.ticket.id ? res.ticket : x)) : [...list, res.ticket]))
    closeForm()
    return null
  }

  const duplicate = async (t: WorkspaceTicket) => {
    const res = await createTicket(eventId, {
      name: `${t.name} (copia)`.slice(0, 150),
      description: t.description,
      price: t.price,
      stock: t.stock,
      is_active: false,
      kind,
      ...(isParking ? { icon: t.icon ?? EMPTY_TICKET_FORM.icon } : {}),
    })
    if (!res.ok) setError(res.error)
    else setTickets(list => [...list, res.ticket])
  }

  const toggleActive = async (t: WorkspaceTicket) => {
    if (togglePending.has(t.id)) return
    const next = !t.is_active
    setTogglePending(s => new Set(s).add(t.id))
    setTickets(list => list.map(x => (x.id === t.id ? { ...x, is_active: next } : x)))
    const res = await patchTicket(eventId, t.id, { is_active: next })
    if (!res.ok) {
      setTickets(list => list.map(x => (x.id === t.id ? { ...x, is_active: t.is_active } : x)))
      setError(res.error)
    } else {
      setTickets(list => list.map(x => (x.id === t.id ? res.ticket : x)))
    }
    setTogglePending(s => {
      const n = new Set(s)
      n.delete(t.id)
      return n
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteSubmitting) return
    setDeleteSubmitting(true)
    const res = await deleteTicket(eventId, deleteTarget.id)
    setDeleteSubmitting(false)
    if (!res.ok) setError(res.error)
    else setTickets(prev => prev.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  /** Guarda un orden nuevo; si falla, vuelve al anterior. */
  const persistOrder = async (next: WorkspaceTicket[], previous: WorkspaceTicket[]) => {
    setTickets(next)
    const res = await reorderTickets(eventId, next.map(t => t.id), kind)
    if (!res.ok) {
      setTickets(previous)
      setError(res.error)
    }
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= tickets.length) return
    const next = [...tickets]
    ;[next[index], next[target]] = [next[target], next[index]]
    void persistOrder(next, tickets)
  }

  const totals = useMemo(() => {
    const sold = tickets.reduce((a, t) => a + t.sold, 0)
    const revenue = tickets.reduce((a, t) => a + (t.revenue ?? 0), 0)
    const redeemed = tickets.reduce((a, t) => a + (t.redeemed ?? 0), 0)
    const limited = tickets.length > 0 && tickets.every(t => t.stock != null)
    const capacity = limited ? tickets.reduce((a, t) => a + (t.stock ?? 0), 0) : null
    return { sold, revenue, redeemed, capacity }
  }, [tickets])

  const publicUrl = eventSlug && origin ? `${origin}${(isParking ? parkingPath : ticketsPath)(eventSlug)}` : ''

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1180px]">
      <style>{`
        @keyframes nb-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes nb-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes nb-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .nb-rise { animation: nb-rise 420ms cubic-bezier(0.22,1,0.36,1) both; }
        .nb-pop { animation: nb-pop 160ms ease-out both; transform-origin: top right; }
        .nb-grow { transform-origin: left; animation: nb-grow 700ms cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .nb-rise, .nb-pop, .nb-grow { animation: none; } }
      `}</style>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[620px]">
          <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">{copy.title}</h1>
          <p className="mt-1 text-[13px] text-gray-500">{copy.intro}</p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          style={organizerAccentFilledButtonStyle()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[14px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition-[filter] hover:brightness-95"
        >
          <Plus size={16} strokeWidth={2.25} aria-hidden />
          {copy.newButton}
        </button>
      </header>

      {loading ? (
        <TicketsSkeleton label={copy.loading} />
      ) : (
        <>
          {publicUrl && (
            <ShareLinkCard
              url={publicUrl}
              hasCover={hasCover}
              label={copy.shareLabel}
              fileName={`${isParking ? 'parking' : 'tickets'}-${eventSlug}`}
              onError={setError}
            />
          )}

          {isParking && (
            <ParkingMapsCard
              eventId={eventId}
              initialUrl={mapsUrl}
              initialResolvedUrl={mapsResolved}
              onSaved={(url, resolved) => {
                setMapsUrl(url)
                setMapsResolved(resolved)
              }}
              onError={setError}
            />
          )}

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">
              {error}
            </div>
          )}

          {tickets.length === 0 ? (
            <div className="nb-rise rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-5 flex h-14 w-24 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 [mask:radial-gradient(circle_at_50%_0,transparent_7px,#000_7.5px)_top/100%_51%_no-repeat,radial-gradient(circle_at_50%_100%,transparent_7px,#000_7.5px)_bottom/100%_51%_no-repeat]">
                {isParking ? (
                  <Car size={22} strokeWidth={1.5} className="text-gray-400" aria-hidden />
                ) : (
                  <Ticket size={22} strokeWidth={1.5} className="text-gray-400" aria-hidden />
                )}
              </div>
              <p className="text-[16px] font-semibold text-gray-900">{copy.emptyTitle}</p>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500">{copy.emptyHint}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {TEMPLATES[kind].map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => openCreate(t.form)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,color,transform] hover:-translate-y-px hover:border-gray-300 hover:text-gray-900"
                  >
                    <span className="text-gray-400">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openCreate()}
                className="mt-4 text-[13px] font-medium text-gray-500 underline-offset-4 transition-colors hover:text-gray-900 hover:underline"
              >
                {copy.createLink}
              </button>
            </div>
          ) : (
            <>
              {/* Totales de todos los tickets */}
              <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-[13px] text-gray-500">
                <span>
                  <span className="font-semibold tabular-nums text-gray-900">{formatCount(totals.sold)}</span>
                  {totals.capacity != null && <span className="tabular-nums"> de {formatCount(totals.capacity)}</span>} {copy.sold}
                </span>
                <span>
                  <Money value={totals.revenue} className="font-semibold tabular-nums text-gray-900" /> recaudado
                </span>
                <span>
                  <span className="font-semibold tabular-nums text-gray-900">{formatCount(totals.redeemed)}</span> ingresaron
                </span>
                {tickets.length > 1 && (
                  <span className="ml-auto hidden text-[11px] text-gray-400 md:inline">Arrastrá para cambiar el orden en que se muestran</span>
                )}
              </div>

              <ul className="grid gap-3 xl:grid-cols-2">
                {tickets.map((t, i) => (
                  <li
                    key={t.id}
                    className={cn('nb-rise', dragId && dragId !== t.id && 'transition-transform')}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onDragOver={e => {
                      if (!dragId || dragId === t.id) return
                      e.preventDefault()
                      // Reordena en vivo mientras se arrastra; se guarda al soltar.
                      setTickets(list => {
                        const from = list.findIndex(x => x.id === dragId)
                        const to = list.findIndex(x => x.id === t.id)
                        if (from < 0 || to < 0 || from === to) return list
                        const next = [...list]
                        const [moved] = next.splice(from, 1)
                        next.splice(to, 0, moved)
                        return next
                      })
                    }}
                    onDrop={e => e.preventDefault()}
                  >
                    <TicketCard
                      ticket={t}
                      dragging={dragId === t.id}
                      dragHandleProps={
                        tickets.length > 1
                          ? {
                              draggable: true,
                              onDragStart: e => {
                                e.dataTransfer.effectAllowed = 'move'
                                dragOrderBefore.current = tickets
                                setDragId(t.id)
                              },
                              onDragEnd: () => {
                                const before = dragOrderBefore.current
                                setDragId(null)
                                dragOrderBefore.current = null
                                if (before && before.map(x => x.id).join() !== tickets.map(x => x.id).join()) {
                                  void persistOrder(tickets, before)
                                }
                              },
                            }
                          : undefined
                      }
                      actions={{
                        toggling: togglePending.has(t.id),
                        onToggle: () => void toggleActive(t),
                        onEdit: () => openEdit(t),
                        onDuplicate: () => void duplicate(t),
                        onMoveUp: i > 0 ? () => move(i, -1) : undefined,
                        onMoveDown: i < tickets.length - 1 ? () => move(i, 1) : undefined,
                        onDelete: () => setDeleteTarget(t),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <TicketFormModal open={formOpen} kind={kind} editing={editing} initial={formInitial} onClose={closeForm} onSubmit={saveTicket} />

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title={copy.deleteTitle}>
        <p className="text-[14px] text-gray-600">
          ¿Eliminar “{deleteTarget?.name}”? Los pedidos que ya lo compraron no se modifican.
        </p>
        {deleteTarget && deleteTarget.sold > 0 && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
            Ya se vendieron {formatCount(deleteTarget.sold)}. Si solo querés frenar la venta, pausalo en vez de eliminarlo.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-xl px-4 py-2 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleteSubmitting}
            className="rounded-xl bg-red-600 px-5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleteSubmitting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
