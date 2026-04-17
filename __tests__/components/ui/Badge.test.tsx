import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renderiza el texto', () => {
    render(<Badge>Listo</Badge>)
    expect(screen.getByText('Listo')).toBeInTheDocument()
  })

  it('variante success aplica clases verdes', () => {
    render(<Badge variant="success">OK</Badge>)
    expect(screen.getByText('OK')).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('variante danger aplica clases rojas', () => {
    render(<Badge variant="danger">Error</Badge>)
    expect(screen.getByText('Error')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('variante default aplica clases grises', () => {
    render(<Badge>Pendiente</Badge>)
    expect(screen.getByText('Pendiente')).toHaveClass('bg-gray-100', 'text-gray-800')
  })
})
