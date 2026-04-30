import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from '@/components/LoginView'
import { useRouter } from 'next/navigation'
import { browserFetch } from '@/lib/browserFetch'
import { getAuthToken } from '@/lib/authSession'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/browserFetch', () => ({
  browserFetch: jest.fn(),
}))

const mockPush = jest.fn()
const mockBrowserFetch = browserFetch as jest.MockedFunction<typeof browserFetch>

const demoUser = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Demo',
  email: 'demo@nubapay.com',
  role: 'ORGANIZER',
}

beforeEach(() => {
  mockPush.mockClear()
  mockBrowserFetch.mockImplementation(async (input: RequestInfo | URL, init?) => {
    const u =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : input instanceof URL
            ? input.href
            : String(input)
    if (u.includes('auth/login') && init?.method === 'POST') {
      const body = JSON.parse(String(init?.body ?? '{}')) as { email?: string; password?: string }
      if (body.email === 'demo@nubapay.com' && body.password === 'demo123') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ token: 'test-jwt', user: demoUser }),
        } as Response
      }
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Credenciales incorrectas' }),
      } as Response
    }
    if (u.includes('auth/register') && init?.method === 'POST') {
      return {
        ok: true,
        status: 201,
        json: async () => ({ token: 'reg-jwt', user: { ...demoUser, email: 'new@test.com' } }),
      } as Response
    }
    throw new Error(`Unhandled fetch: ${u} ${init?.method}`)
  })
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  localStorage.clear()
})

afterEach(() => {
  mockPush.mockClear()
})

describe('LoginView', () => {
  it('muestra el formulario de login', async () => {
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
    await waitFor(() =>
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument(),
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirige a eventos tras login exitoso y guarda token', async () => {
    render(<LoginView />)
    await userEvent.type(screen.getByPlaceholderText('Email'), 'demo@nubapay.com')
    await userEvent.type(screen.getByPlaceholderText('Contraseña'), 'demo123')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/events'))
    expect(getAuthToken()).toBe('test-jwt')
  })

  it('registro crea sesión y va a eventos', async () => {
    render(<LoginView />)
    await userEvent.click(screen.getByRole('button', { name: /Registrate/i }))
    await userEvent.type(screen.getByPlaceholderText('Nombre completo'), 'Nuevo Usuario')
    await userEvent.type(screen.getByPlaceholderText('Email'), 'new@test.com')
    await userEvent.type(screen.getByPlaceholderText(/mín\. 8/), 'password12')
    await userEvent.click(screen.getByRole('button', { name: /Crear cuenta y entrar/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/events'))
    expect(getAuthToken()).toBe('reg-jwt')
  })
})
