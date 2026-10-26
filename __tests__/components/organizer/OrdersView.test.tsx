import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdersView } from '@/components/organizer/OrdersView'
import {
  downloadOrdersCsv,
  fetchAllCategories,
  fetchWorkspaceOrder,
  fetchWorkspaceOrders,
  patchOrderStatus,
} from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  downloadOrdersCsv: jest.fn(),
  fetchWorkspaceOrders: jest.fn(),
  fetchWorkspaceOrder: jest.fn(),
  fetchAllCategories: jest.fn(),
  patchOrderStatus: jest.fn(),
}))

jest.mock('@/components/organizer/ProductScanSummaryView', () => ({
  ProductScanSummaryView: () => <div>Resumen de escaneos</div>,
}))

const mockOrderPending = {
  id: 'aaaaaaaa-bbbb-cccc-dddddddddd01',
  eventId: 'demo-event',
  orderNumber: 1,
  items: [
    { productId: 'p', name: 'Cerveza', price: 100, quantity: 2, categoryName: 'Bebidas', subtotal: 200, redeemedQuantity: 1, redeemedAt: '2025-01-01T12:30:00.000Z' },
  ],
  total: 200,
  status: 'pending' as const,
  qrToken: 't',
  createdAt: '2025-01-01T12:00:00.000Z',
  updatedAt: '2025-01-01T12:00:00.000Z',
  paymentMethod: 'mp' as const,
  customerName: 'Test User',
  customerEmail: 'test@example.com',
  paymentStatus: 'approved',
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
  paymentStatus: 'approved',
}

const lastCall = () => jest.mocked(fetchWorkspaceOrders).mock.calls.at(-1)

async function renderLoaded() {
  render(<OrdersView eventId="demo-event" />)
  await screen.findAllByRole('button', { name: /Ver detalle del pedido/ })
}

beforeEach(() => {
  jest.clearAllMocks()
  window.history.replaceState(null, '', '/events/demo-event/orders')
  jest.mocked(fetchWorkspaceOrders).mockResolvedValue({
    ok: true,
    orders: [mockOrderPending, mockOrderReady],
    pagination: { page: 1, page_size: 20, total: 2 },
    statusCounts: { unredeemed: 2, partially_delivered: 0, delivered: 5, cancelled: 1 },
    summary: { revenue: 250, units: 3, redeemed_units: 1 },
  })
  jest.mocked(fetchAllCategories).mockResolvedValue({
    ok: true,
    categories: [{ id: 'c1', name: 'Bebidas', sort_order: 1, is_active: true }],
  })
})

