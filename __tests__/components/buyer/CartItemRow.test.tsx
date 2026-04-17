import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartItemRow } from '@/components/buyer/CartItemRow'
import type { CartItem } from '@/types'

const mockItem: CartItem = {
  productId: 'p1',
  name: 'Hamburguesa Clásica',
  price: 3500,
  quantity: 2,
}

describe('CartItemRow', () => {
  it('muestra el nombre del item', () => {
    render(<CartItemRow item={mockItem} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument()
  })

  it('muestra el subtotal correcto (precio × cantidad)', () => {
    render(<CartItemRow item={mockItem} onUpdateQuantity={jest.fn()} />)
    // subtotal = 3500 * 2 = 7000
    expect(screen.getByText(/7.000/)).toBeInTheDocument()
  })

  it('llama onUpdateQuantity(id, qty+1) al click +', async () => {
    const handleUpdate = jest.fn()
    render(<CartItemRow item={mockItem} onUpdateQuantity={handleUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(handleUpdate).toHaveBeenCalledWith('p1', 3)
  })

  it('llama onUpdateQuantity(id, qty-1) al click −', async () => {
    const handleUpdate = jest.fn()
    render(<CartItemRow item={mockItem} onUpdateQuantity={handleUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: '−' }))
    expect(handleUpdate).toHaveBeenCalledWith('p1', 1)
  })

  it('llama onUpdateQuantity(id, 0) al decrementar desde 1', async () => {
    const handleUpdate = jest.fn()
    const singleItem: CartItem = { ...mockItem, quantity: 1 }
    render(<CartItemRow item={singleItem} onUpdateQuantity={handleUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: '−' }))
    expect(handleUpdate).toHaveBeenCalledWith('p1', 0)
  })
})
