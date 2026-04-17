import { render, screen } from '@testing-library/react'
import { QRDisplay } from '@/components/buyer/QRDisplay'

describe('QRDisplay', () => {
  it('muestra el mensaje de retiro', () => {
    render(<QRDisplay orderId="abc12345-def456" />)
    expect(screen.getByText('Mostrá este código al retirar tu pedido')).toBeInTheDocument()
  })

  it('muestra el orderId truncado con #', () => {
    render(<QRDisplay orderId="abc12345-def456" />)
    expect(screen.getByText('#abc12345')).toBeInTheDocument()
  })

  it('muestra badge "Listo para retirar"', () => {
    render(<QRDisplay orderId="abc12345-def456" />)
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()
  })
})
