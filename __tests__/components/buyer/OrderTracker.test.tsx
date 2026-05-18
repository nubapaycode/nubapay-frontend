import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderTracker } from '@/components/buyer/OrderTracker'
import { useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockPush = jest.fn()
const mockGet = jest.fn()

function mockFetchOrder(status: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      order_id: 'abc12345-def',
      order_number: 1,
      status,
      payment_status: 'paid',
      total_amount: 1000,
      customer_name: 'Test User',
      payment_method: 'mp',
      checkout_url: null,
      items: [],
      created_at: '2025-01-01T12:00:00Z',
    }),
  })
}

beforeEach(() => {
  mockPush.mockClear()
  mockGet.mockClear()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  ;(useSearchParams as jest.Mock).mockReturnValue({ get: mockGet })
  mockGet.mockReturnValue(null)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('OrderTracker', () => {
  it('muestra los 4 labels del stepper', async () => {
    mockFetchOrder('pending')
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    await waitFor(() => expect(screen.queryByText('Recibido')).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('no muestra botón QR cuando status=pending', async () => {
    mockFetchOrder('pending')
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    await waitFor(() => expect(screen.queryByText('Recibido')).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.queryByRole('button', { name: /Ver QR/ })).not.toBeInTheDocument()
  })

  it('no muestra botón QR cuando status=preparing', async () => {
    mockFetchOrder('preparing')
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    await waitFor(() => expect(screen.queryByText('Recibido')).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.queryByRole('button', { name: /Ver QR/ })).not.toBeInTheDocument()
  })

  it('muestra botón QR cuando status=ready', async () => {
    mockFetchOrder('ready')
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    await waitFor(
      () => expect(screen.getByRole('button', { name: /Ver QR de retiro/ })).toBeInTheDocument(),
      { timeout: 3000 },
    )
  })

  it('navega a la página QR al hacer click', async () => {
    mockFetchOrder('ready')
    render(<OrderTracker orderId="abc12345-def" eventId="demo" />)
    const btn = await screen.findByRole('button', { name: /Ver QR de retiro/ }, { timeout: 3000 })
    await userEvent.click(btn)
    expect(mockPush).toHaveBeenCalledWith('/demo/qr/abc12345-def')
  })
})
