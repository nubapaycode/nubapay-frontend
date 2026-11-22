import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketsView } from '@/components/organizer/TicketsView'
import { fetchOrganizerEventDetail } from '@/lib/organizerEvents'
import { createTicket, deleteTicket, fetchTickets, patchTicket, reorderTickets } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchTickets: jest.fn(),
  createTicket: jest.fn(),
  patchTicket: jest.fn(),
  deleteTicket: jest.fn(),
  reorderTickets: jest.fn(),
}))
jest.mock('qrcode.react', () => ({ QRCodeCanvas: () => <canvas aria-label="Código QR del link de tickets" /> }))

const eventId = 'event-1'
const general = {
  id: 'tk-1',
  name: 'Entrada general',
  description: '',
  price: 5000,
  currency: 'ARS',
  stock: null,
  sold: 0,
  sort_order: 0,
  is_active: true,
}

jest.mock('@/lib/organizerEvents', () => ({
  fetchOrganizerEventDetail: jest.fn().mockResolvedValue({
    ok: true,
    event: { slug: 'mi-fiesta', cover_image_url: 'https://x/y.jpg', parking_maps_url: 'https://maps.app.goo.gl/abc' },
  }),
  patchOrganizerEvent: jest.fn(),
}))
jest.mock('@/lib/hooks/usePublicOrigin', () => ({ usePublicOrigin: () => 'https://org.nubapay.app' }))

beforeEach(() => jest.clearAllMocks())

