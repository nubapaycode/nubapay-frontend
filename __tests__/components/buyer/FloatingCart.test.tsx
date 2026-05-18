import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FloatingCart } from '@/components/buyer/FloatingCart'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('FloatingCart', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    mockPush.mockClear()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('no renderiza cuando count=0', () => {
    const { container } = render(<FloatingCart count={0} total={0} eventId="demo" />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza botones cuando count>0', () => {
    render(<FloatingCart count={2} total={7000} eventId="demo" />)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('muestra la cantidad en plural cuando count>1', () => {
    render(<FloatingCart count={3} total={10500} eventId="demo" />)
    // El componente renderiza "3 productos" en la barra mobile y en el pill desktop
    expect(screen.getAllByText(/3 productos/).length).toBeGreaterThan(0)
  })

  it('muestra "producto" en singular cuando count=1', () => {
    render(<FloatingCart count={1} total={3500} eventId="demo" />)
    expect(screen.getAllByText(/1 producto/).length).toBeGreaterThan(0)
  })

  it('navega al carrito del evento al hacer click en "Ver carrito"', async () => {
    render(<FloatingCart count={2} total={7000} eventId="mi-evento" />)
    await userEvent.click(screen.getByRole('button', { name: /Ver carrito/ }))
    expect(mockPush).toHaveBeenCalledWith('/mi-evento/cart')
  })
})
