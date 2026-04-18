import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsView } from '@/components/organizer/ProductsView'

describe('ProductsView', () => {
  it('muestra los nombres de los productos mock', () => {
    render(<ProductsView />)
    expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument()
    expect(screen.getByText('Gaseosa 500ml')).toBeInTheDocument()
  })

  it('muestra los combos mock', () => {
    render(<ProductsView />)
    expect(screen.getByText('Combo Clásico')).toBeInTheDocument()
    expect(screen.getByText('Combo Familiar')).toBeInTheDocument()
  })

  it('al desactivar un producto cambia su estado a no disponible', async () => {
    render(<ProductsView />)
    const toggles = screen.getAllByRole('checkbox')
    expect(toggles[0]).toBeChecked()
    await userEvent.click(toggles[0])
    expect(toggles[0]).not.toBeChecked()
  })
})
