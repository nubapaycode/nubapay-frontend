import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketCheckoutView } from '@/components/buyer/TicketCheckoutView'
import { browserFetch } from '@/lib/browserFetch'
import type { Event } from '@/types'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))

const freeEvent: Event = {
  id: 'e1',
  name: 'Fiesta',
  description: '',
  date: '2026-07-15T18:00:00Z',
  venue: 'Playa Norte',
  products: [],
  combos: [],
  blocks: [],
  tickets: [],
  parking: [{ id: 'p0', kind: 'parking', icon: 'car', name: 'Auto', description: '', price: 0, available: true }],
  serviceFeePercent: { ticket: 5, product: 2 },
  categories: [],
  showCategoryShortcuts: false,
  paymentsEnabled: true,
}

function selectFree() {
  sessionStorage.setItem(
    'nubapay_ticket_selection',
    JSON.stringify({ slug: 'fiesta#parking', lines: [{ ticketId: 'p0', quantity: 1 }], expiresAt: Date.now() + 600000 }),
  )
}

async function fillAll() {
  await userEvent.type(screen.getByLabelText('Nombre y apellido'), 'Ana Pérez')
  await userEvent.type(screen.getByLabelText('Email'), 'ana@mail.com')
  await userEvent.type(screen.getByLabelText('Repetir email'), 'ana@mail.com')
  await userEvent.type(screen.getByLabelText('Teléfono'), '11 5555-1234')
  await userEvent.type(screen.getByLabelText('Patente'), 'AB123CD')
  await userEvent.type(screen.getByLabelText('DNI del titular'), '30123456')
}

beforeEach(() => {
  sessionStorage.clear()
  push.mockClear()
  jest.mocked(browserFetch).mockReset()
})

describe('Parking sin cargo', () => {
  it('no pide medio de pago, no pre-crea el pedido y lo confirma de una con "free"', async () => {
    jest.mocked(browserFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ order_id: 'o1', order_number: 7 }),
    } as Response)
    selectFree()
    // Sin medios de pago configurados: igual se puede reservar porque no hay nada que cobrar.
    render(<TicketCheckoutView event={freeEvent} catalogSlug="fiesta" availablePaymentMethods={[]} kind="parking" />)
    expect(screen.getAllByText('Sin cargo').length).toBeGreaterThan(0)
    expect(screen.getByText(/Este lugar es sin cargo/)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Medio de pago' })).not.toBeInTheDocument()
    // No se crea nada antes de confirmar (el QR tiene que salir con los datos del comprador).
    expect(browserFetch).not.toHaveBeenCalled()

    await fillAll()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringContaining('/order/o1')))
    const [, init] = jest.mocked(browserFetch).mock.calls[0]
    const body = JSON.parse(String(init?.body))
    expect(body.payment_method).toBe('free')
    expect(body.vehicle_plate).toBe('AB123CD')
    expect(body.customer_email).toBe('ana@mail.com')
  })

  it('un parking con precio sigue pidiendo medio de pago', () => {
    sessionStorage.setItem(
      'nubapay_ticket_selection',
      JSON.stringify({ slug: 'fiesta#parking', lines: [{ ticketId: 'p1', quantity: 1 }], expiresAt: Date.now() + 600000 }),
    )
    const paid = { ...freeEvent, parking: [{ ...freeEvent.parking![0], id: 'p1', price: 3000 }] }
    render(<TicketCheckoutView event={paid} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeInTheDocument()
    expect(screen.queryByText(/Este lugar es sin cargo/)).not.toBeInTheDocument()
  })
})

describe('Parking sin cargo · página de venta', () => {
  it('el vehículo a $0 dice "Sin cargo" en la lista y en la barra, y el botón es "Reservar"', async () => {
    const { TicketsStoreView } = await import('@/components/buyer/TicketsStoreView')
    const event = {
      ...freeEvent,
      parking: [
        { id: 'p0', kind: 'parking' as const, icon: 'car', name: 'Auto', description: '', price: 0, available: true },
        { id: 'p1', kind: 'parking' as const, icon: 'motorcycle', name: 'Moto', description: '', price: 1500, available: true },
      ],
      modules: ['parking'],
    }
    render(<TicketsStoreView event={event} catalogSlug="fiesta" kind="parking" />)
    const auto = screen.getByText('Auto').closest('button, label, [role="radio"]') as HTMLElement
    expect(auto).toHaveTextContent('Sin cargo')
    expect(screen.queryByText(/\$\s?0(?![\d.])/)).not.toBeInTheDocument()
    await userEvent.click(auto)
    expect(await screen.findByRole('button', { name: 'Reservar' })).toBeInTheDocument()
    expect(screen.getAllByText('Sin cargo').length).toBeGreaterThan(1)
  })
})
