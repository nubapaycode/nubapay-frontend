import { render, screen } from '@testing-library/react'
import { DashboardView } from '@/components/organizer/DashboardView'
import { useDashboard } from '@/lib/hooks/useDashboard'

jest.mock('@/lib/hooks/useDashboard', () => ({
  useDashboard: jest.fn(),
}))

const mockOrders = [
  {
    id: 'o1', eventId: 'demo', status: 'pending', total: 3500,
    items: [{ productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 2 }],
    qrToken: 't1', createdAt: '', updatedAt: '',
  },
  {
    id: 'o2', eventId: 'demo', status: 'preparing', total: 2800,
    items: [{ productId: 'p2', name: 'Pizza de Muzzarella', price: 2800, quantity: 1 }],
    qrToken: 't2', createdAt: '', updatedAt: '',
  },
  {
    id: 'o3', eventId: 'demo', status: 'ready', total: 1200,
    items: [{ productId: 'p1', name: 'Hamburguesa Clásica', price: 1200, quantity: 1 }],
    qrToken: 't3', createdAt: '', updatedAt: '',
  },
  {
    id: 'o4', eventId: 'demo', status: 'delivered', total: 800,
    items: [{ productId: 'p5', name: 'Agua Mineral 500ml', price: 800, quantity: 1 }],
    qrToken: 't4', createdAt: '', updatedAt: '',
  },
]

beforeEach(() => {
  ;(useDashboard as jest.Mock).mockReturnValue({ orders: mockOrders })
})

describe('DashboardView', () => {
  it('muestra las 4 tarjetas de estado', () => {
    render(<DashboardView />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('muestra el total recaudado formateado', () => {
    render(<DashboardView />)
    // total: 3500 + 2800 + 1200 + 800 = 8300
    expect(screen.getByText(/8\.300/)).toBeInTheDocument()
  })
})
