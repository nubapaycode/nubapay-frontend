import { render, screen } from '@testing-library/react'
import { OrderKanban } from '@/components/organizer/OrderKanban'
import type { Order } from '@/types'

const makeOrder = (id: string, status: Order['status']): Order => ({
  id,
  eventId: 'demo',
  items: [],
  total: 0,
  status,
  qrToken: 'token',
  createdAt: '',
  updatedAt: '',
})

describe('OrderKanban', () => {
  it('renderiza las 4 columnas con sus headers', () => {
    render(<OrderKanban orders={[]} onMarkReady={jest.fn()} onMarkDelivered={jest.fn()} />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('muestra el conteo correcto de pedidos por columna', () => {
    const orders = [
      makeOrder('o1', 'pending'),
      makeOrder('o2', 'pending'),
      makeOrder('o3', 'ready'),
    ]
    render(<OrderKanban orders={orders} onMarkReady={jest.fn()} onMarkDelivered={jest.fn()} />)
    expect(screen.getByText('2 pedidos')).toBeInTheDocument()
    expect(screen.getByText('1 pedido')).toBeInTheDocument()
  })
})
