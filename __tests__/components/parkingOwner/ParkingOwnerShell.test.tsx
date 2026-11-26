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

function loginWith(modules: string[]) {
  localStorage.setItem('nubapay_token', 't')
  localStorage.setItem('nubapay_user', JSON.stringify({ id: 'u', name: 'U', email: 'u@x.com', role: 'ORGANIZER', modules }))
}

function renderShell() {
  return render(
    <ParkingOwnerAccountProvider>
      <ParkingOwnerShell>
        <p>contenido</p>
      </ParkingOwnerShell>
    </ParkingOwnerAccountProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  loginWith(['catalogo', 'parking', 'parking_owner'])
  jest.mocked(browserFetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ account }) } as Response)
})

describe('ParkingOwnerShell', () => {
  it('usa la barra del panel de evento con las secciones del estacionamiento', async () => {
    renderShell()
    const sidebar = await screen.findByRole('complementary', { name: 'Barra lateral' })
    expect(screen.getByText('contenido')).toBeInTheDocument()

    // La tarjeta de arriba es la del estacionamiento, no "Cambiar de evento".
    expect(within(sidebar).getByText('Estacionamiento')).toBeInTheDocument()
    expect(within(sidebar).getByText('Playa Norte')).toBeInTheDocument()

    const hrefs = within(sidebar)
      .getAllByRole('link')
      .map(a => a.getAttribute('href'))
    for (const path of ['eventos', 'pedidos', 'escaner', 'cobros', 'vehiculos', 'tienda', 'equipo', 'configuracion']) {
      expect(hrefs).toContain(`/estacionamiento/${path}`)
    }
    // Los avisos se mandan desde cada evento.
    expect(hrefs).not.toContain('/estacionamiento/avisos')
    // Nada del panel de un evento.
    expect(hrefs.some(h => h?.startsWith('/eventos/'))).toBe(false)
    expect(hrefs).not.toContain('/estacionamiento/resumen')
    // Sin medios conectados, el aviso lleva a los métodos de pago del estacionamiento.
    expect(hrefs).toContain('/estacionamiento/cobros/metodos-pago')
    // Sin buscador de herramientas del evento.
    expect(within(sidebar).queryByText('Buscar…')).not.toBeInTheDocument()
  })

  it('sin parking ni catálogo, la barra no muestra Vehículos ni Tienda', async () => {
    loginWith(['parking_owner'])
    renderShell()
    const sidebar = await screen.findByRole('complementary', { name: 'Barra lateral' })
    const hrefs = within(sidebar)
      .getAllByRole('link')
      .map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/estacionamiento/pedidos')
    expect(hrefs).not.toContain('/estacionamiento/vehiculos')
    expect(hrefs).not.toContain('/estacionamiento/tienda')
  })
})
