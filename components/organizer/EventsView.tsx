'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { eventsPaths } from '@/lib/api'
import { authHeadersJson, getAuthUser } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { firstAllowedWorkspaceSegment, workspaceToolsForEvent } from '@/lib/organizerStaffTools'
import type { OrganizerEventRow } from '@/lib/types/organizer'
import { formatDate, formatPrice } from '@/lib/utils'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'

import { OrganizerHubBar } from '@/components/organizer/OrganizerHubBar'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Modal } from '@/components/ui/Modal'

const LIST_PAGE_SIZE = 8

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  padding: '12px 14px',
  fontSize: '14px',
  color: '#0A0A0F',
  background: '#FAFAFA',
  outline: 'none',
  boxSizing: 'border-box',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  closed: 'Cerrado',
  archived: 'Archivado',
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  draft:    { bg: 'rgba(0,0,0,0.05)',          color: '#9A9AA8' },
  active:   { bg: 'rgba(34,197,94,0.1)',       color: '#16A34A' },
  closed:   { bg: 'rgba(239,68,68,0.08)',      color: '#DC2626' },
  archived: { bg: 'rgba(0,0,0,0.05)',          color: '#9A9AA8' },
}

export function EventsView({ embedded = false }: { embedded?: boolean } = {}) {
  const [events, setEvents] = useState<OrganizerEventRow[]>([])
  const [listPage, setListPage] = useState(1)
  const [listPagination, setListPagination] = useState({ page: 1, page_size: LIST_PAGE_SIZE, total: 0 })
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')
  const [canCreateEvents, setCanCreateEvents] = useState(true)
  const [eventToDelete, setEventToDelete] = useState<OrganizerEventRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadEvents = useCallback(async () => {
    setListError('')
    try {
      const res = await browserFetch(eventsPaths.list({ page: listPage, page_size: LIST_PAGE_SIZE }), {
        headers: authHeadersJson(),
      })
      const body = (await res.json()) as {
        events?: OrganizerEventRow[]
        pagination?: { page: number; page_size: number; total: number }
        error?: string
      }
      if (!res.ok) { setListError(body.error ?? 'No se pudieron cargar los eventos'); return }
      const rows = body.events ?? []
      setEvents(rows)
      const p = body.pagination
      setListPagination(p && typeof p.total === 'number' ? p : { page: listPage, page_size: LIST_PAGE_SIZE, total: rows.length })
    } catch {
      setListError('Error de red al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [listPage, refreshNonce])

  useEffect(() => { setLoading(true); loadEvents() }, [loadEvents])

  useEffect(() => {
    setCanCreateEvents(getAuthUser()?.role !== 'ORGANIZER_STAFF')
  }, [])

  const handleAdd = async () => {
    if (!name.trim()) { setError('El nombre del evento es obligatorio'); return }
    setSaving(true); setError('')
    try {
      const descParts = [venue.trim(), description.trim()].filter(Boolean)
      const res = await browserFetch(eventsPaths.list(), {
        method: 'POST',
        headers: authHeadersJson(),
        body: JSON.stringify({ name: name.trim(), description: descParts.length ? descParts.join('\n\n') : undefined, starts_at: date || undefined, status: 'draft' }),
      })
      const body = (await res.json()) as { event?: OrganizerEventRow; error?: string }
      if (!res.ok) { setError(body.error ?? 'No se pudo crear el evento'); return }
      setListPage(1); setRefreshNonce(n => n + 1)
      setName(''); setVenue(''); setDescription(''); setDate('')
      setDrawerOpen(false)
    } catch { setError('No se pudo contactar al servidor') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await browserFetch(eventsPaths.detail(id), { method: 'DELETE', headers: authHeadersJson() })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        setDeleteError(body.error ?? 'No se pudo eliminar el evento')
        return
      }
      setEventToDelete(null)
      setRefreshNonce(n => n + 1)
    } catch {
      setDeleteError('Error de red. Verificá tu conexión.')
    } finally {
      setDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setEventToDelete(null)
    setDeleteError('')
  }

  const closeDrawer = () => { setDrawerOpen(false); setError('') }

  const formatEventWhen = (row: OrganizerEventRow) => row.starts_at ? formatDate(row.starts_at) : 'Sin fecha'
  const subtitleLine = (row: OrganizerEventRow) => (row.description ?? '').split('\n\n')[0]?.trim() || row.slug

  const eventPanelHref = (event: OrganizerEventRow) => {
    const membership = event.membership === 'staff' ? 'staff' : 'owner'
    const tools = workspaceToolsForEvent(membership, event.id, getAuthUser()?.staff_memberships)
    const segment = firstAllowedWorkspaceSegment(tools)
    return `/events/${event.id}/${segment}`
  }

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <style>{`
        .nb-event-card { animation: nb-card-in 280ms ease-out both; }
        .nb-event-card:hover { border-color: rgba(0,0,0,0.16) !important; box-shadow: 0 4px 16px rgba(0,0,0,0.04); transform: translateY(-1px); }
        .nb-event-card:hover .nb-event-arrow { transform: translateX(2px); }
        .nb-event-delete:hover { background: rgba(239,68,68,0.08) !important; color: #DC2626 !important; }
        @keyframes nb-card-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nb-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .nb-skeleton {
          background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%);
          background-size: 1200px 100%;
          animation: nb-shimmer 1.4s ease-in-out infinite;
        }
      `}</style>

      {/* Nav */}
      {!embedded && (
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '20px', marginBottom: '40px' }}>
          <OrganizerHubBar compact />
        </div>
      )}

      {/* Header */}
      <OrganizerToolHeading
        title="Mis eventos"
        description="Cada evento tiene su propio panel: métricas, catálogo, pedidos y escáner."
        actions={
          canCreateEvents && !loading && listPagination.total > 0 ? (
          <button
            type="button"
            data-tour="new-event-btn"
            onClick={() => setDrawerOpen(true)}
            className="transition-transform active:scale-95"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0A0A0F', color: '#FFFFFF', border: 'none', borderRadius: '100px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nuevo evento
          </button>
          ) : undefined
        }
      />

      {/* List */}
      {listError && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          {listError}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="nb-skeleton" style={{ height: '76px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : listPagination.total === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="5" width="18" height="15" rx="2.5" stroke="#C8C8D0" strokeWidth="1.5" />
              <path d="M7 2v4M15 2v4M2 9h18" stroke="#C8C8D0" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ fontSize: '17px', fontWeight: 700, color: '#0A0A0F', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {canCreateEvents ? 'Creá tu primer evento' : 'Aún no tenés eventos'}
          </p>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: '0 0 32px', maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            {canCreateEvents
              ? 'Desde un evento gestionás el catálogo, los pedidos, los pagos y el escáner QR.'
              : 'Cuando alguien te invite a un evento vas a verlo acá.'}
          </p>

          {canCreateEvents && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '360px', margin: '0 auto 32px', textAlign: 'left' }}>
                {[
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3h12l-1.5 10H4.5L3 3Z" stroke="#6B6B7A" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 3V2a2.5 2.5 0 015 0v1" stroke="#6B6B7A" strokeWidth="1.4" strokeLinecap="round"/></svg>,
                    title: 'Catálogo', desc: 'Productos, combos y precios',
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="3" stroke="#6B6B7A" strokeWidth="1.4"/><path d="M5 6h8M5 9h6M5 12h4" stroke="#6B6B7A" strokeWidth="1.4" strokeLinecap="round"/></svg>,
                    title: 'Pedidos', desc: 'Seguimiento en tiempo real',
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="#6B6B7A" strokeWidth="1.4"/><rect x="10" y="2" width="6" height="6" rx="1" stroke="#6B6B7A" strokeWidth="1.4"/><rect x="2" y="10" width="6" height="6" rx="1" stroke="#6B6B7A" strokeWidth="1.4"/><rect x="11" y="11" width="1.5" height="1.5" fill="#6B6B7A"/><rect x="14" y="11" width="1.5" height="1.5" fill="#6B6B7A"/><rect x="11" y="14" width="1.5" height="1.5" fill="#6B6B7A"/><rect x="14" y="14" width="1.5" height="1.5" fill="#6B6B7A"/></svg>,
                    title: 'Escáner QR', desc: 'Retiro sin papel',
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-5 3 3 3-4 4 6" stroke="#6B6B7A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                    title: 'Métricas', desc: 'Ventas y recaudación',
                  },
                ].map(f => (
                  <div key={f.title} style={{ background: '#FAFAFA', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {f.icon}
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F', margin: 0 }}>{f.title}</p>
                    <p style={{ fontSize: '11px', color: '#9A9AA8', margin: 0 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="transition-transform active:scale-95"
                style={{ ...organizerAccentFilledButtonStyle(), border: 'none', borderRadius: '100px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Crear primer evento
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {events.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#9A9AA8', padding: '24px 0' }}>No hay eventos en esta página.</p>
          ) : (
            <div data-tour="events-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.map((event, i) => {
                const status = event.status || 'draft'
                const sc = STATUS_COLOR[status] ?? STATUS_COLOR.draft
                const showStatus = status !== 'draft'
                return (
                  <Link
                    key={event.id}
                    href={eventPanelHref(event)}
                    className="group nb-event-card"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s', animationDelay: `${i * 55}ms` }}
                  >
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{event.name}</p>
                        {showStatus && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: '100px', whiteSpace: 'nowrap', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                            {STATUS_LABEL[status] ?? status}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9A9AA8' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M5.5 1.5C3.5 1.5 2 3 2 5c0 2.5 3.5 5 3.5 5S9 7.5 9 5c0-2-1.5-3.5-3.5-3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                            <circle cx="5.5" cy="4.5" r="0.9" fill="currentColor"/>
                          </svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitleLine(event)}</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <rect x="1" y="2.5" width="9" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M3.5 1v2M7.5 1v2M1 5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          {formatEventWhen(event)}
                        </span>
                      </div>
                      {(event.order_count != null || event.total_revenue != null || event.active_orders != null) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {event.total_revenue != null && (
                            <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', color: '#0A0A0F', borderRadius: '8px', padding: '3px 8px' }}>
                              {formatPrice(event.total_revenue)} recaudado
                            </span>
                          )}
                          {event.order_count != null && (
                            <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', color: '#0A0A0F', borderRadius: '8px', padding: '3px 8px' }}>
                              {event.order_count} pedidos
                            </span>
                          )}
                          {event.active_orders != null && event.active_orders > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#16A34A', borderRadius: '8px', padding: '3px 8px' }}>
                              {event.active_orders} activos
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0A0A0F', color: '#FFFFFF', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                        Abrir
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="nb-event-arrow" style={{ transition: 'transform 0.15s' }}>
                          <path d="M2 5.5h7M6 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {event.membership !== 'staff' && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setEventToDelete(event) }}
                        className="nb-event-delete"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: '#D1D5DB', display: 'flex', alignItems: 'center', borderRadius: '8px', transition: 'background 0.15s, color 0.15s' }}
                        title="Eliminar"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: '16px' }}>
            <PaginationBar page={listPagination.page} pageSize={listPagination.page_size} total={listPagination.total} onPageChange={setListPage} />
          </div>
        </>
      )}

      {/* Backdrop */}
      <div
        role="presentation"
        onClick={closeDrawer}
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)', opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? 'auto' : 'none', transition: 'opacity 0.25s' }}
      />

      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', zIndex: 50, width: '360px', background: '#FFFFFF', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)', borderRadius: '24px 0 0 24px', transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)', fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
        <div style={{ padding: '28px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#0A0A0F', margin: 0, letterSpacing: '-0.02em' }}>Nuevo evento</h2>
            <button
              type="button"
              onClick={closeDrawer}
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5F5F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6A6A78', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Nombre del evento *" style={inputStyle} disabled={saving} />
            <input type="text" value={venue} onChange={e => { setVenue(e.target.value); setError('') }} placeholder="Lugar (opcional)" style={inputStyle} disabled={saving} />
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" style={inputStyle} disabled={saving} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} disabled={saving} />

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="transition-transform active:scale-95"
              style={{ width: '100%', borderRadius: '100px', ...organizerAccentFilledButtonStyle(), border: 'none', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, marginTop: '4px', letterSpacing: '-0.01em' }}
            >
              {saving ? 'Guardando…' : 'Crear evento'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal confirmación de borrado */}
      <Modal
        isOpen={eventToDelete !== null}
        onClose={closeDeleteModal}
        containerClassName="z-[60]"
      >
        <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 6h12M8 6V4h4v2M9 10v4M11 10v4M5 6l1 10h8l1-10" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0F', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            ¿Eliminar evento?
          </h3>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: '0 0 6px', lineHeight: 1.5 }}>
            Vas a eliminar <strong style={{ color: '#0A0A0F' }}>{eventToDelete?.name}</strong>. Esta acción no se puede deshacer y se perderán todos los datos asociados.
          </p>
          {deleteError && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginTop: '12px' }}>
              {deleteError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={deleting}
              style={{ flex: 1, padding: '11px', borderRadius: '100px', border: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF', fontSize: '14px', fontWeight: 600, color: '#0A0A0F', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => eventToDelete && handleDelete(eventToDelete.id)}
              disabled={deleting}
              style={{ flex: 1, padding: '11px', borderRadius: '100px', border: 'none', background: '#DC2626', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
