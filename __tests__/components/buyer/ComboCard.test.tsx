import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComboCard } from '@/components/buyer/ComboCard'
import type { Combo } from '@/types'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

const mockCombo: Combo = {
  id: 'combo-1',
  name: 'Combo Clásico',
  price: 900,
  listPrice: null,
  imageUrl: null,
  promoLabel: null,
  products: [
    { id: 'p1', name: 'Gaseosa 500ml', price: 500, quantity: 1 },
    { id: 'p2', name: 'Hamburguesa', price: 400, quantity: 1 },
  ],
}

describe('ComboCard', () => {
  it('muestra el nombre del combo', () => {
    render(
      <ComboCard combo={mockCombo} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />,
    )
    expect(screen.getByText('Combo Clásico')).toBeInTheDocument()
  })

  it('muestra los productos incluidos', () => {
    render(
      <ComboCard combo={mockCombo} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />,
    )
    expect(screen.getByText(/Gaseosa 500ml/)).toBeInTheDocument()
    expect(screen.getByText(/Hamburguesa/)).toBeInTheDocument()
  })

  it('muestra el precio formateado', () => {
    render(
      <ComboCard combo={mockCombo} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />,
    )
    expect(screen.getByText(/900/)).toBeInTheDocument()
  })

  it('muestra botón "Agregar combo" cuando quantity=0', () => {
    render(
      <ComboCard combo={mockCombo} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />,
    )
    expect(screen.getByRole('button', { name: /Agregar combo Combo Clásico/ })).toBeInTheDocument()
  })

  it('llama onAdd al hacer click en agregar', async () => {
    const onAdd = jest.fn()
    render(
      <ComboCard combo={mockCombo} quantity={0} onAdd={onAdd} onUpdateQuantity={jest.fn()} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Agregar combo/ }))
    expect(onAdd).toHaveBeenCalledWith(mockCombo)
  })

  it('muestra controles +/− cuando quantity>0', () => {
    render(
      <ComboCard combo={mockCombo} quantity={2} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Quitar uno' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar uno' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('llama onUpdateQuantity al incrementar', async () => {
    const onUpdateQuantity = jest.fn()
    render(
      <ComboCard
        combo={mockCombo}
        quantity={1}
        onAdd={jest.fn()}
        onUpdateQuantity={onUpdateQuantity}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Agregar uno' }))
    expect(onUpdateQuantity).toHaveBeenCalledWith('combo-1', 2)
  })

  it('llama onUpdateQuantity al decrementar', async () => {
    const onUpdateQuantity = jest.fn()
    render(
      <ComboCard
        combo={mockCombo}
        quantity={2}
        onAdd={jest.fn()}
        onUpdateQuantity={onUpdateQuantity}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Quitar uno' }))
    expect(onUpdateQuantity).toHaveBeenCalledWith('combo-1', 1)
  })

  it('muestra promoLabel cuando existe', () => {
    const comboConPromo = { ...mockCombo, promoLabel: '2x1' }
    render(
      <ComboCard combo={comboConPromo} quantity={0} onAdd={jest.fn()} onUpdateQuantity={jest.fn()} />,
    )
    expect(screen.getByText('2x1')).toBeInTheDocument()
  })

  it('muestra precio tachado cuando listPrice > price', () => {
    const comboConDescuento = { ...mockCombo, listPrice: 1200, price: 900 }
    render(
      <ComboCard
        combo={comboConDescuento}
        quantity={0}
        onAdd={jest.fn()}
        onUpdateQuantity={jest.fn()}
      />,
    )
    expect(screen.getByText(/1200|1\.200/)).toBeInTheDocument()
  })
})
