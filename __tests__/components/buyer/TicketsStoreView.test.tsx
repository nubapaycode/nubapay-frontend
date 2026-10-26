import { render, screen } from '@testing-library/react'

import { TicketsStoreView } from '@/components/buyer/TicketsStoreView'
import { useCart } from '@/lib/hooks/useCart'
import type { Event } from '@/types'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/lib/hooks/useCart', () => ({ useCart: jest.fn() }))
jest.mock('@/components/buyer/FloatingOrders', () => ({ FloatingOrders: () => null }))

const baseEvent: Event = {
  id: 'e1',
  name: 'Fiesta',
  description: '',
  date: '',
  venue: '',
  products: [],
  combos: [],
  blocks: [],
  tickets: [
    { id: 't1', kind: 'ticket', name: 'Entrada general', description: '', price: 5000, available: true },
    { id: 't2', kind: 'ticket', name: 'Parking VIP', description: '', price: 9000, available: true },
  ],
  categories: [],
  showCategoryShortcuts: false,
  paymentsEnabled: true,
}

beforeEach(() => {
  ;(useCart as jest.Mock).mockReturnValue({ items: [], addItem: jest.fn(), updateQuantity: jest.fn(), total: 0, count: 0 })
})

describe('TicketsStoreView', () => {
  it('lista los tickets del evento', () => {
    render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    expect(screen.getByText('Entrada general')).toBeInTheDocument()
    expect(screen.getByText('Parking VIP')).toBeInTheDocument()
  })

  it('ofrece volver al catálogo solo si el evento tiene productos', () => {
    const { rerender } = render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    expect(screen.queryByRole('link', { name: /Ver catálogo/ })).not.toBeInTheDocument()
    rerender(
      <TicketsStoreView
        event={{ ...baseEvent, products: [{ id: 'p1', name: 'Gaseosa', description: '', price: 1, category: 'Bebidas', available: true }] }}
        catalogSlug="fiesta"
      />,
    )
    expect(screen.getByRole('link', { name: /Ver catálogo/ })).toHaveAttribute('href', '/catalogo/fiesta')
  })

  it('muestra el estado vacío sin tickets', () => {
    render(<TicketsStoreView event={{ ...baseEvent, tickets: [] }} catalogSlug="fiesta" />)
    expect(screen.getByText('Sin tickets disponibles')).toBeInTheDocument()
  })
})
