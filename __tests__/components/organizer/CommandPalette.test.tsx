import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandPalette } from '@/components/organizer/CommandPalette'
import { OPEN_ORDER_EVENT } from '@/components/organizer/commandEvents'
import { fetchWorkspaceOrders } from '@/lib/organizerWorkspace'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
jest.mock('@/lib/organizerWorkspace', () => ({
  fetchWorkspaceOrders: jest.fn(),
  downloadOrdersCsv: jest.fn(),
}))
jest.mock('@/components/organizer/OrganizerThemeBridge', () => ({ useOrganizerPublicTheme: () => null }))

const allTools = {
  dashboard: true,
  storefront: true,
  products: true,
  scanner: true,
  orders: true,
  pickup_points: true,
  payments: true,
}

const order = {
  id: 'order-1',
  eventId: 'ev',
  orderNumber: 567,
  items: [{ productId: 'p', name: 'Agua', price: 151, quantity: 1 }],
  total: 151,
  status: 'pending' as const,
  qrToken: 't',
  createdAt: '2026-10-26T12:00:00.000Z',
  updatedAt: '2026-10-26T12:00:00.000Z',
  customerName: 'Facu',
}

function renderPalette(pathname = '/events/ev/dashboard', tools = allTools) {
  render(<CommandPalette eventId="ev" basePath="/events/ev" pathname={pathname} tools={tools} membership="owner" />)
}

const openPalette = () => fireEvent.keyDown(document, { key: 'k', metaKey: true })

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchWorkspaceOrders).mockResolvedValue({
    ok: true,
    orders: [order],
    pagination: { page: 1, page_size: 5, total: 1 },
    statusCounts: null,
    summary: null,
  })
})

describe('CommandPalette', () => {
  it('se abre con ⌘K y se cierra con Esc', async () => {
    renderPalette()
    expect(screen.queryByRole('dialog', { name: 'Buscador' })).not.toBeInTheDocument()
    openPalette()
    expect(await screen.findByRole('dialog', { name: 'Buscador' })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Buscador' })).not.toBeInTheDocument()
  })

  it('filtra herramientas sin importar tildes y navega con Enter', async () => {
    renderPalette()
    openPalette()
    await userEvent.type(await screen.findByRole('combobox'), 'configuracion')
    expect(screen.getByRole('option', { name: /Configuración/ })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/events/ev/config')
  })

  it('no muestra herramientas sin permiso', async () => {
    renderPalette('/events/ev/dashboard', { ...allTools, orders: false })
    openPalette()
    await screen.findByRole('combobox')
    expect(screen.queryByRole('option', { name: /^Pedidos/ })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Dashboard/ })).toBeInTheDocument()
  })

  it('busca pedidos y abre el elegido en Pedidos', async () => {
    renderPalette()
    openPalette()
    await userEvent.type(await screen.findByRole('combobox'), '#567')
    const result = await screen.findByRole('option', { name: /#567 · Facu/ })
    expect(fetchWorkspaceOrders).toHaveBeenLastCalledWith('ev', expect.objectContaining({ q: '567' }))
    await userEvent.click(result)
    expect(push).toHaveBeenCalledWith('/events/ev/orders?pedido=order-1')
  })

  it('si ya está en Pedidos, abre el pedido sin navegar', async () => {
    const onOpen = jest.fn()
    window.addEventListener(OPEN_ORDER_EVENT, onOpen)
    renderPalette('/events/ev/orders')
    openPalette()
    await userEvent.type(await screen.findByRole('combobox'), 'facu')
    await userEvent.click(await screen.findByRole('option', { name: /#567 · Facu/ }))
    await waitFor(() => expect(onOpen).toHaveBeenCalled())
    expect(push).not.toHaveBeenCalled()
    window.removeEventListener(OPEN_ORDER_EVENT, onOpen)
  })
})
