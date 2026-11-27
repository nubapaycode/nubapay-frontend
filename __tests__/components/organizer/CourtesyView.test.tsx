import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CourtesyView } from '@/components/organizer/CourtesyView'
import { createCourtesy, fetchCourtesies } from '@/lib/courtesies'
import { fetchTickets, type WorkspaceTicket } from '@/lib/organizerWorkspace'

jest.mock('@/lib/courtesies', () => ({ createCourtesy: jest.fn(), fetchCourtesies: jest.fn() }))
jest.mock('@/lib/organizerWorkspace', () => ({ fetchTickets: jest.fn() }))

const t = (id: string, name: string, kind: 'parking' | 'ticket'): WorkspaceTicket =>
  ({ id, name, kind, description: '', price: 1000, currency: 'ARS', stock: null, sold: 0, sort_order: 0, is_active: true }) as WorkspaceTicket

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchCourtesies).mockResolvedValue({ ok: true, data: [] })
  jest.mocked(fetchTickets).mockImplementation(async (_ev, kind) => ({
    ok: true,
    tickets: kind === 'parking' ? [t('auto', 'Auto', 'parking')] : [t('gral', 'General', 'ticket')],
  }))
})

describe('CourtesyView', () => {
  it('con solo parking no pregunta el tipo: pide patente y DNI y genera', async () => {
    jest.mocked(createCourtesy).mockResolvedValue({
      ok: true,
      data: { id: 'o1', order_number: 12, event_id: 'ev', event_name: null, customer_name: 'Ana', customer_email: 'ana@x.com', vehicle_plate: 'AB123CD', item: 'Auto', quantity: 1, status: 'paid', created_at: null },
    })
    const user = userEvent.setup()
    render(<CourtesyView eventId="ev" modules={['parking']} />)
    expect(screen.queryByRole('radiogroup', { name: 'Tipo de cortesía' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Auto' })).toBeInTheDocument())
    await user.type(screen.getByLabelText('Nombre y apellido'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Email'), 'ana@x.com')
    await user.type(screen.getByLabelText('Patente'), 'AB123CD')
    await user.type(screen.getByLabelText('DNI del titular'), '30123456')
    await user.click(screen.getByRole('button', { name: /Generar cortesía/ }))
    await waitFor(() =>
      expect(createCourtesy).toHaveBeenCalledWith('ev', expect.objectContaining({
        kind: 'parking', ticket_id: 'auto', customer_name: 'Ana Pérez', customer_email: 'ana@x.com', vehicle_plate: 'AB123CD', customer_dni: '30123456',
      })),
    )
    expect(await screen.findByRole('status')).toHaveTextContent('le mandamos el QR a ana@x.com')
    // El formulario queda listo para la siguiente.
    expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('')
    expect(fetchCourtesies).toHaveBeenCalledTimes(2)
  })

  it('con parking y entradas deja elegir; la entrada pide cantidad y no patente', async () => {
    const user = userEvent.setup()
    render(<CourtesyView eventId="ev" modules={['parking', 'tickets']} />)
    await user.click(screen.getByRole('radio', { name: 'Entrada' }))
    await waitFor(() => expect(screen.getByRole('radio', { name: 'General' })).toBeInTheDocument())
    expect(screen.getByLabelText('Cantidad')).toBeInTheDocument()
    expect(screen.queryByLabelText('Patente')).not.toBeInTheDocument()
  })

  it('muestra el error del servidor (ej. patente repetida)', async () => {
    jest.mocked(createCourtesy).mockResolvedValue({ ok: false, error: 'Esta patente ya tiene un lugar de parking para este evento.', field: 'vehicle_plate' })
    const user = userEvent.setup()
    render(<CourtesyView eventId="ev" modules={['parking']} />)
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Auto' })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Generar cortesía/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Esta patente ya tiene un lugar')
    expect(screen.getByLabelText('Patente')).toHaveClass('border-red-300')
  })

  it('en el panel del estacionamiento primero se elige el evento', async () => {
    const user = userEvent.setup()
    render(<CourtesyView eventId="base" modules={['parking']} events={[{ id: 'ev1', name: 'Festival Uno' }]} />)
    expect(screen.getByRole('button', { name: /Generar cortesía/ })).toBeDisabled()
    expect(fetchTickets).not.toHaveBeenCalled()
    await user.selectOptions(screen.getByLabelText('Evento'), 'ev1')
    await waitFor(() => expect(fetchTickets).toHaveBeenCalledWith('ev1', 'parking'))
    // La lista de cortesías es la de todo el estacionamiento.
    expect(fetchCourtesies).toHaveBeenCalledWith('base')
  })

  it('sin parking ni entradas lo avisa', () => {
    render(<CourtesyView eventId="ev" modules={['catalogo']} />)
    expect(screen.getByText('Tu cuenta no tiene parking ni entradas habilitados.')).toBeInTheDocument()
  })
})
