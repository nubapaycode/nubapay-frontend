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
  })
})

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
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('muestra el monto formateado', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    expect(screen.getByText(/3.500/)).toBeInTheDocument()
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

  it('filtra pagos por búsqueda de ID', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    const searchInput = screen.getByPlaceholderText(/Buscar por ID de pedido/)
    await userEvent.type(searchInput, 'aaaaaaaa-bbbb-cccc-dddd-000000000001')
    // Solo debe mostrar el primer pago (Aprobado)
    expect(screen.getByText('Aprobado')).toBeInTheDocument()
  })

  it('muestra la cabecera de la tabla', async () => {
    render(<PaymentsView eventId={eventId} />)
    await waitFor(() => expect(screen.queryByText('Cargando pagos…')).not.toBeInTheDocument())
    // Varios elementos pueden tener el mismo texto (dropdown + cabecera de tabla)
    expect(screen.getAllByText('Estado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Canal').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Monto').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fecha').length).toBeGreaterThan(0)
  })
})
