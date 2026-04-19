'use client'

import { useState } from 'react'
import { mockEvents } from '@/lib/mock/events'
import { formatDate } from '@/lib/utils'
import type { Event } from '@/types'

const inputClass = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"

export function EventsView() {
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!name.trim() || !venue.trim()) { setError('Nombre y lugar son requeridos'); return }
    const newEvent: Event = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      venue: venue.trim(),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      products: [],
      combos: [],
    }
    setEvents(prev => [...prev, newEvent])
    setName(''); setVenue(''); setDescription(''); setDate(''); setError('')
    setDrawerOpen(false)
  }

  const closeDrawer = () => { setDrawerOpen(false); setError('') }

  const handleDelete = (id: string) => setEvents(prev => prev.filter(e => e.id !== id))

  return (
    <div className="max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:-mt-5">
        <h1 className="text-xl font-medium text-gray-900">Eventos</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-full bg-white text-gray-900 border border-gray-900 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Agregar evento
        </button>
      </div>

      {/* Lista */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Eventos activos</p>
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="#9ca3af" strokeWidth="1.5"/><path d="M6 2v3M14 2v3M2 8h16" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Sin eventos todavía</p>
          <p className="text-xs text-gray-400 mt-1">Creá tu primer evento desde el botón de arriba</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{event.name}</p>
                {event.description && <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>}
                <p className="text-xs text-gray-300 mt-1">{event.venue} · {formatDate(event.date)}</p>
              </div>
              <button onClick={() => handleDelete(event.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-80 bg-white rounded-l-3xl shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-gray-900">Nuevo evento</h2>
            <button onClick={closeDrawer} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm">
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Nombre del evento" className={inputClass} />
            <input type="text" value={venue} onChange={e => { setVenue(e.target.value); setError('') }} placeholder="Lugar" className={inputClass} />
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" className={inputClass} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              onClick={handleAdd}
              className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-700 transition-colors mt-2"
            >
              Agregar evento
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
