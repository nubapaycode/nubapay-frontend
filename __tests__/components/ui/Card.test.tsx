import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('renderiza los hijos', () => {
    render(<Card>Contenido de tarjeta</Card>)
    expect(screen.getByText('Contenido de tarjeta')).toBeInTheDocument()
  })

  it('aplica className adicional', () => {
    const { container } = render(<Card className="mi-clase">X</Card>)
    expect(container.firstChild).toHaveClass('mi-clase')
  })

  it('tiene clases base por defecto', () => {
    const { container } = render(<Card>X</Card>)
    expect(container.firstChild).toHaveClass('rounded-xl', 'bg-white')
  })
})
