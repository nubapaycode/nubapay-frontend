import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { UsersTab } from '@/components/admin/UsersTab'
import { ToastProvider } from '@/components/admin/ui'
import { fetchPlatformUsersFiltered, setUserModules } from '@/lib/platformAdmin'

jest.mock('@/lib/platformAdmin', () => ({
  fetchPlatformUsersFiltered: jest.fn(),
  setUserModules: jest.fn(),
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