describe('TicketsView', () => {
  it('lista los tickets del evento', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [general] })
    render(<TicketsView eventId={eventId} />)
    expect(await screen.findByText('Entrada general')).toBeInTheDocument()
    expect(screen.getByText(/5.000/)).toBeInTheDocument()
  })

  it('muestra el link público de tickets del evento', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} />)
    expect(await screen.findByText('org.nubapay.app/tickets/mi-fiesta')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir/ })).toHaveAttribute('href', 'https://org.nubapay.app/tickets/mi-fiesta')
    expect(screen.getByRole('button', { name: /Copiar/ })).toBeInTheDocument()
  })

  it('muestra el estado vacío', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} />)
    expect(await screen.findByText('Todavía no hay tickets')).toBeInTheDocument()
  })

  it('crea un ticket con categoría personalizada y precio', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    ;(createTicket as jest.Mock).mockResolvedValue({
      ok: true,
      ticket: { ...general, id: 'tk-2', name: 'Parking VIP', price: 12000 },
    })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Crear ticket' }))
    await userEvent.type(screen.getByPlaceholderText(/Entrada general, Parking VIP/), 'Parking VIP')
    await userEvent.type(screen.getByPlaceholderText('0'), '12000')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(createTicket).toHaveBeenCalledWith(eventId, { name: 'Parking VIP', description: '', price: 12000, stock: null, kind: 'ticket' }),
    )
    expect(await screen.findByText('Parking VIP')).toBeInTheDocument()
  })

  it('muestra vendidos/stock y marca agotado', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({
      ok: true,
      tickets: [
        { ...general, stock: 100, sold: 40 },
        { ...general, id: 'tk-2', name: 'Parking VIP', stock: 10, sold: 10 },
      ],
    })
    render(<TicketsView eventId={eventId} />)
    expect(await screen.findByText(/de 100 vendidos/)).toHaveTextContent('40 de 100 vendidos')
    expect(screen.getByText('Agotado · 10/10')).toBeInTheDocument()
    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })

  it('envía el stock máximo cuando se completa', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    ;(createTicket as jest.Mock).mockResolvedValue({ ok: true, ticket: { ...general, stock: 50 } })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Crear ticket' }))
    await userEvent.type(screen.getByPlaceholderText(/Entrada general, Parking VIP/), 'Entrada general')
    await userEvent.type(screen.getByPlaceholderText('0'), '5000')
    await userEvent.type(screen.getByPlaceholderText('Sin límite'), '50')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(createTicket).toHaveBeenCalledWith(eventId, expect.objectContaining({ stock: 50 })),
    )
  })

  it('rechaza un stock inválido', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Crear ticket' }))
    await userEvent.type(screen.getByPlaceholderText(/Entrada general, Parking VIP/), 'Entrada general')
    await userEvent.type(screen.getByPlaceholderText('0'), '5000')
    await userEvent.type(screen.getByPlaceholderText('Sin límite'), '2.5')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/stock/i)
    expect(createTicket).not.toHaveBeenCalled()
  })

  it('valida nombre y precio antes de guardar', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Crear ticket' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/nombre/i)
    expect(createTicket).not.toHaveBeenCalled()
  })

  it('elimina un ticket tras confirmar', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [general] })
    ;(deleteTicket as jest.Mock).mockResolvedValue({ ok: true })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Opciones de Entrada general' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(deleteTicket).toHaveBeenCalledWith(eventId, 'tk-1'))
    // Queda el estado vacío (que tiene una plantilla con el mismo nombre): se mira el título de la tarjeta.
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Entrada general' })).not.toBeInTheDocument())
    expect(screen.getByText('Todavía no hay tickets')).toBeInTheDocument()
  })

  it('las plantillas abren el formulario con el nombre puesto y muestran la vista previa', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'VIP' }))
    expect(screen.getByPlaceholderText(/Entrada general, Parking VIP/)).toHaveValue('VIP')
    await userEvent.type(screen.getByPlaceholderText('0'), '9000')
    expect(screen.getByText('Vista previa')).toBeInTheDocument()
    expect(screen.getByText(/9\.000/)).toBeInTheDocument()
  })

  it('muestra el QR del link al pedirlo', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'QR' }))
    expect(screen.getByLabelText('Código QR del link de tickets')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar PNG/ })).toBeInTheDocument()
  })

  it('duplica un ticket pausado', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [general] })
    ;(createTicket as jest.Mock).mockResolvedValue({ ok: true, ticket: { ...general, id: 'tk-9', name: 'Entrada general (copia)', is_active: false } })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Opciones de Entrada general' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicar' }))
    await waitFor(() =>
      expect(createTicket).toHaveBeenCalledWith(eventId, expect.objectContaining({ name: 'Entrada general (copia)', is_active: false })),
    )
    expect(await screen.findByText('Entrada general (copia)')).toBeInTheDocument()
  })

  it('cambia el orden con "Bajar" y lo guarda', async () => {
    const vip = { ...general, id: 'tk-2', name: 'VIP' }
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [general, vip] })
    ;(reorderTickets as jest.Mock).mockResolvedValue({ ok: true })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Opciones de Entrada general' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Bajar' }))
    await waitFor(() => expect(reorderTickets).toHaveBeenCalledWith(eventId, ['tk-2', 'tk-1'], 'ticket'))
  })

  it('pausa la venta con el interruptor', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [general] })
    ;(patchTicket as jest.Mock).mockResolvedValue({ ok: true, ticket: { ...general, is_active: false } })
    render(<TicketsView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('checkbox', { name: /Pausar Entrada general/ }))
    await waitFor(() => expect(patchTicket).toHaveBeenCalledWith(eventId, 'tk-1', { is_active: false }))
    expect(await screen.findByText('Pausado', { selector: 'span.rounded-full' })).toBeInTheDocument()
  })

  it('pide las entradas (kind=ticket) y no ofrece la plantilla de parking', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} />)
    await screen.findByRole('button', { name: 'Crear ticket' })
    expect(fetchTickets).toHaveBeenCalledWith(eventId, 'ticket')
    expect(screen.queryByRole('button', { name: 'Auto' })).not.toBeInTheDocument()
    expect(screen.queryByText('Ubicación del estacionamiento')).not.toBeInTheDocument()
  })
})

