import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TicketCheckoutView, validateBuyer, validateVehicle } from '@/components/buyer/TicketCheckoutView'
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

describe('validateVehicle', () => {
  it('acepta patentes viejas, nuevas y en minúscula, con DNI con o sin puntos', () => {
    expect(validateVehicle({ plate: 'ab 123 cd', dni: '30123456' })).toEqual({})
    expect(validateVehicle({ plate: 'ABC-123', dni: '30.123.456' })).toEqual({})
    expect(validateVehicle({ plate: 'ABC123', dni: '1234567' })).toEqual({})
  })

  it('pide la patente y marca las inválidas', () => {
    expect(validateVehicle({ plate: '', dni: '30123456' })).toEqual({ plate: 'Ingresá la patente del vehículo' })
    expect(validateVehicle({ plate: 'ABCDEF', dni: '30123456' })).toEqual({ plate: 'Ingresá una patente válida, ej. AB123CD o ABC123' })
  })

  it('el DNI es obligatorio y tiene que ser válido', () => {
    expect(validateVehicle({ plate: 'AB123CD', dni: '' })).toEqual({ dni: 'Ingresá el DNI del titular' })
    expect(validateVehicle({ plate: 'AB123CD', dni: '  ' })).toEqual({ dni: 'Ingresá el DNI del titular' })
    expect(validateVehicle({ plate: 'AB123CD', dni: '12345' })).toEqual({ dni: 'El DNI tiene que tener 7 u 8 números' })
    expect(validateVehicle({ plate: 'AB123CD', dni: '123456789' })).toEqual({ dni: 'El DNI tiene que tener 7 u 8 números' })
  })

  it('pide patente y DNI juntos cuando faltan los dos', () => {
    expect(validateVehicle({ plate: '', dni: '' })).toEqual({
      plate: 'Ingresá la patente del vehículo',
      dni: 'Ingresá el DNI del titular',
    })
  })
})

