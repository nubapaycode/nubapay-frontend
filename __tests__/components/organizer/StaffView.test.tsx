import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { StaffView } from '@/components/organizer/StaffView'
import { ORGANIZER_ZERO_TOOLS } from '@/lib/organizerStaffTools'
import { fetchEventStaffList, inviteEventStaff } from '@/lib/organizerStaff'

jest.mock('@/lib/organizerStaff', () => ({
  deleteEventStaff: jest.fn(),
  fetchEventStaffList: jest.fn(),
  inviteEventStaff: jest.fn(),
  patchEventStaff: jest.fn(),
  resendEventStaffInviteEmail: jest.fn(),
}))

const eventId = 'event-1'
const scanner = { ...ORGANIZER_ZERO_TOOLS, scanner: true }
const member = (id: string, name: string, role: string, tools = scanner) => ({
  id,
  user_id: `u-${id}`,
  email: `${id}@example.com`,
  name,
  role,
  tools,
})

const staff = [
  member('1', 'Ignacio Díaz', 'acreditador general'),
  member('2', 'Orne Boccardo', 'acreditador general'),
  member('3', 'Agustina Binetti', 'acreditadora general'),
  member('4', 'Paula Massi', 'acrediacion general'),
  member('6', 'Jere Valverdi', 'acreditacion general'),
  member('5', 'Facu Oliva', 'Produccion', { ...ORGANIZER_ZERO_TOOLS, dashboard: true, orders: true }),
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchEventStaffList as jest.Mock).mockResolvedValue({ ok: true, staff })
})

async function renderLoaded() {
  render(<StaffView eventId={eventId} />)
  await screen.findByText('Ignacio Díaz')
}

describe('StaffView', () => {
  it('lista el equipo y filtra por rol', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /^Rol/ }))
    await userEvent.click(screen.getByRole('option', { name: /Produccion · 1/ }))
    expect(screen.getByRole('button', { name: /^Rol: Produccion/ })).toBeInTheDocument()
    expect(screen.getByText('Facu Oliva')).toBeInTheDocument()
    expect(screen.queryByText('Ignacio Díaz')).not.toBeInTheDocument()
  })

  it('al invitar, una plantilla completa el rol y las herramientas', async () => {
    ;(inviteEventStaff as jest.Mock).mockResolvedValue({ ok: true, email_sent: true })
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /Invitar integrante/ }))
    await userEvent.click(screen.getByRole('button', { name: /Barra/ }))
    expect(screen.getByPlaceholderText(/Rol \(ej\./)).toHaveValue('Barra')
    await userEvent.type(screen.getByPlaceholderText('Nombre *'), 'Nueva Persona')
    await userEvent.type(screen.getByPlaceholderText('Email *'), 'nueva@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
    await waitFor(() =>
      expect(inviteEventStaff).toHaveBeenCalledWith(eventId, {
        email: 'nueva@example.com',
        name: 'Nueva Persona',
        role: 'Barra',
        tools: { ...ORGANIZER_ZERO_TOOLS, orders: true, scanner: true },
      }),
    )
  })

  it('si el rol ya existe, ofrece copiar sus herramientas', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /Invitar integrante/ }))
    await userEvent.type(screen.getByPlaceholderText(/Rol \(ej\./), 'Produccion')
    await userEvent.click(screen.getByRole('button', { name: /Usar las herramientas que ya tiene este rol \(Dashboard, Pedidos\)/ }))
    expect(screen.queryByRole('button', { name: /Usar las herramientas/ })).not.toBeInTheDocument()
  })
})
