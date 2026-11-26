import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ParkingOwnerAccountProvider } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { ParkingOwnerOrdersTabs } from '@/components/parkingOwner/ParkingOwnerOrdersTabs'
import {
  MercadoPagoSection,
  ParkingReservationsSection,
  OrdersSection,
  PaymentsListSection,
  ScannerSection,
  PaymentsSection,
  StoreProductsSection,
  TeamSection,
  VehiclesSection,
} from '@/components/parkingOwner/ParkingOwnerSections'
import { browserFetch } from '@/lib/browserFetch'

jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))

// Las vistas de evento se reemplazan por stubs que muestran las props con las que se las monta.
jest.mock('@/components/organizer/TicketsView', () => ({
  TicketsView: (p: { eventId: string; kind: string; scope: string }) => (
    <div>tickets:{p.eventId}:{p.kind}:{p.scope}</div>
  ),
}))
jest.mock('@/components/organizer/ProductsView', () => ({
  ProductsView: (p: { eventId: string }) => <div>products:{p.eventId}</div>,
}))
jest.mock('@/components/organizer/BlocksView', () => ({ BlocksView: () => <div>blocks</div> }))
jest.mock('@/components/organizer/StaffView', () => ({
  StaffView: (p: { eventId: string }) => <div>staff:{p.eventId}</div>,
}))
jest.mock('@/components/organizer/PaymentMethodsView', () => ({
  PaymentMethodsView: (p: { eventId: string; basePath: string }) => <div>payments:{p.eventId}:{p.basePath}</div>,
}))
jest.mock('@/components/organizer/MercadoPagoSetupView', () => ({
  MercadoPagoSetupView: (p: { eventId: string; backHref: string }) => <div>mp:{p.eventId}:{p.backHref}</div>,
}))
jest.mock('@/components/organizer/OrdersView', () => ({
  OrdersView: (p: { eventId: string; filterSlot?: React.ReactNode }) => (
    <div>
      <span>orders:{p.eventId}</span>
      {p.filterSlot}
    </div>
  ),
}))
jest.mock('@/components/organizer/PaymentsView', () => ({
  PaymentsView: (p: { eventId: string; ordersPath: string; filterSlot?: React.ReactNode }) => (
    <div>
      <span>paylist:{p.eventId}:{p.ordersPath}</span>
      {p.filterSlot}
    </div>
  ),
}))
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }), usePathname: () => '/estacionamiento/pedidos' }))
jest.mock('@/components/organizer/ScannerView', () => ({
  ScannerView: (p: { eventId: string }) => <div>scanner:{p.eventId}</div>,
}))
jest.mock('@/components/organizer/tickets/ParkingReservations', () => ({
  ParkingReservations: (p: { eventId: string }) => <div>reservas:{p.eventId}</div>,
}))
jest.mock('@/components/organizer/SipagoSetupView', () => ({ SipagoSetupView: () => <div>sipago</div> }))
jest.mock('@/components/organizer/MobbexSetupView', () => ({ MobbexSetupView: () => <div>mobbex</div> }))

const mockFetch = browserFetch as jest.MockedFunction<typeof browserFetch>
const mockReplace = jest.fn()

function loginWith(modules: string[]) {
  localStorage.setItem('nubapay_token', 't')
  localStorage.setItem('nubapay_user', JSON.stringify({ id: 'u', name: 'U', email: 'u@x.com', role: 'ORGANIZER', modules }))
}
const account = {
  base_event_id: 'base-123',
  name: 'Playa Norte',
  slug: 'playa-norte',
  accepts_event_submissions: true,
  counts: { pending: 0, approved: 0, rejected: 0 },
}

const events = [
  { id: 'base-123', name: 'Estacionamiento', is_parking_base: true, membership: 'owner', starts_at: null },
  { id: 'ev-1', name: 'Festival Uno', is_parking_base: false, membership: 'owner', starts_at: null },
  { id: 'ev-ajeno', name: 'Donde soy staff', is_parking_base: false, membership: 'staff', starts_at: null },
]

beforeEach(() => {
  localStorage.clear()
  mockReplace.mockClear()
  loginWith(['catalogo', 'parking', 'parking_owner'])
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const u = String(input)
    if (u.includes('/events?')) return { ok: true, status: 200, json: async () => ({ events }) } as Response
    return { ok: true, status: 200, json: async () => ({ account }) } as Response
  })
})