describe('TicketCheckoutView · parking', () => {
  const parkingEvent: Event = {
    ...event,
    parking: [{ id: 'p1', kind: 'parking', icon: 'car', name: 'Auto', description: '', price: 3000, available: true }],
  }

  function storeParking() {
    sessionStorage.setItem(
      'nubapay_ticket_selection',
      JSON.stringify({ slug: 'fiesta#parking', lines: [{ ticketId: 'p1', quantity: 1 }], expiresAt: Date.now() + 600000 }),
    )
  }

  it('pide los datos del estacionamiento debajo de los del comprador', () => {
    storeParking()
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    const buyer = screen.getByRole('heading', { name: 'Datos del comprador' })
    const parking = screen.getByRole('heading', { name: 'Datos de estacionamiento' })
    expect(buyer.compareDocumentPosition(parking) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByLabelText('DNI del titular')).toBeInTheDocument()
    expect(screen.getByLabelText('Patente')).toBeInTheDocument()
  })

  it('las entradas no piden datos del estacionamiento', () => {
    storeSelection()
    render(<TicketCheckoutView event={event} catalogSlug="fiesta" availablePaymentMethods={['mp']} />)
    expect(screen.queryByRole('heading', { name: 'Datos de estacionamiento' })).not.toBeInTheDocument()
  })

  it('no paga sin patente', async () => {
    storeParking()
    ;(browserFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ order_id: 'o1' }) })
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    await fillBuyer()
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))
    expect(screen.getByText('Ingresá la patente del vehículo')).toBeInTheDocument()
    const methods = (browserFetch as jest.Mock).mock.calls.map(call => call[1]?.method)
    expect(methods).not.toContain('PATCH')
  })

  it('manda la patente y el DNI normalizados al confirmar', async () => {
    storeParking()
    ;(browserFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ order_id: 'o1', order_number: 7, checkout_url: null }),
    })
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    await waitFor(() => expect(browserFetch).toHaveBeenCalled())
    await fillBuyer()
    await userEvent.type(screen.getByLabelText('Patente'), 'ab 123 cd')
    await userEvent.type(screen.getByLabelText('DNI del titular'), '30.123.456')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))

    const patchCall = (browserFetch as jest.Mock).mock.calls.find(call => call[1]?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body)).toEqual({
      customer_name: 'Ana Pérez',
      customer_email: 'ana@mail.com',
      customer_phone: '11 5555-1234',
      vehicle_plate: 'AB123CD',
      customer_dni: '30123456',
    })
  })

  it('no paga sin DNI: marca el campo y no confirma la orden', async () => {
    storeParking()
    ;(browserFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ order_id: 'o1' }) })
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    await fillBuyer()
    await userEvent.type(screen.getByLabelText('Patente'), 'AB123CD')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))
    expect(screen.getByText('Ingresá el DNI del titular')).toBeInTheDocument()
    expect(screen.getByLabelText('DNI del titular')).toHaveAttribute('aria-invalid', 'true')
    const methods = (browserFetch as jest.Mock).mock.calls.map(call => call[1]?.method)
    expect(methods).not.toContain('PATCH')
  })

  it('el campo de DNI ya no dice "opcional"', () => {
    storeParking()
    ;(browserFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ order_id: 'o1' }) })
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    expect(screen.queryByText(/opcional/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('DNI del titular')).toBeInTheDocument()
  })

  it('si el servidor rechaza el DNI, lo marca en el campo del DNI y no en el de la patente', async () => {
    storeParking()
    ;(browserFetch as jest.Mock).mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'PATCH'
        ? { ok: false, status: 422, json: async () => ({ error: 'Ingresá el DNI del titular para reservar el parking.', code: 'vehicle_data_required' }) }
        : { ok: true, json: async () => ({ order_id: 'o1' }) },
    )
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    await waitFor(() => expect(browserFetch).toHaveBeenCalled())
    await fillBuyer()
    await userEvent.type(screen.getByLabelText('Patente'), 'AB123CD')
    await userEvent.type(screen.getByLabelText('DNI del titular'), '30123456')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))
    await screen.findByRole('alert')
    expect(screen.getByLabelText('DNI del titular')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('DNI del titular')).toHaveFocus()
    expect(screen.getByLabelText('Patente')).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('muestra el error del servidor si la patente ya tiene parking', async () => {
    storeParking()
    ;(browserFetch as jest.Mock).mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'PATCH'
        ? { ok: false, status: 422, json: async () => ({ error: 'Esta patente ya tiene un lugar de parking para este evento.' }) }
        : { ok: true, json: async () => ({ order_id: 'o1' }) },
    )
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    await waitFor(() => expect(browserFetch).toHaveBeenCalled())
    await fillBuyer()
    await userEvent.type(screen.getByLabelText('Patente'), 'AB123CD')
    await userEvent.type(screen.getByLabelText('DNI del titular'), '30123456')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No pudimos completar la compra')
    expect(alert).toHaveTextContent('Esta patente ya tiene un lugar de parking para este evento.')
    expect(push).not.toHaveBeenCalled()
  })

  it('marca la patente cuando el servidor la rechaza y deja cerrar el aviso', async () => {
    storeParking()
    ;(browserFetch as jest.Mock).mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'PATCH'
        ? {
            ok: false,
            status: 422,
            json: async () => ({
              error: 'Esta patente ya tiene un lugar de parking para este evento.',
              code: 'parking_already_purchased',
            }),
          }
        : { ok: true, json: async () => ({ order_id: 'o1' }) },
    )
    render(<TicketCheckoutView event={parkingEvent} catalogSlug="fiesta" availablePaymentMethods={['mp']} kind="parking" />)
    await waitFor(() => expect(browserFetch).toHaveBeenCalled())
    await fillBuyer()
    await userEvent.type(screen.getByLabelText('Patente'), 'AB123CD')
    await userEvent.type(screen.getByLabelText('DNI del titular'), '30123456')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar' }))
    await screen.findByRole('alert')
    const plate = screen.getByLabelText('Patente')
    expect(plate).toHaveAttribute('aria-invalid', 'true')
    expect(plate).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
