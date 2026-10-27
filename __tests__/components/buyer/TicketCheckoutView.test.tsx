import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketCheckoutView, validateBuyer } from '@/components/buyer/TicketCheckoutView'
import { browserFetch } from '@/lib/browserFetch'
import type { Event } from '@/types'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))

const event: Event = {
  id: 'e1',
  name: 'Fiesta',
  description: '',
  date: '2026-07-15T18:00:00Z',
  venue: 'Teatro Flores',
  products: [],
  combos: [],
  blocks: [],
  tickets: [
    { id: 't1', kind: 'ticket', name: 'General', description: '', price: 30000, available: true },
    { id: 't2', kind: 'ticket', name: 'VIP', description: '', price: 50000, available: true },
  ],
  serviceFeePercent: { ticket: 5, product: 2 },
  categories: [],
  showCategoryShortcuts: false,
  paymentsEnabled: true,
}

function storeSelection(expiresAt = Date.now() + 10 * 60 * 1000) {
  sessionStorage.setItem(
    'nubapay_ticket_selection',
    JSON.stringify({ slug: 'fiesta', lines: [{ ticketId: 't1', quantity: 2 }], expiresAt }),
  )
}

const validBuyer = {
  name: 'Ana Pérez',
  email: 'ana@mail.com',
  emailConfirm: 'ANA@mail.com ',
  phone: '11 5555-1234',
}

async function fillBuyer() {
  await userEvent.type(screen.getByLabelText('Nombre y apellido'), validBuyer.name)
  await userEvent.type(screen.getByLabelText('Email'), validBuyer.email)
  await userEvent.type(screen.getByLabelText('Repetir email'), validBuyer.emailConfirm)
  await userEvent.type(screen.getByLabelText('Teléfono'), validBuyer.phone)
}

beforeEach(() => {
  sessionStorage.clear()
  push.mockClear()
  ;(browserFetch as jest.Mock).mockReset()
})

describe('validateBuyer', () => {
  it('acepta datos completos y emails iguales sin importar mayúsculas', () => {
    expect(validateBuyer(validBuyer)).toEqual({})
  })

  it('marca emails distintos y teléfono corto', () => {
    expect(validateBuyer({ ...validBuyer, emailConfirm: 'otra@mail.com', phone: '123' })).toEqual({
      emailConfirm: 'Los emails no coinciden',
      phone: 'Ingresá un teléfono válido',
    })
  })
})

describe('TicketCheckoutView', () => {
  it('muestra el resumen con evento, entradas, costo de servicio y el tiempo restante', () => {
    storeSelection()
    render(<TicketCheckoutView event={event} catalogSlug="fiesta" availablePaymentMethods={['mp', 'cash']} />)
    expect(screen.getAllByText('Fiesta').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Teatro Flores').length).toBeGreaterThan(0)
    expect(screen.getAllByText('General').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/63\.000/).length).toBeGreaterThan(0) // 60.000 + 5%
    expect(screen.getByRole('timer')).toHaveTextContent('Tenés 10 minutos para realizar la compra.')
    // Efectivo no se ofrece para entradas
    expect(screen.queryByText('Efectivo')).not.toBeInTheDocument()
  })

  it('no confirma la compra con datos inválidos', async () => {
    storeSelection()
    render(<TicketCheckoutView event={event} catalogSlug="fiesta" availablePaymentMethods={['mp']} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))
    expect(screen.getByText('Ingresá tu nombre y apellido')).toBeInTheDocument()
    const methods = (browserFetch as jest.Mock).mock.calls.map(call => call[1]?.method)
    expect(methods).not.toContain('PATCH')
  })

  it('encola la orden al entrar y al pagar solo adjunta los datos', async () => {
    storeSelection()
    ;(browserFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ order_id: 'o1', order_number: 7, checkout_url: null }),
    })
    render(<TicketCheckoutView event={event} catalogSlug="fiesta" availablePaymentMethods={['mp']} />)
    await waitFor(() => expect(browserFetch).toHaveBeenCalled())

    const created = JSON.parse((browserFetch as jest.Mock).mock.calls[0][1].body)
    expect(created).toMatchObject({
      customer_name: '',
      customer_email: '',
      payment_method: 'mp',
      items: [{ ticket_id: 't1', quantity: 2 }],
    })
    expect(created.customer_document).toBeUndefined()

    await fillBuyer()
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))

    const patchCall = (browserFetch as jest.Mock).mock.calls.find(call => call[1]?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body)).toEqual({
      customer_name: 'Ana Pérez',
      customer_email: 'ana@mail.com',
      customer_phone: '11 5555-1234',
    })
    expect(push).toHaveBeenCalledWith('/catalogo/fiesta/order/o1')
    expect(sessionStorage.getItem('nubapay_ticket_selection')).toBeNull()
    expect(screen.queryByText('No elegiste entradas')).not.toBeInTheDocument()
  })

  it('cuando vence el tiempo pide volver a elegir', () => {
    storeSelection(Date.now() - 1000)
    render(<TicketCheckoutView event={event} catalogSlug="fiesta" availablePaymentMethods={['mp']} />)
    expect(screen.getByText('Se terminó el tiempo para comprar')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument()
  })

  it('sin selección invita a elegir entradas', () => {
    render(<TicketCheckoutView event={event} catalogSlug="fiesta" availablePaymentMethods={['mp']} />)
    expect(screen.getByText('No elegiste entradas')).toBeInTheDocument()
  })
})
