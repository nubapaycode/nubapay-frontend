import { render, screen, within } from '@testing-library/react'

import { ParkingOwnerAccountProvider } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { ParkingOwnerShell } from '@/components/parkingOwner/ParkingOwnerShell'
import { browserFetch } from '@/lib/browserFetch'

jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/estacionamiento/pedidos',
  useSearchParams: () => new URLSearchParams(),
}))

const account = {
  base_event_id: 'base-1',
  name: 'Playa Norte',
  slug: 'playa-norte',
  accepts_event_submissions: true,
  counts: { pending: 0, approved: 0, rejected: 0 },
  payments: { mp: false, sipago: false, mobbex: false },
}

beforeAll(() => {
  // jsdom no trae matchMedia; la barra lo usa para su ancho en escritorio.
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia
})

beforeEach(() => {
  localStorage.clear()
  jest.mocked(browserFetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ account }) } as Response)
})

describe('ParkingOwnerShell', () => {
  it('usa la barra del panel de evento con las secciones del estacionamiento', async () => {
    render(
      <ParkingOwnerAccountProvider>
        <ParkingOwnerShell>
          <p>contenido</p>
        </ParkingOwnerShell>
      </ParkingOwnerAccountProvider>,
    )
    const sidebar = await screen.findByRole('complementary', { name: 'Barra lateral' })
    expect(screen.getByText('contenido')).toBeInTheDocument()

    // La tarjeta de arriba es la del estacionamiento, no "Cambiar de evento".
    expect(within(sidebar).getByText('Estacionamiento')).toBeInTheDocument()
    expect(within(sidebar).getByText('Playa Norte')).toBeInTheDocument()

    const hrefs = within(sidebar)
      .getAllByRole('link')
      .map(a => a.getAttribute('href'))
    for (const path of ['eventos', 'pedidos', 'escaner', 'cobros', 'vehiculos', 'tienda', 'avisos', 'equipo', 'configuracion']) {
      expect(hrefs).toContain(`/estacionamiento/${path}`)
    }
    // Nada del panel de un evento.
    expect(hrefs.some(h => h?.startsWith('/eventos/'))).toBe(false)
    expect(hrefs).not.toContain('/estacionamiento/resumen')
    // Sin medios conectados, el aviso lleva a los métodos de pago del estacionamiento.
    expect(hrefs).toContain('/estacionamiento/cobros/metodos-pago')
    // Sin buscador de herramientas del evento.
    expect(within(sidebar).queryByText('Buscar…')).not.toBeInTheDocument()
  })
})
