import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ParkingOwnerAccountProvider } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { ParkingOwnerSettingsView } from '@/components/parkingOwner/ParkingOwnerSettingsView'
import { browserFetch } from '@/lib/browserFetch'

jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))
jest.mock('@/lib/hooks/usePublicOrigin', () => ({ usePublicOrigin: () => 'https://www.nubapay.app' }))

const account = {
  base_event_id: 'base-1',
  name: 'Estacionamiento de Cuenta de prueba',
  slug: 'estacionamiento-de-cuenta-de-prueba',
  accepts_event_submissions: true,
  counts: { pending: 0, approved: 0, rejected: 0 },
}
const mockFetch = browserFetch as jest.MockedFunction<typeof browserFetch>

function renderView() {
  return render(
    <ParkingOwnerAccountProvider>
      <ParkingOwnerSettingsView />
    </ParkingOwnerAccountProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ParkingOwnerSettingsView · link de solicitudes', () => {
  it('edita el link y manda solo el slug cambiado', async () => {
    mockFetch.mockImplementation(async (_url, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body))
        return { ok: true, status: 200, json: async () => ({ account: { ...account, ...body } }) } as Response
      }
      return { ok: true, status: 200, json: async () => ({ account }) } as Response
    })
    const user = userEvent.setup()
    renderView()
    const input = await screen.findByLabelText('Link para solicitar eventos')
    expect(input).toHaveValue('estacionamiento-de-cuenta-de-prueba')
    expect(screen.getByText('www.nubapay.app/parking/')).toBeInTheDocument()
    await user.clear(input)
    await user.type(input, 'Playa Norte')
    // mientras se escribe se normaliza a minúsculas y guiones
    expect(input).toHaveValue('playa-norte')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => {
      const patch = mockFetch.mock.calls.find(([, init]) => init?.method === 'PATCH')
      expect(patch).toBeDefined()
      expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ slug: 'playa-norte' })
    })
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
  })

  it('muestra el error si el link ya está en uso', async () => {
    mockFetch.mockImplementation(async (_url, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return { ok: false, status: 409, json: async () => ({ error: 'Ese link ya está en uso. Probá con otro.' }) } as Response
      }
      return { ok: true, status: 200, json: async () => ({ account }) } as Response
    })
    const user = userEvent.setup()
    renderView()
    const input = await screen.findByLabelText('Link para solicitar eventos')
    await user.clear(input)
    await user.type(input, 'ocupado')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese link ya está en uso')
  })

  it('no deja guardar un link demasiado corto', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ account }) } as Response)
    const user = userEvent.setup()
    renderView()
    const input = await screen.findByLabelText('Link para solicitar eventos')
    await user.clear(input)
    await user.type(input, 'ab')
    expect(screen.getByText('Usá al menos 3 letras o números.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })
})
