import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { UsersTab } from '@/components/admin/UsersTab'
import { ToastProvider } from '@/components/admin/ui'
import { fetchPlatformUsersFiltered, setUserModules, setUserWhatsApp } from '@/lib/platformAdmin'

jest.mock('@/lib/platformAdmin', () => ({
  fetchPlatformUsersFiltered: jest.fn(),
  setUserModules: jest.fn(),
  setUserWhatsApp: jest.fn(),
}))

const user = (over: object = {}) => ({
  id: 'u1',
  name: 'Ana',
  email: 'ana@x.com',
  role: 'ORGANIZER',
  partner: false,
  tenant_id: 't1',
  tenant_subdomain: 'platform',
  created_at: null,
  onboarding_completed: true,
  ...over,
})

function mockUsers(users: object[]) {
  ;(fetchPlatformUsersFiltered as jest.Mock).mockResolvedValue({
    ok: true,
    data: { users, pagination: { page: 1, page_size: 25, total: users.length } },
  })
}

const renderTab = () =>
  render(
    <ToastProvider>
      <UsersTab />
    </ToastProvider>,
  )

beforeEach(() => jest.clearAllMocks())

describe('UsersTab · herramientas por usuario', () => {
  it('un usuario sin configuración tiene Catálogo y Tickets, y no Parking', async () => {
    mockUsers([user()])
    renderTab()
    expect(await screen.findByRole('switch', { name: 'Catálogo para Ana' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Tickets para Ana' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Parking para Ana' })).not.toBeChecked()
  })

  it('activar Parking guarda la lista completa de módulos', async () => {
    mockUsers([user({ modules: ['catalogo', 'tickets'] })])
    ;(setUserModules as jest.Mock).mockResolvedValue({ ok: true, data: { ok: true, modules: ['catalogo', 'tickets', 'parking'] } })
    renderTab()
    await userEvent.click(await screen.findByRole('switch', { name: 'Parking para Ana' }))
    await waitFor(() => expect(setUserModules).toHaveBeenCalledWith('u1', ['catalogo', 'tickets', 'parking']))
    expect(screen.getByRole('switch', { name: 'Parking para Ana' })).toBeChecked()
  })

  it('desactivar un módulo conserva los demás', async () => {
    mockUsers([user({ modules: ['catalogo', 'tickets', 'parking'] })])
    ;(setUserModules as jest.Mock).mockResolvedValue({ ok: true, data: { ok: true, modules: ['catalogo', 'parking'] } })
    renderTab()
    await userEvent.click(await screen.findByRole('switch', { name: 'Tickets para Ana' }))
    await waitFor(() => expect(setUserModules).toHaveBeenCalledWith('u1', ['catalogo', 'parking']))
    expect(screen.getByRole('switch', { name: 'Tickets para Ana' })).not.toBeChecked()
  })

  it('si el servidor falla, el switch vuelve a como estaba', async () => {
    mockUsers([user({ modules: ['catalogo', 'tickets'] })])
    ;(setUserModules as jest.Mock).mockResolvedValue({ ok: false, error: 'Sin permiso' })
    renderTab()
    await userEvent.click(await screen.findByRole('switch', { name: 'Parking para Ana' }))
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Parking para Ana' })).not.toBeChecked()
  })
})

