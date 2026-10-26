import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketsStoreView } from '@/components/buyer/TicketsStoreView'
import type { Event } from '@/types'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

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
  sessionStorage.clear()
  push.mockClear()
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
  it('muestra "Comprar" al elegir entradas y lleva al checkout de tickets', async () => {
    render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    expect(screen.queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar Entrada general' }))
    await userEvent.click(screen.getByRole('button', { name: 'Agregar uno' }))
    expect(screen.getByText('2 entradas')).toBeInTheDocument()
    expect(screen.getByText(/10\.000/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Comprar' }))
    expect(push).toHaveBeenCalledWith('/tickets/fiesta/comprar')
    const stored = JSON.parse(sessionStorage.getItem('nubapay_ticket_selection')!)
    expect(stored.lines).toEqual([{ ticketId: 't1', quantity: 2 }])
    expect(stored.expiresAt).toBeGreaterThan(Date.now())
  })

  it('no usa el carrito del catálogo', async () => {
    render(<TicketsStoreView event={baseEvent} catalogSlug="fiesta" />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Parking VIP' }))
    expect(sessionStorage.getItem('nubapay_cart')).toBeNull()
  })
})