describe('TicketsView · parking', () => {
  const auto = { ...general, id: 'pk-1', kind: 'parking', icon: 'car', name: 'Auto', price: 3000 }

  it('lista los vehículos pidiendo kind=parking', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [auto] })
    render(<TicketsView eventId={eventId} kind="parking" />)
    expect(await screen.findByText('Auto')).toBeInTheDocument()
    expect(fetchTickets).toHaveBeenCalledWith(eventId, 'parking')
    expect(screen.getByRole('heading', { name: 'Parking' })).toBeInTheDocument()
  })

  it('muestra el link de venta /parking y el mapa del estacionamiento', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} kind="parking" />)
    expect(await screen.findByText('org.nubapay.app/parking/mi-fiesta')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir$/ })).toHaveAttribute('href', 'https://org.nubapay.app/parking/mi-fiesta')
    expect(await screen.findByLabelText('Link de Google Maps')).toHaveValue('https://maps.app.goo.gl/abc')
  })

  it('con un link corto muestra la vista previa usando la URL resuelta por el servidor', async () => {
    ;(fetchOrganizerEventDetail as jest.Mock).mockResolvedValueOnce({
      ok: true,
      event: {
        slug: 'mi-fiesta',
        cover_image_url: 'https://x/y.jpg',
        parking_maps_url: 'https://maps.app.goo.gl/abc',
        parking_maps_resolved_url: 'https://www.google.com/maps/place/X/@-31.3,-64.2,17z/data=!3d-31.377768!4d-64.245147',
      },
    })
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} kind="parking" />)
    const preview = await screen.findByTitle('Mapa del estacionamiento')
    expect(preview).toHaveAttribute('src', 'https://www.google.com/maps?q=-31.377768%2C-64.245147&output=embed')
  })

  it('con un link corto sin resolver no hay vista previa, pero el link queda guardado', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} kind="parking" />)
    expect(await screen.findByLabelText('Link de Google Maps')).toHaveValue('https://maps.app.goo.gl/abc')
    expect(screen.queryByTitle('Mapa del estacionamiento')).not.toBeInTheDocument()
  })

  it('crea un vehículo con tipo, ícono elegido y precio', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    ;(createTicket as jest.Mock).mockResolvedValue({
      ok: true,
      ticket: { ...auto, id: 'pk-2', name: 'Moto', icon: 'motorcycle', price: 1500 },
    })
    render(<TicketsView eventId={eventId} kind="parking" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Crear vehículo' }))
    await userEvent.type(screen.getByPlaceholderText(/Auto, Moto, Camioneta/), 'Moto')
    await userEvent.click(screen.getByRole('radio', { name: 'Moto' }))
    await userEvent.type(screen.getByPlaceholderText('0'), '1500')
    // El mapa del estacionamiento también tiene su "Guardar"; el del formulario es el último de la página.
    await userEvent.click(screen.getAllByRole('button', { name: 'Guardar' }).at(-1)!)
    await waitFor(() =>
      expect(createTicket).toHaveBeenCalledWith(eventId, {
        name: 'Moto',
        description: '',
        price: 1500,
        stock: null,
        icon: 'motorcycle',
        kind: 'parking',
      }),
    )
    expect(await screen.findByText('Moto')).toBeInTheDocument()
  })

  it('arranca la plantilla con el ícono del vehículo', async () => {
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [] })
    render(<TicketsView eventId={eventId} kind="parking" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Camioneta' }))
    expect(screen.getByPlaceholderText(/Auto, Moto, Camioneta/)).toHaveValue('Camioneta')
    expect(screen.getByRole('radio', { name: 'Camioneta' })).toHaveAttribute('aria-checked', 'true')
  })

  it('guarda el orden con el kind de parking', async () => {
    const moto = { ...auto, id: 'pk-2', name: 'Moto' }
    ;(fetchTickets as jest.Mock).mockResolvedValue({ ok: true, tickets: [auto, moto] })
    ;(reorderTickets as jest.Mock).mockResolvedValue({ ok: true })
    render(<TicketsView eventId={eventId} kind="parking" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Opciones de Auto' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Bajar' }))
    await waitFor(() => expect(reorderTickets).toHaveBeenCalledWith(eventId, ['pk-2', 'pk-1'], 'parking'))
  })
})
