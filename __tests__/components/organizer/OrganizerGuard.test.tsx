import { render, screen, waitFor } from '@testing-library/react'
import { OrganizerGuard } from '@/components/organizer/OrganizerGuard'
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

beforeEach(() => {
  mockReplace.mockClear()
  ;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace })
  ;(usePathname as jest.Mock).mockReturnValue('/organizer')
  localStorage.clear()
})

describe('OrganizerGuard', () => {
  it('redirige a /login si no hay token', async () => {
    render(
      <OrganizerGuard>
        <div>Contenido protegido</div>
      </OrganizerGuard>,
    )
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'))
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('muestra spinner mientras verifica el token', () => {
    localStorage.setItem('nubapay_token', 'fake-token')
    ;(browserFetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(
      <OrganizerGuard>
        <div>Contenido protegido</div>
      </OrganizerGuard>,
    )
    // Mientras carga, no muestra el contenido
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('muestra los children cuando el token es válido', async () => {
    localStorage.setItem('nubapay_token', 'valid-token')
    ;(browserFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          email: 'test@test.com',
          tenant_subdomain: 'test',
          partner: null,
          staff_memberships: [],
        },
      }),
    })
    render(
      <OrganizerGuard>
        <div>Contenido protegido</div>
      </OrganizerGuard>,
    )
    await waitFor(() => expect(screen.getByText('Contenido protegido')).toBeInTheDocument())
  })

  it('redirige a /login cuando el token es inválido (401)', async () => {
    localStorage.setItem('nubapay_token', 'expired-token')
    ;(browserFetch as jest.Mock).mockResolvedValue({ ok: false })
    render(
      <OrganizerGuard>
        <div>Contenido protegido</div>
      </OrganizerGuard>,
    )
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'))
  })
})
