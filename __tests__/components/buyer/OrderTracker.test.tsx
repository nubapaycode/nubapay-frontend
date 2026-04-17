import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderTracker } from '@/components/buyer/OrderTracker'
import { useRouter } from 'next/navigation'
import { useOrderStatus } from '@/lib/hooks/useOrderStatus'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/hooks/useOrderStatus', () => ({
  useOrderStatus: jest.fn(),
}))

const mockPush = jest.fn()

beforeEach(() => {
  mockPush.mockClear()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
})

describe('OrderTracker', () => {
  it('muestra los 4 labels del stepper', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'pending' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.getByText('Recibido')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('no muestra botón QR cuando status=pending', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'pending' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.queryByRole('button', { name: /Ver QR/ })).not.toBeInTheDocument()
  })

  it('no muestra botón QR cuando status=preparing', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'preparing' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.queryByRole('button', { name: /Ver QR/ })).not.toBeInTheDocument()
  })

  it('muestra botón QR cuando status=ready', () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'ready' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    expect(screen.getByRole('button', { name: /Ver QR/ })).toBeInTheDocument()
  })

  it('navega a la página QR al hacer click', async () => {
    ;(useOrderStatus as jest.Mock).mockReturnValue({ status: 'ready' })
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    await userEvent.click(screen.getByRole('button', { name: /Ver QR/ }))
    expect(mockPush).toHaveBeenCalledWith('/demo/qr/abc12345-def')
  })
})
