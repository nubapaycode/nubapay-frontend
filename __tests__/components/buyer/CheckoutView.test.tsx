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
    await userEvent.type(screen.getByRole('textbox'), 'Juan Pérez')
    await userEvent.click(screen.getByRole('button', { name: /Pagar/ }))
    await waitFor(() => expect(mockClearCart).toHaveBeenCalledTimes(1))
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/demo\/order\/.+/))
  })
})
