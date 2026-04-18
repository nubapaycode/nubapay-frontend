import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from '@/components/LoginView'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()

beforeEach(() => {
  mockPush.mockClear()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  localStorage.clear()
})

describe('LoginView', () => {
  it('muestra el formulario de login', () => {
    render(<LoginView />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('muestra error con credenciales incorrectas', async () => {
    render(<LoginView />)
    await userEvent.type(screen.getByPlaceholderText('Email'), 'malo@test.com')
    await userEvent.type(screen.getByPlaceholderText('Contraseña'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirige al dashboard con credenciales demo correctas', async () => {
    render(<LoginView />)
    await userEvent.type(screen.getByPlaceholderText('Email'), 'demo@nubapay.com')
    await userEvent.type(screen.getByPlaceholderText('Contraseña'), 'demo123')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