describe('OrdersView', () => {
  it('muestra el título y las pestañas Pedidos / Escaneos', async () => {
    await renderLoaded()
    expect(screen.getByRole('heading', { name: 'Pedidos' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pedidos' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Escaneos' })).toBeInTheDocument()
  })

  it('muestra el campo de búsqueda', async () => {
    await renderLoaded()
    expect(screen.getByPlaceholderText(/Buscar por cliente, producto/)).toBeInTheDocument()
  })

  it('lista los pedidos y pide solo pagados del evento', async () => {
    await renderLoaded()
    expect(screen.getAllByRole('button', { name: /Ver detalle del pedido/ })).toHaveLength(2)
    expect(lastCall()).toEqual(['demo-event', expect.objectContaining({ paymentStatus: 'approved' })])
  })

  it('muestra los conteos por estado y los totales del filtro', async () => {
    await renderLoaded()
    expect(screen.getByRole('tab', { name: /Todos\s*8/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Sin retirar\s*2/ })).toBeInTheDocument()
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('filtra por estado desde las pestañas y lo guarda en la URL', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('tab', { name: /Entregados/ }))
    await waitFor(() => expect(lastCall()?.[1]).toEqual(expect.objectContaining({ status: 'delivered', page: 1 })))
    expect(window.location.search).toContain('estado=delivered')
  })

  it('filtra por método de pago en el servidor y muestra la etiqueta', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /^Pago/ }))
    await userEvent.click(screen.getByRole('option', { name: /Efectivo/ }))
    await waitFor(() => expect(lastCall()?.[1]).toEqual(expect.objectContaining({ payment: 'cash' })))
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtro Pago Efectivo' }))
    await waitFor(() => expect(lastCall()?.[1]).toEqual(expect.objectContaining({ payment: null })))
  })

  it('filtra por categoría en el servidor', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /^Categoría/ }))
    await userEvent.click(screen.getByRole('option', { name: /Bebidas/ }))
    await waitFor(() => expect(lastCall()?.[1]).toEqual(expect.objectContaining({ categories: ['Bebidas'] })))
    expect(window.location.search).toContain('categoria=Bebidas')
  })

  it('abre el panel de detalle con la línea de tiempo y navega con el teclado', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle del pedido #1' }))
    const sheet = screen.getByRole('dialog', { name: 'Pedido #1' })
    expect(within(sheet).getByText('Pedido pagado')).toBeInTheDocument()
    expect(within(sheet).getByText('Retiro escaneado')).toBeInTheDocument()
    expect(within(sheet).getByText('Falta retirar el resto')).toBeInTheDocument()
    expect(window.location.search).toContain(`pedido=${mockOrderPending.id}`)

    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(screen.getByRole('dialog', { name: 'Pedido #2' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abre un pedido enlazado que no está en la página', async () => {
    window.history.replaceState(null, '', '/events/demo-event/orders?pedido=otro-id')
    jest.mocked(fetchWorkspaceOrder).mockResolvedValue({
      ok: true,
      order: { ...mockOrderReady, id: 'otro-id', orderNumber: 99 },
    })
    render(<OrdersView eventId="demo-event" />)
    expect(await screen.findByRole('dialog', { name: 'Pedido #99' })).toBeInTheDocument()
    expect(fetchWorkspaceOrder).toHaveBeenCalledWith('demo-event', 'otro-id')
  })

  it('cancela un pedido después de confirmar dos veces', async () => {
    jest.mocked(patchOrderStatus).mockResolvedValue({ ok: true, order: { ...mockOrderPending, status: 'cancelled' } })
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle del pedido #1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar pedido…' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
    expect(patchOrderStatus).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar definitivamente' }))
    await waitFor(() => expect(patchOrderStatus).toHaveBeenCalledWith('demo-event', mockOrderPending.id, 'cancelled'))
  })

  it('exporta a CSV con los filtros actuales', async () => {
    jest.mocked(downloadOrdersCsv).mockResolvedValue({ ok: true })
    await renderLoaded()
    await userEvent.click(screen.getByRole('tab', { name: /Sin retirar/ }))
    await waitFor(() => expect(lastCall()?.[1]).toEqual(expect.objectContaining({ status: 'unredeemed' })))
    await userEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(downloadOrdersCsv).toHaveBeenCalledWith(
      'demo-event',
      expect.objectContaining({ status: 'unredeemed', paymentStatus: 'approved', ids: undefined }),
    )
  })

  describe('selección múltiple', () => {
    it('muestra la barra de acciones y exporta solo lo seleccionado', async () => {
      jest.mocked(downloadOrdersCsv).mockResolvedValue({ ok: true })
      await renderLoaded()
      await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar pedido #1' }))
      const bar = screen.getByRole('region', { name: 'Acciones sobre los pedidos seleccionados' })
      expect(within(bar).getByText('1 seleccionado')).toBeInTheDocument()
      // Marcar la casilla no abre el detalle.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      await userEvent.click(within(bar).getByRole('button', { name: /Exportar CSV/ }))
      expect(downloadOrdersCsv).toHaveBeenCalledWith('demo-event', expect.objectContaining({ ids: [mockOrderPending.id] }))
    })

    it('"seleccionar todos" marca la página entera', async () => {
      await renderLoaded()
      await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todos los pedidos de la página' }))
      expect(screen.getByText('2 seleccionados')).toBeInTheDocument()
    })

    it('cancela en lote después de confirmar y muestra el resultado', async () => {
      jest.mocked(patchOrderStatus).mockResolvedValue({ ok: true, order: { ...mockOrderPending, status: 'cancelled' } })
      await renderLoaded()
      await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todos los pedidos de la página' }))
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar…' }))
      expect(screen.getByText('¿Cancelar 2 pedidos?')).toBeInTheDocument()
      expect(patchOrderStatus).not.toHaveBeenCalled()
      await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar 2' }))
      expect(await screen.findByText('Se cancelaron 2 pedidos.')).toBeInTheDocument()
      expect(patchOrderStatus).toHaveBeenCalledTimes(2)
    })
  })
})
