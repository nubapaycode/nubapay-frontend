'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { eventsPaths } from '@/lib/api'
import { authHeadersJson } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import type { OrganizerEventRow } from '@/lib/types/organizer'
import { formatDate } from '@/lib/utils'

import { OrganizerHubBar } from '@/components/organizer/OrganizerHubBar'
import { PaginationBar } from '@/components/ui/PaginationBar'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'

const LIST_PAGE_SIZE = 8

export function EventsView() {
  const [events, setEvents] = useState<OrganizerEventRow[]>([])
  const [listPage, setListPage] = useState(1)
  const [listPagination, setListPagination] = useState({
    page: 1,
    page_size: LIST_PAGE_SIZE,
    total: 0,
  })
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
      if (!res.ok) {
        setListError(body.error ?? 'No se pudieron cargar los eventos')
        return
      }
      const rows = body.events ?? []
      setEvents(rows)
      const p = body.pagination
      if (p && typeof p.total === 'number') {
        setListPagination(p)
      } else {
        setListPagination({
          page: listPage,
          page_size: LIST_PAGE_SIZE,
          total: rows.length,
        })
      }
    } catch {
      setListError('Error de red al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [listPage, refreshNonce])

  useEffect(() => {
    setLoading(true)
    loadEvents()
  }, [loadEvents])

  const handleAdd = async () => {
    if (!name.trim()) {
      setError('El nombre del evento es obligatorio')
      return
    }
    setSaving(true)
    setError('')
    try {
      const descParts = [venue.trim(), description.trim()].filter(Boolean)
      const res = await browserFetch(eventsPaths.list(), {
        method: 'POST',
        headers: authHeadersJson(),
        body: JSON.stringify({
          name: name.trim(),
          description: descParts.length ? descParts.join('\n\n') : undefined,
          starts_at: date || undefined,
          status: 'draft',
        }),
      })
      const body = (await res.json()) as { event?: OrganizerEventRow; error?: string }
      if (!res.ok) {
        setError(body.error ?? 'No se pudo crear el evento')
        return
      }
      setListPage(1)
      setRefreshNonce(n => n + 1)
      setName('')
      setVenue('')
      setDescription('')
      setDate('')
      setDrawerOpen(false)
    } catch {
      setError('No se pudo contactar al servidor')
    } finally {
      setSaving(false)
    }
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setError('')
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await browserFetch(eventsPaths.detail(id), {
        method: 'DELETE',
        headers: authHeadersJson(),
      })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        setListError(body.error ?? 'No se pudo eliminar')
        return
      }
      setRefreshNonce(n => n + 1)
    } catch {
      setListError('Error de red')
    }
  }

  const formatEventWhen = (row: OrganizerEventRow) => {
    if (row.starts_at) return formatDate(row.starts_at)
    return 'Sin fecha'
  }

  const subtitleLine = (row: OrganizerEventRow) => {
    const first = (row.description ?? '').split('\n\n')[0]?.trim()
    return first || row.slug
  }

  return (
    <div className="w-full">

      <div className="border-b border-gray-200 pb-6 mb-6">
        <OrganizerHubBar compact />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:-mt-1">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Eventos</h1>
          <p className="text-xs text-gray-400 mt-1 max-w-md">
            Cada evento tiene su propio panel: métricas, catálogo, pedidos y escáner.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="shrink-0 flex items-center justify-center gap-2 rounded-full bg-white text-gray-900 border border-gray-900 text-sm font-medium px-4 py-2.5 hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nuevo evento
        </button>
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Tus eventos</p>
      {listError && <p className="text-red-500 text-xs mb-3">{listError}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando…</p>
      ) : listPagination.total === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-14 text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <rect x="2" y="4" width="16" height="13" rx="2" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M6 2v3M14 2v3M2 8h16" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Sin eventos todavía</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">Creá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 py-6">No hay eventos en esta página.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map(event => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {(event.status || '').replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-300 mt-1 truncate">
                      {subtitleLine(event)} · {formatEventWhen(event)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/events/${event.id}/dashboard`}
                      className="rounded-full bg-gray-900 text-white text-sm font-medium px-4 py-2 hover:bg-gray-700 transition-colors text-center"
                    >
                      Abrir panel
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <PaginationBar
              page={listPagination.page}
              pageSize={listPagination.page_size}
              total={listPagination.total}
              onPageChange={setListPage}
            />
          </div>
        </>
      )}

      <div
        role="presentation"
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      <div
        className={`fixed top-0 right-0 h-full z-50 w-80 bg-white rounded-l-3xl shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-gray-900">Nuevo evento</h2>
            <button
              type="button"
              onClick={closeDrawer}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Nombre del evento"
              className={inputClass}
              disabled={saving}
            />
            <input
              type="text"
              value={venue}
              onChange={e => {
                setVenue(e.target.value)
                setError('')
              }}
              placeholder="Lugar (opcional)"
              className={inputClass}
              disabled={saving}
            />
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className={inputClass}
              disabled={saving}
            />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} disabled={saving} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 transition-colors mt-2 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Crear evento'}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