function renderIn(ui: React.ReactElement) {
  return render(<ParkingOwnerAccountProvider>{ui}</ParkingOwnerAccountProvider>)
}

describe('secciones del panel del estacionamiento', () => {
  it('Vehículos monta el parking en modo cuenta sobre el evento base', async () => {
    renderIn(<VehiclesSection />)
    expect(await screen.findByText('tickets:base-123:parking:account')).toBeInTheDocument()
  })

  it('Tienda y Equipo usan el evento base', async () => {
    renderIn(
      <>
        <StoreProductsSection />
        <TeamSection />
      </>,
    )
    expect(await screen.findByText('products:base-123')).toBeInTheDocument()
    expect(screen.getByText('staff:base-123')).toBeInTheDocument()
  })

  it('Métodos de pago cuelga las pantallas de conexión de /estacionamiento/cobros/metodos-pago', async () => {
    renderIn(
      <>
        <PaymentsSection />
        <MercadoPagoSection />
      </>,
    )
    expect(await screen.findByText('payments:base-123:/estacionamiento/cobros/metodos-pago')).toBeInTheDocument()
    expect(screen.getByText('mp:base-123:/estacionamiento/cobros/metodos-pago')).toBeInTheDocument()
  })

  it('Pedidos arranca en todo el estacionamiento y el filtro "Evento" cambia a uno puntual', async () => {
    const user = userEvent.setup()
    renderIn(<OrdersSection />)
    expect(await screen.findByText('orders:base-123')).toBeInTheDocument()
    // El filtro vive en la fila de filtros de la vista, con el mismo estilo que los demás.
    await user.click(await screen.findByRole('button', { name: /Evento/ }))
    expect(screen.getByRole('option', { name: 'Festival Uno' })).toBeInTheDocument()
    // ni el evento base ni los eventos donde el usuario es staff aparecen como opción
    expect(screen.queryByRole('option', { name: 'Estacionamiento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Donde soy staff' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Festival Uno' }))
    expect(screen.getByText('orders:ev-1')).toBeInTheDocument()
    // El botón muestra el evento elegido; "Limpiar" vuelve a todos.
    await user.click(screen.getByRole('button', { name: /Festival Uno/ }))
    await user.click(screen.getByRole('button', { name: /Limpiar/ }))
    expect(screen.getByText('orders:base-123')).toBeInTheDocument()
  })

  it('Escáner y Cobros se montan sobre todo el estacionamiento', async () => {
    renderIn(
      <>
        <ScannerSection />
        <PaymentsListSection />
      </>,
    )
    expect(await screen.findByText('scanner:base-123')).toBeInTheDocument()
    expect(screen.getByText('paylist:base-123:/estacionamiento/pedidos')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /Evento/ })).toBeInTheDocument())
  })

  it('sin el módulo, Vehículos y Tienda no se muestran y vuelven a Eventos', async () => {
    loginWith(['parking_owner'])
    renderIn(
      <>
        <VehiclesSection />
        <StoreProductsSection />
      </>,
    )
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/estacionamiento/eventos'))
    expect(screen.queryByText(/tickets:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/products:/)).not.toBeInTheDocument()
  })

  it('si no se puede cargar el estacionamiento muestra el error y deja reintentar', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Falló' }) } as Response)
    renderIn(<VehiclesSection />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Falló')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('las reservas de vehículos están en Pedidos, sobre todo el estacionamiento', async () => {
    renderIn(
      <>
        <ParkingOwnerOrdersTabs />
        <ParkingReservationsSection />
      </>,
    )
    expect(await screen.findByText('reservas:base-123')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reservas de vehículos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reservas de vehículos' })).toHaveAttribute('href', '/estacionamiento/pedidos/reservas')
    expect(screen.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', '/estacionamiento/pedidos')
  })

  it('sin el módulo parking, Pedidos no muestra la pestaña de reservas', async () => {
    loginWith(['parking_owner'])
    renderIn(<ParkingOwnerOrdersTabs />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(screen.queryByRole('link', { name: 'Reservas de vehículos' })).not.toBeInTheDocument()
  })
})
