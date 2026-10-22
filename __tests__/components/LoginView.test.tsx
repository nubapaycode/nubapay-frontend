import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from '@/components/LoginView'
import { useRouter } from 'next/navigation'
import { browserFetch } from '@/lib/browserFetch'
import { getAuthToken } from '@/lib/authSession'

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

  it('redirige a eventos tras login exitoso y guarda token', async () => {
    render(<LoginView />)
    await userEvent.type(screen.getByLabelText('Email'), 'demo@nubapay.app')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'demo123')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/events'))
    expect(getAuthToken()).toBe('test-jwt')
  })

  it('modo login: el botón de cambio navega a /register', async () => {
    render(<LoginView initialMode="login" />)
    await userEvent.click(screen.getByRole('button', { name: /Registrate/i }))
    expect(mockPush).toHaveBeenCalledWith('/register')
  })

  it('registro crea sesión y va a eventos', async () => {
    render(<LoginView initialMode="register" />)
    await userEvent.type(screen.getByLabelText('Nombre'), 'Nuevo Usuario')
    await userEvent.type(screen.getByLabelText('Email'), 'new@test.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'password12')
    await userEvent.click(screen.getByRole('button', { name: /Crear cuenta y entrar/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/events'))
    expect(getAuthToken()).toBe('reg-jwt')
  })

  it('modo register: el botón de cambio navega a /login', async () => {
    render(<LoginView initialMode="register" />)
    await userEvent.click(screen.getByRole('button', { name: /Iniciá sesión/i }))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})

describe('LoginView con sesión guardada', () => {
  const mockReplace = jest.fn()

  beforeEach(() => {
    mockReplace.mockClear()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: mockReplace })
  })

  it('redirige sin mostrar el formulario si la sesión sigue vigente', async () => {
    localStorage.setItem('nubapay_token', 'valid')
    mockBrowserFetch.mockImplementation(async (input) => {
      const u = String(input)
      if (u.includes('auth/me')) {
        return { ok: true, status: 200, json: async () => ({ user: { ...demoUser, is_platform_admin: true } }) } as Response
      }
      throw new Error(`Unhandled fetch: ${u}`)
    })
    render(<LoginView />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalled())
    expect(getAuthToken()).toBe('valid')
  })

  it('con token vencido (401) lo borra y deja el formulario, sin rebotar por /events', async () => {
    localStorage.setItem('nubapay_token', 'expired')
    mockBrowserFetch.mockImplementation(async (input) => {
      const u = String(input)
      if (u.includes('auth/me')) return { ok: false, status: 401, json: async () => ({}) } as Response
      throw new Error(`Unhandled fetch: ${u}`)
    })
    render(<LoginView />)
    await waitFor(() => expect(getAuthToken()).toBeNull())
    expect(mockReplace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
    expect(screen.getByText(/Tu sesión venció/)).toBeInTheDocument()
  })

  it('con el servidor caído (500) NO borra el token', async () => {
    localStorage.setItem('nubapay_token', 'valid')
    mockBrowserFetch.mockImplementation(async (input) => {
      const u = String(input)
      if (u.includes('auth/me')) return { ok: false, status: 500, json: async () => ({}) } as Response
      return { ok: false, status: 500, json: async () => ({}) } as Response
    })
    render(<LoginView />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/events'))
    expect(getAuthToken()).toBe('valid')
  })
})
