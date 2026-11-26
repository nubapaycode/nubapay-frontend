import { render, screen, waitFor } from '@testing-library/react'

import { TicketsView } from '@/components/organizer/TicketsView'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'
import { fetchTickets, type WorkspaceTicket } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerEvents', () => ({ fetchOrganizerEventDetail: jest.fn() }))
jest.mock('@/lib/organizerWorkspace', () => ({
  ...jest.requireActual('@/lib/organizerWorkspace'),
  fetchTickets: jest.fn(),
  createTicket: jest.fn(),
  patchTicket: jest.fn(),
  deleteTicket: jest.fn(),
  reorderTickets: jest.fn(),
}))
jest.mock('@/lib/hooks/usePublicOrigin', () => ({ usePublicOrigin: () => 'https://nubapay.test' }))
jest.mock('@/components/organizer/tickets/ParkingReservations', () => ({
  ParkingReservations: () => <div>reservas</div>,
}))
jest.mock('@/components/organizer/tickets/ParkingMapsCard', () => ({
  ParkingMapsCard: () => <div>mapa</div>,
}))

const ticket = (over: Partial<WorkspaceTicket>): WorkspaceTicket => ({
  id: 't',
  kind: 'parking',
  icon: 'car',
  name: 'Auto',
  description: '',
  price: 1000,
  currency: 'ARS',
  stock: 10,
  sold: 0,
  reserved: 0,
  sort_order: 0,
  is_active: true,
  inherited: false,
  ...over,
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchOrganizerEventDetail).mockResolvedValue({
    ok: true,
    event: { slug: 'fiesta', cover_image_url: 'x', parking_maps_url: null, parking_maps_resolved_url: null },
  } as never)
})

describe('TicketsView · parking heredado', () => {
  it('en un evento muestra los tipos del estacionamiento aparte y sin acciones', async () => {
    jest.mocked(fetchTickets).mockResolvedValue({
      ok: true,
      tickets: [
        ticket({ id: 'own', name: 'VIP propio' }),
        ticket({ id: 'inh', name: 'Moto heredada', inherited: true }),
      ],
    })
    render(<TicketsView eventId="ev-1" kind="parking" />)

    expect(await screen.findByText('VIP propio')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Del estacionamiento' })).toBeInTheDocument()
    expect(screen.getByText('Moto heredada')).toBeInTheDocument()
    expect(screen.getByText('Del estacionamiento', { selector: 'span' })).toBeInTheDocument()
    // Solo el tipo propio tiene menú de opciones; el heredado es de solo lectura.
    expect(screen.getByRole('button', { name: 'Opciones de VIP propio' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Opciones de Moto heredada' })).not.toBeInTheDocument()
    // En un evento sí hay reservas y link de venta.
    expect(screen.getByRole('tab', { name: /Reservas/ })).toBeInTheDocument()
    expect(screen.getByText('nubapay.test/parking/fiesta')).toBeInTheDocument()
  })

  it('un evento solo con tipos heredados explica de dónde salen en vez de mostrar el estado vacío', async () => {
    jest.mocked(fetchTickets).mockResolvedValue({
      ok: true,
      tickets: [ticket({ id: 'inh', name: 'Auto', inherited: true })],
    })
    render(<TicketsView eventId="ev-1" kind="parking" />)
    expect(await screen.findByText(/Este evento usa los tipos de vehículo de tu estacionamiento/)).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay vehículos')).not.toBeInTheDocument()
  })

  it('en el panel del estacionamiento (scope account) no hay link de venta ni ocupación, pero sí reservas', async () => {
    jest.mocked(fetchTickets).mockResolvedValue({
      ok: true,
      tickets: [ticket({ id: 'base', name: 'Auto', stock: 50, sold: 500 })],
    })
    render(<TicketsView eventId="base-1" kind="parking" scope="account" />)

    expect(await screen.findByText('Auto')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vehículos' })).toBeInTheDocument()
    expect(screen.getByText(/lugares por evento/)).toBeInTheDocument()
    // Las reservas del estacionamiento son las de todos sus eventos.
    expect(screen.getByRole('tab', { name: /Reservas/ })).toBeInTheDocument()
    expect(screen.queryByText(/nubapay\.test\/parking/)).not.toBeInTheDocument()
    // El vendido total (de todos los eventos) no se mezcla con el cupo, que es por evento.
    expect(screen.queryByText(/vendidos/)).not.toBeInTheDocument()
  })

  it('el formulario de un tipo de vehículo del estacionamiento habla de lugares por evento y se puede cerrar', async () => {
    jest.mocked(fetchTickets).mockResolvedValue({ ok: true, tickets: [ticket({ id: 'base', name: 'Auto' })] })
    const { getByRole, findByText, queryByText } = render(<TicketsView eventId="base-1" kind="parking" scope="account" />)
    await findByText('Auto')
    getByRole('button', { name: 'Nuevo vehículo' }).click()
    expect(await findByText('Lugares por evento')).toBeInTheDocument()
    expect(getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    // Sin el texto del DNI en la ayuda de parking.
    expect(queryByText(/DNI del titular/)).not.toBeInTheDocument()
  })
})
