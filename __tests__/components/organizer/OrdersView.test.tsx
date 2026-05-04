import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdersView } from '@/components/organizer/OrdersView'
import { fetchWorkspaceOrders, patchOrderStatus } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchWorkspaceOrders: jest.fn(),
  patchOrderStatus: jest.fn(),
}))

const mockOrderPending = {
  id: 'aaaaaaaa-bbbb-cccc-dddddddddd01',
  eventId: 'demo-event',
  items: [{ productId: 'p', name: 'Cerveza', price: 100, quantity: 2 }],
  total: 200,
  status: 'pending' as const,
  qrToken: 't',
  createdAt: '2025-01-01T12:00:00.000Z',
  updatedAt: '2025-01-01T12:00:00.000Z',
  paymentMethod: 'mp' as const,
}

const mockOrderReady = {
  id: 'aaaaaaaa-bbbb-cccc-dddddddddd02',
  eventId: 'demo-event',
  items: [{ productId: 'p2', name: 'Agua', price: 50, quantity: 1 }],
  total: 50,
  status: 'ready' as const,
  qrToken: 't2',
  createdAt: '2025-01-01T11:00:00.000Z',
  updatedAt: '2025-01-01T11:00:00.000Z',
  paymentMethod: 'cash' as const,
}

describe('OrdersView', () => {
  beforeEach(() => {
    jest.mocked(fetchWorkspaceOrders).mockResolvedValue({
      ok: true,
      orders: [mockOrderPending, mockOrderReady],
      pagination: { page: 1, page_size: 40, total: 2 },
    })
    jest.mocked(patchOrderStatus).mockResolvedValue({
      ok: true,
      order: { ...mockOrderPending, status: 'ready' as const },
    })
  })

  it('renderiza lista con cabeceras y controles de búsqueda', async () => {
    render(<OrdersView eventId="demo-event" />)
    await waitFor(() => expect(screen.getByPlaceholderText(/Buscar por ID/)).toBeInTheDocument())
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Pedido')).toBeInTheDocument()
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
  })

  it('al marcar listo un pedido, llama al API y refresca', async () => {
    render(<OrdersView eventId="demo-event" />)
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Marcar listo' }).length).toBeGreaterThan(0))
    const markReadyButtons = screen.getAllByRole('button', { name: 'Marcar listo' })
    await userEvent.click(markReadyButtons[0])
    await waitFor(() => expect(jest.mocked(patchOrderStatus)).toHaveBeenCalled())
    await waitFor(() => expect(jest.mocked(fetchWorkspaceOrders).mock.calls.length).toBeGreaterThan(1))
  })
})