describe('UsersTab · WhatsApp por organizador', () => {
  it('un organizador sin configuración aparece con WhatsApp apagado y sin número', async () => {
    mockUsers([user()])
    renderTab()
    expect(await screen.findByRole('switch', { name: 'WhatsApp para Ana' })).not.toBeChecked()
    expect(screen.getByLabelText('WhatsApp del organizador Ana')).toHaveValue('')
  })

  it('muestra el estado y el número que ya tiene', async () => {
    mockUsers([user({ whatsapp_enabled: true, whatsapp_phone: '5491155551234' })])
    renderTab()
    expect(await screen.findByRole('switch', { name: 'WhatsApp para Ana' })).toBeChecked()
    expect(screen.getByLabelText('WhatsApp del organizador Ana')).toHaveValue('+5491155551234')
  })

  it('el interruptor activa WhatsApp sin tocar el número', async () => {
    mockUsers([user()])
    ;(setUserWhatsApp as jest.Mock).mockResolvedValue({ ok: true, data: { ok: true, whatsapp_enabled: true, whatsapp_phone: null } })
    renderTab()
    await userEvent.click(await screen.findByRole('switch', { name: 'WhatsApp para Ana' }))
    await waitFor(() => expect(setUserWhatsApp).toHaveBeenCalledWith('u1', { enabled: true }))
    expect(screen.getByRole('switch', { name: 'WhatsApp para Ana' })).toBeChecked()
  })

  it('si el servidor falla, el interruptor vuelve a como estaba', async () => {
    mockUsers([user()])
    ;(setUserWhatsApp as jest.Mock).mockResolvedValue({ ok: false, error: 'Sin permiso' })
    renderTab()
    await userEvent.click(await screen.findByRole('switch', { name: 'WhatsApp para Ana' }))
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'WhatsApp para Ana' })).not.toBeChecked()
  })

  it('al terminar de escribir el número lo guarda y muestra el normalizado que devuelve el servidor', async () => {
    mockUsers([user({ whatsapp_enabled: true })])
    ;(setUserWhatsApp as jest.Mock).mockResolvedValue({ ok: true, data: { ok: true, whatsapp_enabled: true, whatsapp_phone: '5491155551234' } })
    renderTab()
    const input = await screen.findByLabelText('WhatsApp del organizador Ana')
    await userEvent.type(input, '011 15 5555-1234')
    await userEvent.tab()
    await waitFor(() => expect(setUserWhatsApp).toHaveBeenCalledWith('u1', { phone: '011 15 5555-1234' }))
    await waitFor(() => expect(screen.getByLabelText('WhatsApp del organizador Ana')).toHaveValue('+5491155551234'))
  })

  it('con Enter también guarda', async () => {
    mockUsers([user({ whatsapp_enabled: true })])
    ;(setUserWhatsApp as jest.Mock).mockResolvedValue({ ok: true, data: { ok: true, whatsapp_enabled: true, whatsapp_phone: '5491155551234' } })
    renderTab()
    await userEvent.type(await screen.findByLabelText('WhatsApp del organizador Ana'), '1155551234{Enter}')
    await waitFor(() => expect(setUserWhatsApp).toHaveBeenCalledWith('u1', { phone: '1155551234' }))
  })

  it('si el número no es válido muestra el error del servidor y no lo da por guardado', async () => {
    mockUsers([user({ whatsapp_enabled: true, whatsapp_phone: '5491155551234' })])
    ;(setUserWhatsApp as jest.Mock).mockResolvedValue({ ok: false, error: 'Teléfono inválido. Usá el formato +54 9 11 5555-1234 (con código de área).' })
    renderTab()
    const input = await screen.findByLabelText('WhatsApp del organizador Ana')
    await userEvent.clear(input)
    await userEvent.type(input, '123')
    await userEvent.tab()
    expect(await screen.findByText(/Teléfono inválido/)).toBeInTheDocument()
    expect(setUserWhatsApp).toHaveBeenCalledTimes(1)
  })

  it('no guarda si no cambió el número', async () => {
    mockUsers([user({ whatsapp_enabled: true, whatsapp_phone: '5491155551234' })])
    renderTab()
    const input = await screen.findByLabelText('WhatsApp del organizador Ana')
    await userEvent.click(input)
    await userEvent.tab()
    expect(setUserWhatsApp).not.toHaveBeenCalled()
  })

  it('borrar el número lo guarda como vacío', async () => {
    mockUsers([user({ whatsapp_enabled: true, whatsapp_phone: '5491155551234' })])
    ;(setUserWhatsApp as jest.Mock).mockResolvedValue({ ok: true, data: { ok: true, whatsapp_enabled: true, whatsapp_phone: null } })
    renderTab()
    const input = await screen.findByLabelText('WhatsApp del organizador Ana')
    await userEvent.clear(input)
    await userEvent.tab()
    await waitFor(() => expect(setUserWhatsApp).toHaveBeenCalledWith('u1', { phone: '' }))
    await waitFor(() => expect(screen.getByLabelText('WhatsApp del organizador Ana')).toHaveValue(''))
  })
})

