import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductCard } from '@/components/buyer/ProductCard'
import type { Product } from '@/types'

const mockProduct: Product = {
  id: 'p1',
  name: 'Hamburguesa Clásica',
  description: 'Medallón de carne con papas',
  price: 3500,
  category: 'Comidas',
  available: true,
}

describe('ProductCard', () => {
  it('muestra el nombre del producto', () => {
    render(<ProductCard product={mockProduct} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument()
  })

  it('muestra el precio formateado', () => {
    render(<ProductCard product={mockProduct} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByText(/3.500/)).toBeInTheDocument()
  })

  it('muestra botón "Agregar" cuando quantity=0', () => {
    render(<ProductCard product={mockProduct} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument()
  })

  it('llama onAdd con el producto al hacer click en Agregar', async () => {
    const handleAdd = jest.fn()
    render(<ProductCard product={mockProduct} quantity={0} onAdd={handleAdd} onUpdateQuantity={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(handleAdd).toHaveBeenCalledWith(mockProduct)
  })

  it('muestra counter cuando quantity>0', () => {
    render(<ProductCard product={mockProduct} quantity={2} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '−' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
  })

  it('no muestra botón Agregar cuando quantity>0', () => {
    render(<ProductCard product={mockProduct} quantity={1} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />)
    expect(screen.queryByRole('button', { name: 'Agregar' })).not.toBeInTheDocument()
  })

  it('llama onUpdateQuantity(id, quantity+1) al click +', async () => {
    const handleUpdate = jest.fn()
    render(<ProductCard product={mockProduct} quantity={2} onAdd={jest.fn()} onUpdateQuantity={handleUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(handleUpdate).toHaveBeenCalledWith('p1', 3)
  })

  it('llama onUpdateQuantity(id, quantity-1) al click −', async () => {
    const handleUpdate = jest.fn()
    render(<ProductCard product={mockProduct} quantity={2} onAdd={jest.fn()} onUpdateQuantity={handleUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: '−' }))
    expect(handleUpdate).toHaveBeenCalledWith('p1', 1)
  })
})
