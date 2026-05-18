import { render, screen, within } from '@testing-library/react'
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

  it('muestra "Sin pedidos" en todas las columnas cuando no hay órdenes', () => {
    render(<OrderKanban orders={[]} onMarkReady={jest.fn()} onMarkDelivered={jest.fn()} />)
    expect(screen.getAllByText('Sin pedidos')).toHaveLength(4)
  })

  it('muestra el conteo correcto en el badge de cada columna', () => {
    const orders = [
      makeOrder('o1', 'pending'),
      makeOrder('o2', 'pending'),
      makeOrder('o3', 'ready'),
    ]
    render(<OrderKanban orders={orders} onMarkReady={jest.fn()} onMarkDelivered={jest.fn()} />)

    // Badge de "Pendiente" debe mostrar 2
    const pendingLabel = screen.getByText('Pendiente')
    const pendingHeader = pendingLabel.parentElement!
    const pendingBadge = pendingHeader.querySelector('span:last-child')
    expect(pendingBadge?.textContent).toBe('2')

    // Badge de "Listo" debe mostrar 1
    const readyLabel = screen.getByText('Listo')
    const readyHeader = readyLabel.parentElement!
    const readyBadge = readyHeader.querySelector('span:last-child')
    expect(readyBadge?.textContent).toBe('1')
  })

  it('las columnas vacías muestran "Sin pedidos", las llenas no', () => {
    const orders = [makeOrder('o1', 'pending'), makeOrder('o2', 'pending')]
    render(<OrderKanban orders={orders} onMarkReady={jest.fn()} onMarkDelivered={jest.fn()} />)
    // pending tiene 2 órdenes → no muestra "Sin pedidos"
    // preparing, ready, delivered no tienen → muestran "Sin pedidos"
    expect(screen.getAllByText('Sin pedidos')).toHaveLength(3)
  })
})
