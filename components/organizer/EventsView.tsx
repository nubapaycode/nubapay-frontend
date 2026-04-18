'use client'

import { useState } from 'react'
import { mockEvents } from '@/lib/mock/events'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Event } from '@/types'

export function EventsView() {
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!name.trim() || !venue.trim()) {
      setError('Nombre y lugar son requeridos')
      return
    }
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
    setName('')
    setVenue('')
    setDescription('')
    setDate('')
    setError('')
  }

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Eventos</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Agregar evento</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Nombre del evento"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <input
            type="text"
            value={venue}
            onChange={e => { setVenue(e.target.value); setError('') }}
            placeholder="Lugar"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <Button onClick={handleAdd} className="self-start">
            Agregar evento
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {events.map(event => (
          <div
            key={event.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{event.name}</p>
              {event.description && (
                <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{event.venue} · {formatDate(event.date)}</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(event.id)}
            >
              Eliminar
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
