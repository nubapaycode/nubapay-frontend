import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { useRouter, usePathname } from 'next/navigation'
import { browserFetch } from '@/lib/browserFetch'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

jest.mock('@/lib/browserFetch', () => ({
  browserFetch: jest.fn(),
}))

const mockReplace = jest.fn()
const mockFetch = browserFetch as jest.Mock

const admin = { id: '1', name: 'Admin', email: 'admin@nubapay.app', role: 'ORGANIZER', is_platform_admin: true }

function renderGuard() {
  return render(
    <AdminGuard>
      <div>Panel admin</div>
    </AdminGuard>,
  )
}

beforeEach(() => {
  mockReplace.mockClear()
  mockFetch.mockReset()
  ;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace })
  ;(usePathname as jest.Mock).mockReturnValue('/admin')
  localStorage.clear()
})

describe('AdminGuard', () => {
  it('redirige a /login con next si no hay token', async () => {
    renderGuard()
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login?next=%2Fadmin'))
  })

  it('muestra el panel y guarda el token renovado', async () => {
    localStorage.setItem('nubapay_token', 'old-token')
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ user: admin, token: 'fresh-token' }) })
    renderGuard()
    await waitFor(() => expect(screen.getByText('Panel admin')).toBeInTheDocument())
    expect(localStorage.getItem('nubapay_token')).toBe('fresh-token')
  })

  it('cierra la sesión y redirige cuando el token venció (401)', async () => {
    localStorage.setItem('nubapay_token', 'expired')
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    renderGuard()
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login?next=%2Fadmin&expired=1'))
    expect(localStorage.getItem('nubapay_token')).toBeNull()
  })

  it('NO cierra la sesión si el servidor falla (500) y permite reintentar', async () => {
    localStorage.setItem('nubapay_token', 'valid')
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
    renderGuard()
    await waitFor(() => expect(screen.getByText(/Tu login sigue guardado/)).toBeInTheDocument())
    expect(localStorage.getItem('nubapay_token')).toBe('valid')
    expect(mockReplace).not.toHaveBeenCalled()

    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ user: admin }) })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.getByText('Panel admin')).toBeInTheDocument())
  })

  it('NO cierra la sesión ante un error de red', async () => {
    localStorage.setItem('nubapay_token', 'valid')
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    renderGuard()
    await waitFor(() => expect(screen.getByText(/Tu login sigue guardado/)).toBeInTheDocument())
    expect(localStorage.getItem('nubapay_token')).toBe('valid')
  })
})
