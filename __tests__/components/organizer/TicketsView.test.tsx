import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketsView } from '@/components/organizer/TicketsView'
import { createTicket, deleteTicket, fetchTickets } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchTickets: jest.fn(),
  createTicket: jest.fn(),
  patchTicket: jest.fn(),
  deleteTicket: jest.fn(),
}))

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
  fetchOrganizerEventDetail: jest.fn().mockResolvedValue({ ok: true, event: { slug: 'mi-fiesta', cover_image_url: 'https://x/y.jpg' } }),
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
    expect(await screen.findByText('https://org.nubapay.app/tickets/mi-fiesta')).toBeInTheDocument()
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
      expect(createTicket).toHaveBeenCalledWith(eventId, { name: 'Parking VIP', description: '', price: 12000, stock: null }),
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
    expect(await screen.findByText('40/100 vendidos')).toBeInTheDocument()
    expect(screen.getByText('Agotado · 10/10')).toBeInTheDocument()
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
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Entrada general' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(deleteTicket).toHaveBeenCalledWith(eventId, 'tk-1'))
    await waitFor(() => expect(screen.queryByText('Entrada general')).not.toBeInTheDocument())
  })
})
