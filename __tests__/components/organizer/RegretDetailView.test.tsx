import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RegretDetailView } from '@/components/organizer/RegretDetailView'
import { fetchRegret, patchOrderStatus } from '@/lib/organizerWorkspace'
import type { Order } from '@/types'

jest.mock('@/lib/organizerWorkspace', () => ({
  fetchRegret: jest.fn(),
  patchOrderStatus: jest.fn(),
  patchRegretStatus: jest.fn(),
}))

const regret = {
  id: 'r1',
  eventId: 'e1',
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  bankAlias: 'ana.perez.mp',
  whatsapp: '+54 9 11 1234 5678',
  purchaseDetail: '2 entradas generales',
  screenshotUrl: 'https://cdn.test/shot.webp',
  status: 'pending' as const,
  createdAt: '2026-11-01T15:00:00',
  orderCount: 2,
}

function order(over: Partial<Order>): Order {
  return {
    id: 'o1',
    orderNumber: 12,
    eventId: 'e1',
    customerName: 'Ana Pérez',
    customerEmail: 'ana@example.com',
    items: [{ id: 'i1', productId: 'p1', name: 'Entrada general', price: 5000, quantity: 2 } as never],
    total: 10000,
    status: 'pending',
    qrToken: 'tok',
    createdAt: '2026-11-01T14:00:00',
    updatedAt: '2026-11-01T14:00:00',
    ...over,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchRegret).mockResolvedValue({
    ok: true,
    regret,
    orders: [order({}), order({ id: 'o2', orderNumber: 13, status: 'delivered' })],
  })
})

describe('RegretDetailView', () => {
  it('lista los pedidos asociados y solo permite cancelar el QR de los que no están entregados ni cancelados', async () => {
    render(<RegretDetailView eventId="e1" regretId="r1" />)
    await screen.findByText('Pedido #12')
    expect(screen.getAllByRole('button', { name: 'Cancelar QR' })).toHaveLength(1)
    expect(screen.getByText('Ya entregado')).toBeInTheDocument()
  })

  it('pide confirmación, avisa que no devuelve el pago y recién ahí cancela el QR', async () => {
    jest.mocked(patchOrderStatus).mockResolvedValue({
      ok: true,
      order: order({ status: 'cancelled' }),
    })
    const user = userEvent.setup()
    render(<RegretDetailView eventId="e1" regretId="r1" />)
    await user.click(await screen.findByRole('button', { name: 'Cancelar QR' }))

    expect(patchOrderStatus).not.toHaveBeenCalled()
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Esto solo cancela el QR y no devuelve el pago')

    await user.click(within(screen.getByTestId('modal-overlay')).getByRole('button', { name: 'Sí, cancelar QR' }))
    await waitFor(() => expect(patchOrderStatus).toHaveBeenCalledWith('e1', 'o1', 'cancelled'))
    expect(await screen.findByText('QR cancelado')).toBeInTheDocument()
  })
})
