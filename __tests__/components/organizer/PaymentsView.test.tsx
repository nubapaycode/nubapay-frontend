import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentsView } from '@/components/organizer/PaymentsView'
import { fetchWorkspacePayments } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchWorkspacePayments: jest.fn(),
}))

const eventId = 'event-uuid-001'

const mockPayments = [
  {
    id: 'pay-1',
    order_id: 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
    order_number: 567,
    customer_name: 'Facu',
    amount: 3500,
    status: 'approved',
    channel: 'mp',
    provider: 'MercadoPago',
    paid_at: '2025-01-15T14:30:00Z',
    created_at: '2025-01-15T14:30:00Z',
  },
  {
    id: 'pay-2',
    order_id: 'aaaaaaaa-bbbb-cccc-dddd-000000000002',
    amount: 1200,
    status: 'pending',
    channel: 'cash',
    provider: null,
    paid_at: null,
    created_at: '2025-01-15T15:00:00Z',
  },
]

beforeEach(() => {
  ;(fetchWorkspacePayments as jest.Mock).mockResolvedValue({
    ok: true,
    payments: mockPayments,
    pagination: { page: 1, page_size: 20, total: 2 },
    summary: {
      approved: { count: 1, amount: 3500 },
      pending: { count: 1, amount: 1200 },
      rejected: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
    },
  })
})

const lastOpts = () => (fetchWorkspacePayments as jest.Mock).mock.calls.at(-1)?.[1]

describe('PaymentsView', () => {
  it('muestra spinner mientras carga', () => {
    ;(fetchWorkspacePayments as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<PaymentsView eventId={eventId} />)
    expect(screen.getByText('Cargando pagos…')).toBeInTheDocument()
  })

  it('muestra los pagos al cargar exitosamente', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    expect(screen.getByText('Aprobado')).toBeInTheDocument()
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
  })

  it('muestra el monto formateado', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    expect(screen.getAllByText(/3\.500/).length).toBeGreaterThan(0)
  })

  it('muestra el canal de pago', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    expect(screen.getByText('Mercado Pago')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
  })

  it('muestra estado vacío si no hay pagos', async () => {
    ;(fetchWorkspacePayments as jest.Mock).mockResolvedValue({
      ok: true,
      payments: [],
      pagination: { page: 1, page_size: 20, total: 0 },
    })
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.getByText('Sin pagos registrados')).toBeInTheDocument())
  })

  it('busca en el servidor por nº de pedido o cliente', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    await userEvent.type(screen.getByPlaceholderText(/Buscar por nº de pedido o cliente/), '567')
    await waitFor(() => expect(lastOpts()).toEqual(expect.objectContaining({ q: '567', page: 1 })))
  })

  it('las tarjetas de resumen muestran totales y filtran por estado', async () => {
    render(<PaymentsView eventId={eventId} />)
    const cobrado = await screen.findByRole('button', { name: /Cobrado/ })
    expect(cobrado).toHaveTextContent('3.500')
    await userEvent.click(cobrado)
    await waitFor(() => expect(lastOpts()).toEqual(expect.objectContaining({ status: ['approved'] })))
  })

  it('filtra por medio y ordena en el servidor', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /^Medio/ }))
    await userEvent.click(screen.getByRole('option', { name: /Efectivo/ }))
    await waitFor(() => expect(lastOpts()).toEqual(expect.objectContaining({ channels: ['cash'] })))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Ordenar' }), 'amount_desc')
    await waitFor(() => expect(lastOpts()).toEqual(expect.objectContaining({ sort: 'amount_desc' })))
  })

  it('muestra el nº de pedido y enlaza a su detalle en Pedidos', async () => {
    render(<PaymentsView eventId={eventId} />)
    const link = (await screen.findByText('#567')).closest('a')
    expect(link).toHaveAttribute('href', `/events/${eventId}/orders?pedido=aaaaaaaa-bbbb-cccc-dddd-000000000001`)
    expect(screen.getByText('Facu')).toBeInTheDocument()
  })

  it('muestra la cabecera de la tabla', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    // Varios elementos pueden tener el mismo texto (dropdown + cabecera de tabla)
    expect(screen.getAllByText('Estado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Medio').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Monto').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fecha').length).toBeGreaterThan(0)
  })
})
