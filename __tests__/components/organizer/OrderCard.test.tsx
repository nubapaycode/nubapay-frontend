import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderCard } from '@/components/organizer/OrderCard'
import type { Order } from '@/types'

const baseOrder: Order = {
  id: 'abc12345-test',
  eventId: 'demo-event',
  items: [
    { productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 1 },
    { productId: 'p4', name: 'Gaseosa 500ml', price: 1200, quantity: 2 },
  ],
  total: 5900,
  status: 'pending',
  qrToken: 'token-test',
  createdAt: '2026-04-17T10:00:00Z',
  updatedAt: '2026-04-17T10:00:00Z',
}

describe('OrderCard', () => {
  it('muestra el id truncado con # en mayúsculas', () => {
    render(<OrderCard order={baseOrder} />)
    // El componente renderiza #{id.slice(0,8).toUpperCase()} → #ABC12345
    expect(screen.getByText(/ABC12345/)).toBeInTheDocument()
  })

  it('muestra botón "Marcar listo" cuando status=pending', () => {
    render(<OrderCard order={baseOrder} onMarkReady={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Marcar listo' })).toBeInTheDocument()
  })

  it('muestra botón "Marcar listo" cuando status=preparing', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'preparing' }} onMarkReady={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Marcar listo' })).toBeInTheDocument()
  })

  it('muestra botón "Confirmar entrega" cuando status=ready', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'ready' }} onMarkDelivered={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument()
  })

  it('muestra badge "Entregado" y sin botones cuando status=delivered', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'delivered' }} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/Entregado/)).toBeInTheDocument()
  })

  it('llama onMarkReady al hacer click en "Marcar listo"', async () => {
    const handleReady = jest.fn()
    render(<OrderCard order={baseOrder} onMarkReady={handleReady} />)
    await userEvent.click(screen.getByRole('button', { name: 'Marcar listo' }))
    expect(handleReady).toHaveBeenCalledTimes(1)
  })
})
