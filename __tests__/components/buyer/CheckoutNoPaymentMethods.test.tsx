import { render, screen } from '@testing-library/react'

import { CheckoutView } from '@/components/buyer/CheckoutView'
import { useCart } from '@/lib/hooks/useCart'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/lib/hooks/useCart', () => ({ useCart: jest.fn() }))

beforeEach(() => {
  jest.mocked(useCart).mockReturnValue({
    items: [{ productId: 'p1', name: 'Gaseosa', price: 1200, quantity: 1 }],
    total: 1200,
    clearCart: jest.fn(),
  } as never)
})

describe('CheckoutView sin medios de pago', () => {
  it('si el evento no tiene ningún medio configurado, no deja pagar', () => {
    render(<CheckoutView eventId="demo" availablePaymentMethods={[]} />)
    expect(screen.getByText('Este evento todavía no tiene medios de pago habilitados.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sin medios de pago' })).toBeDisabled()
  })

  it('con un medio configurado ofrece solo ese y deja pagar', () => {
    render(<CheckoutView eventId="demo" availablePaymentMethods={['sipago']} />)
    expect(screen.queryByText('Este evento todavía no tiene medios de pago habilitados.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeEnabled()
  })
})
