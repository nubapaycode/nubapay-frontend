import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from '@/components/LoginView'
import { useRouter } from 'next/navigation'
import { browserFetch } from '@/lib/browserFetch'
import { getAuthToken, setAuthSession } from '@/lib/authSession'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/browserFetch', () => ({
  browserFetch: jest.fn(),
}))

const mockPush = jest.fn()
const mockBrowserFetch = browserFetch as jest.MockedFunction<typeof browserFetch>

const demoUser = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Demo',
  email: 'demo@nubapay.app',
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
      if (body.email === 'demo@nubapay.app' && body.password === 'demo123') {
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
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('muestra error con credenciales incorrectas', async () => {
    render(<LoginView />)
    await userEvent.type(screen.getByLabelText('Email'), 'malo@test.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() =>
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument(),
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('va al panel tras login exitoso y guarda token', async () => {
    render(<LoginView />)
    await userEvent.type(screen.getByLabelText('Email'), 'demo@nubapay.app')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'demo123')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/panel'))
    expect(getAuthToken()).toBe('test-jwt')
  })

  it('modo login: el botón de cambio navega a /register', async () => {
    render(<LoginView initialMode="login" />)
    await userEvent.click(screen.getByRole('button', { name: /Registrate/i }))
    expect(mockPush).toHaveBeenCalledWith('/registro')
  })

  it('registro crea sesión y va al panel', async () => {
    render(<LoginView initialMode="register" />)
    await userEvent.type(screen.getByLabelText('Nombre'), 'Nuevo Usuario')
    await userEvent.type(screen.getByLabelText('Email'), 'new@test.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'password12')
    await userEvent.click(screen.getByRole('button', { name: /Crear cuenta y entrar/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/panel'))
    expect(getAuthToken()).toBe('reg-jwt')
  })

  it('modo register: el botón de cambio navega a /login', async () => {
    render(<LoginView initialMode="register" />)
    await userEvent.click(screen.getByRole('button', { name: /Iniciá sesión/i }))
    expect(mockPush).toHaveBeenCalledWith('/ingresar')
  })
})

describe('LoginView con sesión guardada', () => {
  const mockReplace = jest.fn()

  beforeEach(() => {
    mockReplace.mockClear()
    mockBrowserFetch.mockClear()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: mockReplace })
  })

  it('va directo al panel sin esperar al servidor ni mostrar el formulario', async () => {
    setAuthSession('valid', demoUser)
    render(<LoginView />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/panel'))
    // El token lo valida OrganizerGuard en el destino: acá no hay ningún viaje a la red.
    expect(mockBrowserFetch).not.toHaveBeenCalled()
    expect(getAuthToken()).toBe('valid')
    expect(screen.queryByRole('button', { name: 'Ingresar' })).not.toBeInTheDocument()
  })

  it('un dueño de estacionamiento va a su panel global, no a /panel', async () => {
    setAuthSession('valid', { ...demoUser, modules: ['catalogo', 'tickets', 'parking_owner'] })
    render(<LoginView />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/estacionamiento'))
    expect(mockReplace).not.toHaveBeenCalledWith('/panel')
  })

  it('un admin de plataforma va a /admin', async () => {
    setAuthSession('valid', { ...demoUser, is_platform_admin: true })
    render(<LoginView />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin'))
    expect(mockBrowserFetch).not.toHaveBeenCalled()
  })

  it('sin sesión guardada muestra el formulario y no redirige', async () => {
    render(<LoginView />)
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
