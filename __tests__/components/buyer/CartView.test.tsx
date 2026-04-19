import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartView } from '@/components/buyer/CartView'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/hooks/useCart', () => ({
  useCart: jest.fn(),
}))

const mockPush = jest.fn()

beforeEach(() => {
  mockPush.mockClear()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
})

describe('CartView — carrito vacío', () => {
  beforeEach(() => {
    ;(useCart as jest.Mock).mockReturnValue({
      items: [],
      updateQuantity: jest.fn(),
      total: 0,
      count: 0,
    })
  })

  it('muestra el mensaje de carrito vacío', () => {
    render(<CartView eventId="demo" />)
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
  })

  it('botón volver navega al catálogo', async () => {
    render(<CartView eventId="demo" />)
    await userEvent.click(screen.getByRole('button', { name: /Volver al catálogo/ }))
    expect(mockPush).toHaveBeenCalledWith('/demo')
  })
})

describe('CartView — con items', () => {
  const mockItems = [
    { productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 2 },
    { productId: 'p2', name: 'Gaseosa 500ml', price: 1200, quantity: 1 },
  ]

  beforeEach(() => {
    ;(useCart as jest.Mock).mockReturnValue({
      items: mockItems,
      updateQuantity: jest.fn(),
      total: 8200,
      count: 3,
    })
  })

  it('muestra una fila por cada item', () => {
    render(<CartView eventId="demo" />)
    expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument()
    expect(screen.getByText('Gaseosa 500ml')).toBeInTheDocument()
  })

  it('muestra el total formateado', () => {
    render(<CartView eventId="demo" />)
    expect(screen.getAllByText(/8.200/).length).toBeGreaterThan(0)
  })

  it('botón checkout navega a checkout', async () => {
    render(<CartView eventId="demo" />)
    await userEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }))
    expect(mockPush).toHaveBeenCalledWith('/demo/checkout')
  })

  it('botón volver navega al catálogo', async () => {
    render(<CartView eventId="demo" />)
    const backButton = screen.getAllByRole('button')[0]
    await userEvent.click(backButton)
    expect(mockPush).toHaveBeenCalledWith('/demo')
  })
})
