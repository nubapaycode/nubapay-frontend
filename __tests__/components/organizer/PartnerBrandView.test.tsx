import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PartnerBrandView } from '@/components/organizer/PartnerBrandView'
import { browserFetch } from '@/lib/browserFetch'

const push = jest.fn()
const refresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useParams: () => ({ eventId: 'evt-1' }),
}))
jest.mock('@/lib/browserFetch', () => ({ browserFetch: jest.fn() }))
jest.mock('@/lib/authSession', () => ({
  authHeadersJson: () => ({ 'Content-Type': 'application/json' }),
  getAuthToken: () => 'tok',
  setAuthSession: jest.fn(),
}))

const mockFetch = browserFetch as jest.Mock

const json = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body })

function tenantBody(domains: { id: string; hostname: string; verified: boolean }[] = []) {
  return {
    needs_provision: false,
    tenant: { id: 't1', subdomain: 'nuba-eventos', partner_whitelabel_enabled: true, branding: {}, domains },
  }
}

/** Responde a cada endpoint; `deprovision` configurable. */
function routeFetch(opts: { tenant: unknown; deprovision?: ReturnType<typeof json> }) {
  mockFetch.mockImplementation(async (url: string) => {
    if (String(url).endsWith('/me/tenant/deprovision')) return opts.deprovision ?? json(200, { needs_provision: true, tenant: null })
    if (String(url).endsWith('/me/tenant')) return json(200, opts.tenant)
    return json(200, {}) // /auth/me y demás
  })
}

const openModal = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Usar solo nubapay.app' }))
}
const confirmButton = () => screen.getAllByRole('button', { name: 'Usar solo nubapay.app' }).at(-1)!
const deprovisionCalls = () => mockFetch.mock.calls.filter(([url]) => String(url).endsWith('/me/tenant/deprovision'))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PartnerBrandView · usar solo nubapay.app', () => {
  it('muestra el botón junto al subdominio actual', async () => {
    routeFetch({ tenant: tenantBody() })
    render(<PartnerBrandView />)
    // La dirección aparece también en la vista previa de la marca.
    expect((await screen.findAllByText('nuba-eventos.nubapay.app')).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Usar solo nubapay.app' })).toBeInTheDocument()
    expect(deprovisionCalls()).toHaveLength(0)
  })

  it('pide confirmación antes de hacer nada', async () => {
    routeFetch({ tenant: tenantBody() })
    render(<PartnerBrandView />)
    await openModal()
    expect(screen.getByText(/Vas a dejar de usar/)).toBeInTheDocument()
    expect(deprovisionCalls()).toHaveLength(0)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(deprovisionCalls()).toHaveLength(0)
  })

  it('al confirmar llama al servidor y vuelve a Cuenta', async () => {
    routeFetch({ tenant: tenantBody() })
    render(<PartnerBrandView />)
    await openModal()
    await userEvent.click(confirmButton())
    await waitFor(() => expect(push).toHaveBeenCalledWith('/eventos/evt-1/cuenta'))
    expect(deprovisionCalls()).toHaveLength(1)
    expect(deprovisionCalls()[0][1]).toEqual(expect.objectContaining({ method: 'POST' }))
  })

  it('con dominios propios avisa y no deja confirmar', async () => {
    routeFetch({ tenant: tenantBody([{ id: 'd1', hostname: 'anashe', verified: false }]) })
    render(<PartnerBrandView />)
    await openModal()
    expect(screen.getByRole('alert')).toHaveTextContent(/Primero eliminá tus dominios propios \(anashe\)/)
    expect(confirmButton()).toBeDisabled()
    await userEvent.click(confirmButton())
    expect(deprovisionCalls()).toHaveLength(0)
  })

  it('si el servidor rechaza, muestra su mensaje y no navega', async () => {
    routeFetch({
      tenant: tenantBody(),
      deprovision: json(409, { error: 'Estos enlaces de evento ya existen en nubapay.app: coco.', code: 'SLUG_CONFLICT' }),
    })
    render(<PartnerBrandView />)
    await openModal()
    await userEvent.click(confirmButton())
    expect(await screen.findByText(/ya existen en nubapay\.app: coco/)).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
    // El modal sigue abierto para poder reintentar.
    expect(screen.getByText(/Vas a dejar de usar/)).toBeInTheDocument()
  })
})
