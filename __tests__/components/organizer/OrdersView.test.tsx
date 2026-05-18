import { render, screen, waitFor } from '@testing-library/react'
import { OrdersView } from '@/components/organizer/OrdersView'
import { fetchWorkspaceOrders, fetchAllCategories } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchWorkspaceOrders: jest.fn(),
  fetchAllCategories: jest.fn(),
}))

const mockOrderPending = {
  id: 'aaaaaaaa-bbbb-cccc-dddddddddd01',
  eventId: 'demo-event',
  orderNumber: 1,
  items: [{ productId: 'p', name: 'Cerveza', price: 100, quantity: 2, categoryName: null, subtotal: 200 }],
  total: 200,
  status: 'pending' as const,
  qrToken: 't',
  createdAt: '2025-01-01T12:00:00.000Z',
  updatedAt: '2025-01-01T12:00:00.000Z',
  paymentMethod: 'mp' as const,
  customerName: 'Test User',
  paymentStatus: 'paid',
}

const mockOrderReady = {
  id: 'aaaaaaaa-bbbb-cccc-dddddddddd02',
  eventId: 'demo-event',
  orderNumber: 2,
  items: [{ productId: 'p2', name: 'Agua', price: 50, quantity: 1, categoryName: null, subtotal: 50 }],
  total: 50,
  status: 'ready' as const,
  qrToken: 't2',
  createdAt: '2025-01-01T11:00:00.000Z',
  updatedAt: '2025-01-01T11:00:00.000Z',
  paymentMethod: 'cash' as const,
  customerName: 'Otro User',
  paymentStatus: 'pending',
}

beforeEach(() => {
  jest.mocked(fetchWorkspaceOrders).mockResolvedValue({
    ok: true,
    orders: [mockOrderPending, mockOrderReady],
    pagination: { page: 1, page_size: 40, total: 2 },
  })
  jest.mocked(fetchAllCategories).mockResolvedValue({
    ok: true,
    categories: [],
  })
})

describe('OrdersView', () => {
  it('muestra el título "Pedidos"', async () => {
    render(<OrdersView eventId="demo-event" />)
    await waitFor(() => expect(screen.getByText('Pedidos')).toBeInTheDocument())
  })

  it('muestra el campo de búsqueda', async () => {
    render(<OrdersView eventId="demo-event" />)
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(/Buscar por cliente, producto/),
      ).toBeInTheDocument(),
    )
  })

  it('muestra las tabs de estado (Todos, Pagados, Entregados)', async () => {
    render(<OrdersView eventId="demo-event" />)
    await waitFor(() => expect(screen.getByText('Pedidos')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagados' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entregados' })).toBeInTheDocument()
  })

  it('muestra los pedidos en la tabla', async () => {
    render(<OrdersView eventId="demo-event" />)
    await waitFor(() => expect(screen.queryByText('Cargando')).not.toBeInTheDocument())
    // Verifica que se renderizaron botones "Ver detalle" para cada orden
    const detailButtons = await screen.findAllByRole('button', { name: 'Ver detalle' })
    expect(detailButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('llama a fetchWorkspaceOrders con el eventId correcto', async () => {
    render(<OrdersView eventId="demo-event" />)
    await waitFor(() => expect(fetchWorkspaceOrders).toHaveBeenCalledWith('demo-event', expect.any(Object)))
  })
})
