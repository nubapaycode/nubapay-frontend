import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckoutView } from '@/components/buyer/CheckoutView'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/hooks/useCart', () => ({
  useCart: jest.fn(),
}))

const mockPush = jest.fn()
const mockClearCart = jest.fn()

beforeEach(() => {
  mockPush.mockClear()
  mockClearCart.mockClear()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
})

describe('CheckoutView — carrito vacío', () => {
  beforeEach(() => {
    ;(useCart as jest.Mock).mockReturnValue({
      items: [],
      total: 0,
      clearCart: mockClearCart,
    })
  })

  it('muestra mensaje de carrito vacío', () => {
    render(<CheckoutView eventId="demo" />)
    expect(screen.getByText('No tenés items en el carrito')).toBeInTheDocument()
  })

  it('botón confirmar está deshabilitado con texto "Carrito vacío"', () => {
    render(<CheckoutView eventId="demo" />)
    expect(screen.getByRole('button', { name: /Carrito vacío/ })).toBeDisabled()
  })
})

describe('CheckoutView — con items', () => {
  const mockItems = [
    { productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 2 },
    { productId: 'p2', name: 'Gaseosa 500ml', price: 1200, quantity: 1 },
  ]

  beforeEach(() => {
    ;(useCart as jest.Mock).mockReturnValue({
      items: mockItems,
      total: 8200,
      clearCart: mockClearCart,
    })
  })

  it('muestra los nombres de los items en el resumen', () => {
    render(<CheckoutView eventId="demo" />)
    expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument()
    expect(screen.getByText('Gaseosa 500ml')).toBeInTheDocument()
  })

  it('muestra el total formateado en el botón', () => {
    render(<CheckoutView eventId="demo" />)
    expect(screen.getByRole('button', { name: /Pagar/ })).toBeInTheDocument()
  })

  it('muestra error si se confirma sin nombre', async () => {
    render(<CheckoutView eventId="demo" />)
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    expect(screen.getByText('Ingresá tu nombre para continuar')).toBeInTheDocument()
    expect(mockClearCart).not.toHaveBeenCalled()
  })

  it('llama clearCart y navega a order tracking con nombre válido', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order_id: 'test-order-uuid', checkout_url: null }),
    })
    render(<CheckoutView eventId="demo" />)
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Juan Pérez')
    await userEvent.type(screen.getByLabelText('Tu email'), 'juan@email.com')
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    await waitFor(() => expect(mockClearCart).toHaveBeenCalledTimes(1))
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/demo\/order\/.+/))
  })
})

describe('CheckoutView — WhatsApp', () => {
  const items = [{ productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 1 }]

  beforeEach(() => {
    ;(useCart as jest.Mock).mockReturnValue({ items, total: 3500, clearCart: mockClearCart })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ order_id: 'o-1', checkout_url: null }) })
  })

  /** Cuerpo de la llamada que confirma la compra (la que lleva el nombre del comprador). */
  const confirmBody = () => {
    const call = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.body && JSON.parse(init.body).customer_name === 'Juan Pérez')
    return call ? JSON.parse(call[1].body) : null
  }
  const fillBuyer = async () => {
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Juan Pérez')
    await userEvent.type(screen.getByLabelText('Tu email'), 'juan@email.com')
  }

  it('si el organizador no tiene WhatsApp, no ofrece nada', () => {
    render(<CheckoutView eventId="demo" />)
    expect(screen.queryByLabelText(/QR por WhatsApp/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Tu teléfono de WhatsApp')).not.toBeInTheDocument()
  })

  it('con WhatsApp activo ofrece la casilla, sin marcar y sin pedir teléfono todavía', () => {
    render(<CheckoutView eventId="demo" whatsappEnabled />)
    expect(screen.getByLabelText(/Quiero recibir mi QR por WhatsApp/)).not.toBeChecked()
    expect(screen.queryByLabelText('Tu teléfono de WhatsApp')).not.toBeInTheDocument()
  })

  it('al tildar la casilla pide el teléfono', async () => {
    render(<CheckoutView eventId="demo" whatsappEnabled />)
    await userEvent.click(screen.getByLabelText(/Quiero recibir mi QR por WhatsApp/))
    expect(screen.getByLabelText('Tu teléfono de WhatsApp')).toBeInTheDocument()
  })

  it('sin tildar, la compra no manda teléfono ni consentimiento', async () => {
    render(<CheckoutView eventId="demo" whatsappEnabled />)
    await fillBuyer()
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    await waitFor(() => expect(mockClearCart).toHaveBeenCalled())
    const body = confirmBody()
    expect(body).not.toBeNull()
    expect(body).not.toHaveProperty('whatsapp_opt_in')
    expect(body).not.toHaveProperty('customer_phone')
  })

  it('tildada y con teléfono, la compra manda el teléfono y el consentimiento', async () => {
    render(<CheckoutView eventId="demo" whatsappEnabled />)
    await fillBuyer()
    await userEvent.click(screen.getByLabelText(/Quiero recibir mi QR por WhatsApp/))
    await userEvent.type(screen.getByLabelText('Tu teléfono de WhatsApp'), '11 5555-1234')
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    await waitFor(() => expect(mockClearCart).toHaveBeenCalled())
    expect(confirmBody()).toMatchObject({ customer_phone: '11 5555-1234', whatsapp_opt_in: true })
  })

  it('tildada sin teléfono válido no deja pagar y marca el campo', async () => {
    render(<CheckoutView eventId="demo" whatsappEnabled />)
    await fillBuyer()
    await userEvent.click(screen.getByLabelText(/Quiero recibir mi QR por WhatsApp/))
    await userEvent.type(screen.getByLabelText('Tu teléfono de WhatsApp'), '123')
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    expect(screen.getByText(/Ingresá un teléfono válido, con código de área/)).toBeInTheDocument()
    expect(screen.getByLabelText('Tu teléfono de WhatsApp')).toHaveAttribute('aria-invalid', 'true')
    expect(mockClearCart).not.toHaveBeenCalled()
    expect(confirmBody()).toBeNull()
  })

  it('si el servidor rechaza el teléfono, lo marca en el campo', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : {}
      return body.customer_name === 'Juan Pérez'
        ? { ok: false, status: 422, json: async () => ({ error: 'Ingresá un teléfono válido, con código de área, para recibir tu QR por WhatsApp.', code: 'invalid_whatsapp_phone' }) }
        : { ok: true, json: async () => ({ order_id: 'o-1', checkout_url: null }) }
    })
    render(<CheckoutView eventId="demo" whatsappEnabled />)
    await fillBuyer()
    await userEvent.click(screen.getByLabelText(/Quiero recibir mi QR por WhatsApp/))
    await userEvent.type(screen.getByLabelText('Tu teléfono de WhatsApp'), '11 5555-1234')
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    await screen.findByText(/para recibir tu QR por WhatsApp\./)
    expect(screen.getByLabelText('Tu teléfono de WhatsApp')).toHaveAttribute('aria-invalid', 'true')
    expect(mockClearCart).not.toHaveBeenCalled()
  })
})

