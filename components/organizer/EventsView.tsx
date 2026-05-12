'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { eventsPaths } from '@/lib/api'
import { authHeadersJson, getAuthUser } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { firstAllowedWorkspaceSegment, workspaceToolsForEvent } from '@/lib/organizerStaffTools'
import type { OrganizerEventRow } from '@/lib/types/organizer'
import { formatDate } from '@/lib/utils'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'

import { OrganizerHubBar } from '@/components/organizer/OrganizerHubBar'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { PaginationBar } from '@/components/ui/PaginationBar'

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
    try {
      const res = await browserFetch(eventsPaths.detail(id), { method: 'DELETE', headers: authHeadersJson() })
      if (!res.ok) { const body = (await res.json()) as { error?: string }; setListError(body.error ?? 'No se pudo eliminar'); return }
      setRefreshNonce(n => n + 1)
    } catch { setListError('Error de red') }
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
        .nb-event-card:hover { border-color: rgba(0,0,0,0.16) !important; box-shadow: 0 4px 16px rgba(0,0,0,0.04); transform: translateY(-1px); }
        .nb-event-card:hover .nb-event-arrow { transform: translateX(2px); }
        .nb-event-delete:hover { background: rgba(239,68,68,0.08) !important; color: #DC2626 !important; }
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
          canCreateEvents ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
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
            <div key={i} style={{ height: '76px', borderRadius: '16px', background: 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : listPagination.total === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="13" rx="2" stroke="#C8C8D0" strokeWidth="1.5" />
              <path d="M6 2v3M14 2v3M2 8h16" stroke="#C8C8D0" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Sin eventos todavía</p>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: '0 0 24px 0' }}>
            {canCreateEvents ? 'Creá el primero con el botón de arriba.' : 'Cuando te inviten a un evento, vas a verlo acá.'}
          </p>
          {canCreateEvents && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            style={{ ...organizerAccentFilledButtonStyle(), border: 'none', borderRadius: '100px', padding: '10px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Crear evento
          </button>
          )}
        </div>
      ) : (
        <>
          {events.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#9A9AA8', padding: '24px 0' }}>No hay eventos en esta página.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.map(event => {
                const status = event.status || 'draft'
                const sc = STATUS_COLOR[status] ?? STATUS_COLOR.draft
                const showStatus = status !== 'draft'
                return (
                  <Link
                    key={event.id}
                    href={eventPanelHref(event)}
                    className="group nb-event-card"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s' }}
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
                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(event.id) }}
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
              style={{ width: '100%', borderRadius: '100px', ...organizerAccentFilledButtonStyle(), border: 'none', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, marginTop: '4px', letterSpacing: '-0.01em' }}
            >
              {saving ? 'Guardando…' : 'Crear evento'}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
