import type { Event } from '@/types'

export const mockEvents: Event[] = [
  {
    id: 'demo-event',
    name: 'Festival de Verano 2026',
    description: 'El mejor festival del año',
    date: '2026-04-17T20:00:00Z',
    venue: 'Estadio Único, La Plata',
    products: [],
    combos: [],
  },
  {
    id: 'event-002',
    name: 'Rock en el Parque',
    description: 'Festival de rock en vivo',
    date: '2026-05-10T18:00:00Z',
    venue: 'Parque Sarmiento, Córdoba',
    products: [],
    combos: [],
  },
  {
    id: 'event-003',
    name: 'Food Truck Fest',
    description: 'Los mejores food trucks de la ciudad',
    date: '2026-06-01T12:00:00Z',
    venue: 'Puerto Madero, Buenos Aires',
    products: [],
    combos: [],
  },
]
