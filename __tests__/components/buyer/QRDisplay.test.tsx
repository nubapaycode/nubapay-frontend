import { render, screen } from '@testing-library/react'
import { QRDisplay } from '@/components/buyer/QRDisplay'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('qrcode.react', () => ({
  QRCodeSVG: () => <svg data-testid="qr-svg" />,
}))

describe('QRDisplay', () => {
  it('muestra el mensaje de retiro', () => {
    render(<QRDisplay orderId="abc12345-def456" eventId="demo" />)
    expect(screen.getByText('Mostrá este QR al retirar tu pedido')).toBeInTheDocument()
  })

  it('muestra el orderId truncado con # en mayúsculas', () => {
    render(<QRDisplay orderId="abc12345-def456" eventId="demo" />)
    expect(screen.getByText(/ABC12345/)).toBeInTheDocument()
  })

  it('muestra badge "Listo para retirar"', () => {
    render(<QRDisplay orderId="abc12345-def456" eventId="demo" />)
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()
  })

  it('muestra el botón de volver al detalle', () => {
    render(<QRDisplay orderId="abc12345-def456" eventId="demo" />)
    expect(screen.getByRole('button', { name: /Ver detalle del pedido/ })).toBeInTheDocument()
  })
})
